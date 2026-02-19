#!/usr/bin/env sh

set -e

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PUBLIC_DIR="$REPO_ROOT/public"
RESUME_TEX="$PUBLIC_DIR/resume.tex"
RESUME_PDF="$PUBLIC_DIR/resume.pdf"
TEX_BIN_DIR="/Library/TeX/texbin"

# BasicTeX/MacTeX install pdflatex here on macOS, but non-login shells
# (e.g. hooks/CI) may not have this path configured.
if [ -d "$TEX_BIN_DIR" ]; then
  PATH="$TEX_BIN_DIR:$PATH"
  export PATH
fi

if ! command -v pdflatex >/dev/null 2>&1; then
  echo "❌ pdflatex is required to generate public/resume.pdf."
  echo "Install LaTeX (e.g., BasicTeX or MacTeX) and retry the commit."
  exit 1
fi

if [ ! -f "$RESUME_TEX" ]; then
  echo "❌ Missing $RESUME_TEX."
  exit 1
fi

# Ensure the local custom document class is discoverable (resume.cls in public/).
if [ -n "${TEXINPUTS-}" ]; then
  TEXINPUTS="$PUBLIC_DIR:$TEXINPUTS"
else
  TEXINPUTS="$PUBLIC_DIR:"
fi
export TEXINPUTS

TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

pdflatex \
  -interaction=nonstopmode \
  -halt-on-error \
  -output-directory="$TMP_DIR" \
  "$RESUME_TEX"

if [ ! -f "$TMP_DIR/resume.pdf" ]; then
  echo "❌ Failed to generate resume.pdf from public/resume.tex."
  exit 1
fi

cp "$TMP_DIR/resume.pdf" "$RESUME_PDF"
echo "✅ Wrote public/resume.pdf"
