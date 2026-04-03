#!/usr/bin/env sh
# Pre-commit hook: when embedding-source files are staged, regenerate embeddings
# (and resume.tex/resume.pdf when resume sources changed) and stage generated files.

set -e

STAGED=$(git diff --cached --name-only)

# Files that are inputs to generate-embeddings.ts
EMBEDDING_SOURCES="
src/data/home.json
src/data/privacy.md
src/data/projects.json
src/data/career.json
src/data/socials.json
src/data/routes.json
"

# Files that require regenerating resume.tex → resume.pdf before embeddings
RESUME_SOURCES="
src/data/career.json
resume/resume-template.tex
"

need_embeddings=0
need_resume_tex=0

for f in $EMBEDDING_SOURCES; do
  [ -z "$f" ] && continue
  if echo "$STAGED" | grep -q "^${f}$"; then
    need_embeddings=1
    break
  fi
done

for f in $RESUME_SOURCES; do
  [ -z "$f" ] && continue
  if echo "$STAGED" | grep -q "^${f}$"; then
    need_resume_tex=1
    break
  fi
done

if [ "$need_resume_tex" -eq 1 ]; then
  need_embeddings=1
fi

if [ "$need_resume_tex" -eq 0 ] && [ "$need_embeddings" -eq 0 ]; then
  exit 0
fi

if [ "$need_resume_tex" -eq 1 ]; then
  pnpm resume:tex
  pnpm resume:pdf
  git add public/resume.pdf
fi

if [ "$need_embeddings" -eq 1 ]; then
  pnpm embeddings
  git add generated/embeddings.json
fi

exit 0
