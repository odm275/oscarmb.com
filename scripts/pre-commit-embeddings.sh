#!/usr/bin/env sh
# Pre-commit hook: when embedding-source files are staged, regenerate embeddings
# (and resume.tex when career/template changed) and stage the generated files.

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
public/resume.tex
"

# Files that require running resume:tex before embeddings (resume.tex is embedding input)
RESUME_SOURCES="
src/data/career.json
public/resume-template.tex
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

if [ "$need_embeddings" -eq 0 ]; then
  exit 0
fi

for f in $RESUME_SOURCES; do
  [ -z "$f" ] && continue
  if echo "$STAGED" | grep -q "^${f}$"; then
    need_resume_tex=1
    break
  fi
done

if [ "$need_resume_tex" -eq 1 ]; then
  pnpm resume:tex
  git add public/resume.tex
fi

pnpm embeddings
git add src/data/embeddings.json

exit 0
