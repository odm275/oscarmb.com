# Oscar's Portfolio

A clean, minimal portfolio website built with Next.js 14, Tailwind CSS, and Shadcn UI. Features an AI chatbot with RAG, MDX blog with Mermaid diagrams, and email contact form. Credit to Ang Wei Feng (Ted) for the template.

## Live Demo

Check it out here: **[oscarmb.com](https://oscarmb.com)**

## Features

- Minimal design with Shadcn UI
- Light/dark mode toggle
- AI chatbot (Oscar AI) with RAG-powered responses
- MDX blog with Mermaid diagram support
- Contact form with email integration
- Responsive mobile design
- Sentry error monitoring

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + Shadcn UI
- AI SDK (OpenAI + Google/Gemini)
- Velite + next-mdx-remote (MDX processing)
- Google gemini-embedding-001 (embeddings)
- Sentry (error monitoring)
- Resend (email)
- Playwright (e2e testing)
- Vercel (hosting)

## Getting Started

```bash
git clone https://github.com/odm275/oscarmb.com my-portfolio
cd my-portfolio
pnpm install
cp .env.example .env.local
# add your API keys to .env.local
pnpm dev
```

## Environment Variables

See .env.example

## Customization

- Update personal info in `src/data/*.json`
- Replace projects in `src/data/projects.json`
- Add blog posts in `src/content/posts/` (MDX format)
- Replace your resume with `public/resume.pdf` (or regenerate via `pnpm resume`)
- Modify chatbot prompt in `src/app/api/chat/route.ts`

## Resume PDF Workflow

- Install Playwright browsers: `npx playwright install chromium`
- Edit experience data in `src/data/career.json`
- Edit layout/skills in `src/components/resume/ResumeDocument.tsx`
- Build PDF: `pnpm resume:pdf`

## Deployment

Deploy with [Vercel](https://vercel.com/):

1. Push your fork to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

## Deployment Guardian

This repo includes a deployment failure guardian for Vercel production deployments:

- `pnpm deploy:scan` - scan failed production deployments and output structured JSON root-cause data.
- `pnpm deploy:guardian` - run the full incident workflow (issue creation/dedupe, one-attempt remediation, PR/escalation, and incident closure checks).
- `pnpm test:deploy-agent` - run deploy-agent unit tests.

Operational details are documented in `docs/deploy-guardian.md`.

## License

MIT

---

Based on [tedawf.com](https://github.com/tedawf/tedawf.com) template.
