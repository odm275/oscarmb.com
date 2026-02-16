#!/usr/bin/env bash

set -u -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRE_COMMIT_SCRIPT="$ROOT_DIR/scripts/pre-commit-embeddings.sh"
PDF_SCRIPT="$ROOT_DIR/scripts/generate-resume-pdf.sh"

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

  mkdir -p "$repo/scripts" "$repo/src/data" "$repo/public" "$repo/.test-bin"
  cp "$PRE_COMMIT_SCRIPT" "$repo/scripts/pre-commit-embeddings.sh"
  chmod +x "$repo/scripts/pre-commit-embeddings.sh"

  printf "{}\n" > "$repo/src/data/home.json"
  printf "privacy\n" > "$repo/src/data/privacy.md"
  printf "{}\n" > "$repo/src/data/projects.json"
  printf "{}\n" > "$repo/src/data/career.json"
  printf "{}\n" > "$repo/src/data/socials.json"
  printf "{}\n" > "$repo/src/data/routes.json"
  printf "{}\n" > "$repo/src/data/embeddings.json"
  printf "resume tex\n" > "$repo/public/resume.tex"
  printf "resume template\n" > "$repo/public/resume-template.tex"
  printf "resume pdf\n" > "$repo/public/resume.pdf"
  printf "notes\n" > "$repo/notes.txt"

  cat > "$repo/.test-bin/pnpm" << 'EOF'
#!/usr/bin/env sh
set -eu

LOG_FILE="${PNPM_LOG_FILE:?missing PNPM_LOG_FILE}"
echo "$*" >> "$LOG_FILE"

case "$*" in
  "resume:tex")
    printf "generated tex\n" > public/resume.tex
    ;;
  "resume:pdf")
    printf "generated pdf\n" > public/resume.pdf
    ;;
  "embeddings")
    printf "{\"ok\":true}\n" > src/data/embeddings.json
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

test_hook_resume_tex() {
  local repo log_file status command_log staged
  repo="$(setup_hook_repo)"
  log_file="$repo/pnpm.log"
  : > "$log_file"

  printf "changed tex\n" >> "$repo/public/resume.tex"
  git -C "$repo" add public/resume.tex

  run_hook_in_repo "$repo" "$log_file"
  status=$?
  command_log="$(cat "$log_file")"
  staged="$(git -C "$repo" diff --cached --name-only)"

  rm -rf "$repo"

  if [[ $status -ne 0 ]]; then
    echo "   Hook exited with status $status"
    return 1
  fi

  assert_equals "$command_log" $'resume:pdf\nembeddings' "Expected resume:pdf then embeddings when resume.tex is staged" || return 1
  assert_contains "$staged" "public/resume.pdf" "Expected resume.pdf staged" || return 1
  assert_contains "$staged" "src/data/embeddings.json" "Expected embeddings.json staged"
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

  assert_equals "$command_log" $'resume:tex\nresume:pdf\nembeddings' "Expected full pipeline for staged career.json" || return 1
  assert_contains "$staged" "public/resume.tex" "Expected resume.tex staged" || return 1
  assert_contains "$staged" "public/resume.pdf" "Expected resume.pdf staged" || return 1
  assert_contains "$staged" "src/data/embeddings.json" "Expected embeddings.json staged"
}

test_hook_resume_template() {
  local repo log_file status command_log staged
  repo="$(setup_hook_repo)"
  log_file="$repo/pnpm.log"
  : > "$log_file"

  printf "changed template\n" >> "$repo/public/resume-template.tex"
  git -C "$repo" add public/resume-template.tex

  run_hook_in_repo "$repo" "$log_file"
  status=$?
  command_log="$(cat "$log_file")"
  staged="$(git -C "$repo" diff --cached --name-only)"

  rm -rf "$repo"

  if [[ $status -ne 0 ]]; then
    echo "   Hook exited with status $status"
    return 1
  fi

  assert_equals "$command_log" $'resume:tex\nresume:pdf\nembeddings' "Expected full pipeline for staged resume-template.tex" || return 1
  assert_contains "$staged" "public/resume.tex" "Expected resume.tex staged" || return 1
  assert_contains "$staged" "public/resume.pdf" "Expected resume.pdf staged" || return 1
  assert_contains "$staged" "src/data/embeddings.json" "Expected embeddings.json staged"
}

setup_pdf_workspace() {
  local workspace
  workspace="$(mktemp -d)"
  mkdir -p "$workspace/scripts" "$workspace/public"
  cp "$PDF_SCRIPT" "$workspace/scripts/generate-resume-pdf.sh"
  chmod +x "$workspace/scripts/generate-resume-pdf.sh"
  printf "\\documentclass{article}\n\\begin{document}\nResume\n\\end{document}\n" > "$workspace/public/resume.tex"
  printf "%s" "$workspace"
}

test_pdf_script_missing_pdflatex() {
  local workspace no_pdflatex_dir output status
  workspace="$(setup_pdf_workspace)"
  no_pdflatex_dir="$workspace/no-pdflatex"
  mkdir -p "$no_pdflatex_dir"

  output="$(
    cd "$workspace" || exit 1
    PATH="$no_pdflatex_dir:/usr/bin:/bin" sh scripts/generate-resume-pdf.sh 2>&1
  )"
  status=$?

  rm -rf "$workspace"

  if [[ $status -eq 0 ]]; then
    echo "   Expected non-zero exit code when pdflatex is missing"
    return 1
  fi

  assert_contains "$output" "pdflatex is required" "Expected missing-pdflatex message"
}

write_fake_pdflatex_success() {
  local target="$1"

  cat > "$target" << 'EOF'
#!/usr/bin/env sh
set -eu

OUTPUT_DIR=""
for arg in "$@"; do
  case "$arg" in
    -output-directory=*)
      OUTPUT_DIR="${arg#-output-directory=}"
      ;;
  esac
done

if [ -z "$OUTPUT_DIR" ]; then
  echo "missing output directory" >&2
  exit 1
fi

printf "fake pdf\n" > "$OUTPUT_DIR/resume.pdf"
EOF
  chmod +x "$target"
}

test_pdf_script_success() {
  local workspace bin_dir status
  workspace="$(setup_pdf_workspace)"
  bin_dir="$workspace/test-bin"
  mkdir -p "$bin_dir"
  write_fake_pdflatex_success "$bin_dir/pdflatex"

  (
    cd "$workspace" || exit 1
    PATH="$bin_dir:/usr/bin:/bin" sh scripts/generate-resume-pdf.sh
  )
  status=$?

  if [[ $status -ne 0 ]]; then
    rm -rf "$workspace"
    echo "   Expected success from PDF script with fake pdflatex"
    return 1
  fi

  if [[ ! -f "$workspace/public/resume.pdf" ]]; then
    rm -rf "$workspace"
    echo "   Expected public/resume.pdf to be created"
    return 1
  fi

  rm -rf "$workspace"
  return 0
}

write_fake_pdflatex_failure() {
  local target="$1"

  cat > "$target" << 'EOF'
#!/usr/bin/env sh
exit 1
EOF
  chmod +x "$target"
}

test_pdf_script_pdflatex_failure() {
  local workspace bin_dir status
  workspace="$(setup_pdf_workspace)"
  bin_dir="$workspace/test-bin"
  mkdir -p "$bin_dir"
  write_fake_pdflatex_failure "$bin_dir/pdflatex"

  (
    cd "$workspace" || exit 1
    PATH="$bin_dir:/usr/bin:/bin" sh scripts/generate-resume-pdf.sh >/dev/null 2>&1
  )
  status=$?

  rm -rf "$workspace"

  if [[ $status -eq 0 ]]; then
    echo "   Expected non-zero exit code when pdflatex fails"
    return 1
  fi

  return 0
}

write_fake_pdflatex_without_pdf() {
  local target="$1"

  cat > "$target" << 'EOF'
#!/usr/bin/env sh
exit 0
EOF
  chmod +x "$target"
}

test_pdf_script_missing_output_pdf() {
  local workspace bin_dir output status
  workspace="$(setup_pdf_workspace)"
  bin_dir="$workspace/test-bin"
  mkdir -p "$bin_dir"
  write_fake_pdflatex_without_pdf "$bin_dir/pdflatex"

  output="$(
    cd "$workspace" || exit 1
    PATH="$bin_dir:/usr/bin:/bin" sh scripts/generate-resume-pdf.sh 2>&1
  )"
  status=$?

  rm -rf "$workspace"

  if [[ $status -eq 0 ]]; then
    echo "   Expected non-zero exit code when resume.pdf is not produced"
    return 1
  fi

  assert_contains "$output" "Failed to generate resume.pdf" "Expected missing-output error message"
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
  run_test "Hook runs resume:pdf + embeddings for staged resume.tex" test_hook_resume_tex
  run_test "Hook runs resume:tex -> resume:pdf -> embeddings for staged career.json" test_hook_career_json
  run_test "Hook runs full pipeline for staged resume-template.tex" test_hook_resume_template
  run_test "PDF script fails when pdflatex is missing" test_pdf_script_missing_pdflatex
  run_test "PDF script succeeds when pdflatex produces resume.pdf" test_pdf_script_success
  run_test "PDF script fails when pdflatex returns non-zero" test_pdf_script_pdflatex_failure
  run_test "PDF script fails when pdflatex does not produce resume.pdf" test_pdf_script_missing_output_pdf

  echo ""
  echo "Passed: $PASS_COUNT"
  echo "Failed: $FAIL_COUNT"

  if [[ $FAIL_COUNT -ne 0 ]]; then
    exit 1
  fi
}

main "$@"
