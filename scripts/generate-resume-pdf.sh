#!/usr/bin/env sh

set -e

if ! command -v pdflatex >/dev/null 2>&1; then
  echo "❌ pdflatex is required to generate public/resume.pdf."
  echo "Install LaTeX (e.g., BasicTeX or MacTeX) and retry the commit."
  exit 1
fi

TMP_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

pdflatex \
  -interaction=nonstopmode \
  -halt-on-error \
  -output-directory="$TMP_DIR" \
  public/resume.tex

if [ ! -f "$TMP_DIR/resume.pdf" ]; then
  echo "❌ Failed to generate resume.pdf from public/resume.tex."
  exit 1
fi

cp "$TMP_DIR/resume.pdf" public/resume.pdf
echo "✅ Wrote public/resume.pdf"
