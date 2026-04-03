#!/usr/bin/env bash

set -u -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRE_COMMIT_SCRIPT="$ROOT_DIR/scripts/pre-commit-embeddings.sh"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "✅ $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "❌ $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_equals() {
  local actual="$1"
  local expected="$2"
  local message="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "   Assertion failed: $message"
    echo "   Expected:"
    printf "%s\n" "$expected"
    echo "   Actual:"
    printf "%s\n" "$actual"
    return 1
  fi

  return 0
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if ! grep -qF "$needle" <<< "$haystack"; then
    echo "   Assertion failed: $message"
    echo "   Missing snippet: $needle"
    return 1
  fi

  return 0
}

setup_hook_repo() {
  local repo
  repo="$(mktemp -d)"

  mkdir -p "$repo/scripts" "$repo/src/data" "$repo/public" "$repo/generated" "$repo/.test-bin"
  cp "$PRE_COMMIT_SCRIPT" "$repo/scripts/pre-commit-embeddings.sh"
  chmod +x "$repo/scripts/pre-commit-embeddings.sh"

  printf "{}\n" > "$repo/src/data/home.json"
  printf "privacy\n" > "$repo/src/data/privacy.md"
  printf "{}\n" > "$repo/src/data/projects.json"
  printf "{}\n" > "$repo/src/data/career.json"
  printf "{}\n" > "$repo/src/data/socials.json"
  printf "{}\n" > "$repo/src/data/routes.json"
  printf "{}\n" > "$repo/generated/embeddings.json"
  printf "resume pdf\n" > "$repo/public/resume.pdf"
  printf "notes\n" > "$repo/notes.txt"

  cat > "$repo/.test-bin/pnpm" << 'EOF'
#!/usr/bin/env sh
set -eu

LOG_FILE="${PNPM_LOG_FILE:?missing PNPM_LOG_FILE}"
echo "$*" >> "$LOG_FILE"

case "$*" in
  "resume:pdf")
    printf "generated pdf\n" > public/resume.pdf
    ;;
  "embeddings")
    printf "{\"ok\":true}\n" > generated/embeddings.json
    ;;
  *)
    echo "Unexpected pnpm command: $*" >&2
    exit 1
    ;;
esac
EOF
  chmod +x "$repo/.test-bin/pnpm"

  git -C "$repo" init -q
  git -C "$repo" config user.email "test@example.com"
  git -C "$repo" config user.name "Test User"
  git -C "$repo" add .
  git -C "$repo" commit -qm "init"

  printf "%s" "$repo"
}

run_hook_in_repo() {
  local repo="$1"
  local log_file="$2"

  (
    cd "$repo" || exit 1
    PATH="$repo/.test-bin:$PATH" PNPM_LOG_FILE="$log_file" ./scripts/pre-commit-embeddings.sh
  )
}

test_hook_unrelated_file() {
  local repo log_file status command_log
  repo="$(setup_hook_repo)"
  log_file="$repo/pnpm.log"
  : > "$log_file"

  printf "changed\n" >> "$repo/notes.txt"
  git -C "$repo" add notes.txt

  run_hook_in_repo "$repo" "$log_file"
  status=$?
  command_log="$(cat "$log_file")"

  rm -rf "$repo"

  if [[ $status -ne 0 ]]; then
    echo "   Hook exited with status $status"
    return 1
  fi

  assert_equals "$command_log" "" "Hook should not run pnpm commands for unrelated staged files"
}

test_hook_career_json() {
  local repo log_file status command_log staged
  repo="$(setup_hook_repo)"
  log_file="$repo/pnpm.log"
  : > "$log_file"

  printf "{\"changed\":true}\n" > "$repo/src/data/career.json"
  git -C "$repo" add src/data/career.json

  run_hook_in_repo "$repo" "$log_file"
  status=$?
  command_log="$(cat "$log_file")"
  staged="$(git -C "$repo" diff --cached --name-only)"

  rm -rf "$repo"

  if [[ $status -ne 0 ]]; then
    echo "   Hook exited with status $status"
    return 1
  fi

  assert_equals "$command_log" $'resume:pdf\nembeddings' "Expected resume:pdf then embeddings for staged career.json" || return 1
  assert_contains "$staged" "public/resume.pdf" "Expected resume.pdf staged" || return 1
  assert_contains "$staged" "generated/embeddings.json" "Expected embeddings.json staged"
}

test_hook_embedding_source_no_resume() {
  local repo log_file status command_log staged
  repo="$(setup_hook_repo)"
  log_file="$repo/pnpm.log"
  : > "$log_file"

  printf "{\"changed\":true}\n" > "$repo/src/data/projects.json"
  git -C "$repo" add src/data/projects.json

  run_hook_in_repo "$repo" "$log_file"
  status=$?
  command_log="$(cat "$log_file")"

  rm -rf "$repo"

  if [[ $status -ne 0 ]]; then
    echo "   Hook exited with status $status"
    return 1
  fi

  assert_equals "$command_log" $'embeddings' "Expected only embeddings for non-resume embedding source"
}

run_test() {
  local name="$1"
  local fn="$2"

  if "$fn"; then
    pass "$name"
  else
    fail "$name"
  fi
}

main() {
  run_test "Hook skips pipeline for unrelated staged files" test_hook_unrelated_file
  run_test "Hook runs resume:pdf -> embeddings for staged career.json" test_hook_career_json
  run_test "Hook runs only embeddings for non-resume embedding source" test_hook_embedding_source_no_resume

  echo ""
  echo "Passed: $PASS_COUNT"
  echo "Failed: $FAIL_COUNT"

  if [[ $FAIL_COUNT -ne 0 ]]; then
    exit 1
  fi
}

main "$@"
