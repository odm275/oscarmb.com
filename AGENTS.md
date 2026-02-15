# Repository Guidelines

## Project Structure & Module Organization
The site runs on Next.js 14 App Router. Pages, layouts, and route handlers live under `src/app` (e.g., `blog`, `projects`, `api`). Shared UI and Radix-based primitives are in `src/components`, while cross-cutting logic sits in `src/lib`, data constants in `src/data`, and React contexts in `src/contexts`. Static assets belong in `public/`, and automation scripts reside in `scripts/` (executed with `ts-node`).

## Build, Test, and Development Commands
Use `npm run dev` for a hot-reloading local server on all interfaces. `npm run build` compiles the production bundle. `npm run lint` enforces Next.js/ESLint rules, and `npm run format` applies Prettier with the Tailwind plugin. Call `npm run start` to serve the optimized build.

## Coding Style & Naming Conventions
TypeScript is required; favor server components unless interactivity demands `"use client"`. Follow functional component patterns, camelCase for functions/variables, and PascalCase for components and context providers. Tailwind classes should be organized with `clsx`/`cva` helpers; extract reusable variants into `src/lib`. Two-space indentation and trailing commas come from Prettier—do not hand-format files. Keep MDX frontmatter keys lowercase and kebab-case slugs.

## Content Automation & Configuration Tips
Guard secrets by using `dotenv` and never committing `.env*`. When editing MDX, keep assets in `public/blog/<slug>/` and update `src/data` entries if metadata changes. Verify Resend email templates inside `src/components/email` before deploying.

## Pre-commit: Embeddings and resume.tex
A Husky pre-commit hook ensures embeddings stay in sync when you change content that feeds the RAG chatbot. If any of these files are **staged** for commit, the hook runs `pnpm resume:tex` (when needed) and `pnpm embeddings`, then stages the updated `src/data/embeddings.json` and `public/resume.tex` so they are included in the same commit.

**Embedding-source files** (editing and staging any of these triggers the hook): `src/data/home.json`, `src/data/privacy.md`, `src/data/projects.json`, `src/data/career.json`, `src/data/socials.json`, `src/data/routes.json`, `public/resume.tex`. If `src/data/career.json` or `public/resume-template.tex` is staged, the hook also regenerates `public/resume.tex` before embeddings.

Requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` for `pnpm embeddings` to succeed. To skip the hook (e.g. when the key is unavailable), use `git commit --no-verify`.

## Resume PDF Generation
Experience content is sourced from `src/data/career.json`. The file `public/resume.tex` is generated from it (EXPERIENCE section only; preamble, SKILLS, and header stay in `public/resume-template.tex`). When updating the resume:

1. **Edit** `src/data/career.json` (job titles, dates, bullets, optional `location` per job).
2. **Regenerate LaTeX**: Run `pnpm resume:tex` to write `public/resume.tex` from the template and career data.
3. **Prerequisites**: Install a LaTeX distribution (macOS: `brew install --cask mactex-no-gui` or install BasicTeX).
4. **Compile**: Run `pdflatex -output-directory=public public/resume.tex` to generate `public/resume.pdf`.
5. **Update embeddings**: Run `pnpm embeddings` to regenerate chat AI context with the latest resume content (or rely on the pre-commit hook when you commit).
6. **Commit**: Commit `career.json`, `resume.tex`, and `resume.pdf` together to keep them in sync.

## Skills
Skill-specific guidance is defined in `.cursor/skills/**/SKILL.md`.

Current repository-local skill:
- `.cursor/skills/react-typescript-fp-practices/SKILL.md`

Rules:
- Read the relevant `SKILL.md` when the task matches that skill.
- In case of conflict, repository-wide rules in `AGENTS.md` take precedence.
