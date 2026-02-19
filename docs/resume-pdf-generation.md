# Resume PDF Generation

This project generates `/Users/oscarmejia/dev/oscarmb.com/public/resume.pdf` from
`/Users/oscarmejia/dev/oscarmb.com/public/resume.tex`.

## Prerequisites

1. Install a LaTeX distribution (smaller option):

```bash
brew install --cask basictex
```

2. Ensure the custom document class exists:

- `/Users/oscarmejia/dev/oscarmb.com/public/resume.cls`

The resume template uses `\documentclass{resume}`, so `resume.cls` must be available.

## Generate Resume PDF

From repo root:

```bash
pnpm resume:pdf
```

The script now:

- Automatically prepends `/Library/TeX/texbin` to `PATH` when present.
- Automatically prepends `public/` to `TEXINPUTS` so local `resume.cls` resolves.
- Writes output to `/Users/oscarmejia/dev/oscarmb.com/public/resume.pdf`.

## Troubleshooting

- `pdflatex is required`:
  - Confirm install: `/Library/TeX/texbin/pdflatex --version`
  - Re-run: `pnpm resume:pdf`
- `File 'resume.cls' not found`:
  - Confirm file exists at `/Users/oscarmejia/dev/oscarmb.com/public/resume.cls`
  - Confirm permissions allow reads (`ls -l public/resume.cls`)
