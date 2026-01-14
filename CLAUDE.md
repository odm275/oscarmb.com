# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website built with Next.js 14, featuring an AI chatbot powered by RAG (Retrieval-Augmented Generation), a blog system backed by the TACOS API, and dynamic content management.

**Tech Stack:**
- Next.js 14 (App Router, Node Runtime for chat)
- TypeScript
- Tailwind CSS + Shadcn UI
- Google Gemini 2.5 Flash Lite (chat responses - FREE tier: 1500 requests/day)
- Transformers.js (local embeddings - 100% FREE)
- Vercel AI SDK v6
- TACOS API (external blog backend)
- Resend (email)
- pnpm (package manager)

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (accessible on network at 0.0.0.0)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Format code
pnpm format

# Generate embeddings for RAG system (100% FREE - uses local Transformers.js)
pnpm embeddings

# Extract content from data files
pnpm extract

# Push content to TACOS backend (production only)
pnpm push
```

## Architecture

### RAG (Retrieval-Augmented Generation) System

The AI chatbot uses a **100% FREE local embedding system** with runtime RAG:

1. **Content sources** (`src/data/*.json`): Personal data stored as JSON files (home, career, projects, socials, routes)
2. **Embedding generation** (`scripts/generate-embeddings.ts`): Extracts and embeds content using **Transformers.js** (local, free)
   - Model: `Xenova/all-MiniLM-L6-v2` (384-dimensional embeddings)
   - Downloads ~25MB model on first run, then cached locally
   - Run with: `pnpm embeddings`
3. **Storage** (`src/data/embeddings.json`): Pre-generated embeddings stored as JSON, loaded at runtime
4. **Runtime embedding** (`src/lib/embeddings.ts`): Shared utility using Transformers.js for query embedding
5. **Retrieval** (`src/lib/rag.ts`): Uses cosine similarity to find relevant context for user queries
6. **Chat API** (`src/app/api/chat/route.ts`): Node runtime (not Edge) that embeds queries locally, retrieves context, and streams responses

**Key characteristics:**
- **Embeddings are FREE** - uses local Transformers.js model (no API costs!)
- Both offline generation (build time) and online queries (runtime) use the same free model
- No vector database needed - embeddings stored in JSON
- Context retrieval happens in-memory using cosine similarity
- Fast, completely free for embeddings, only pay for LLM responses

**Cost breakdown:**
- Embedding generation: **$0.00** (local Transformers.js)
- Runtime query embedding: **$0.00** (local Transformers.js)
- Chat responses: **FREE** for 1500 requests/day with Google Gemini 2.5 Flash Lite

**To update chatbot knowledge:**
1. Modify content in `src/data/*.json` files
2. Run `pnpm embeddings` to regenerate embeddings.json (free!)
3. Rebuild and deploy

### Blog System (TACOS Integration)

Blog posts are managed by an external backend service called TACOS:

- **Post fetching** (`src/lib/posts.ts`): Fetches posts from TACOS API with authentication
- **Content management**: Blog posts are managed via Obsidian + LiveSync plugin → CouchDB → TACOS
- **Content extraction** (`scripts/extract-content.ts`): Extracts site content for TACOS indexing
- **Content push** (`scripts/push-content.ts`): Sends extracted content to TACOS backend (production only)

**Environment variables required:**
- `TACOS_API_URL`: Backend API endpoint
- `TACOS_API_KEY`: Authentication key for TACOS API

### Data-Driven Content

Most content is defined in `src/data/*.json` files:
- `home.json`: Homepage introduction and hero section
- `career.json`: Work experience timeline
- `projects.json`: Project cards with descriptions, tags, and links
- `socials.json`: Social media links
- `routes.json`: Navigation structure
- `privacy.md`: Privacy policy

**This design allows non-developers to update content without touching React code.**

### Component Architecture

- **UI components** (`src/components/ui/`): Shadcn UI components (Button, Card, Dialog, etc.)
- **Feature components** (`src/components/`): Application-specific components
  - `Chat*.tsx`: AI chatbot components with session management
  - `Posts*.tsx`: Blog post listing and search
  - `Timeline*.tsx`: Career experience timeline
  - `ProjectCard.tsx`: Project showcase cards
- **Layout components**: `Header`, `Footer`, `Providers` (theme, toast)

**App Router pages:**
- `/` - Homepage with introduction
- `/projects` - Project showcase
- `/blog` - Blog posts from TACOS API
- `/blog/[slug]` - Individual blog post
- `/contact` - Contact form (Resend integration)
- `/privacy` - Privacy policy
- `/api/chat` - AI chatbot endpoint (Edge Runtime)
- `/api/views/[slug]` - View counter endpoint

## Key Patterns

### Path Aliases
Use `@/` to import from `src/`:
```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
```

### TypeScript Configuration
- Uses strict mode
- ESNext module resolution with bundler strategy
- JSON imports enabled for embedding data
- ts-node configured for CommonJS for scripts

### Styling
- Tailwind CSS with custom configuration
- CSS variables for theming (light/dark mode)
- Calistoga font for headings (`font-serif` class)
- Inter font for body text (`font-sans` class)

### Node Runtime for Chat
The chat API uses Node Runtime (not Edge) because Transformers.js requires Node.js APIs for local model inference:
```typescript
// Note: Using Node runtime (default), not Edge
// This is required for Transformers.js local embedding generation
```

### API Authentication
TACOS API endpoints require the `X-TACOS-Key` header for authentication.

## Important Notes

- **Package manager**: This project uses pnpm. Always use `pnpm install`, not npm or yarn.
- **Embeddings are FREE**: Uses Transformers.js locally - no API keys needed for embeddings!
- **Chat responses are FREE**: Google Gemini 2.5 Flash Lite offers 1500 free requests/day - just need `GOOGLE_GENERATIVE_AI_API_KEY`
- **Embeddings file**: The embeddings.json file is generated, don't edit manually. Regenerate with `pnpm embeddings` after data changes (100% free).
- **Script runner**: Uses `tsx` instead of `ts-node` for better ESM support with Transformers.js.
- **Runtime**: Chat API uses Node runtime (not Edge) because Transformers.js requires Node APIs for local model inference.
- **Content push**: The `push-content.ts` script only runs in production (`VERCEL_ENV=production`) to avoid pushing preview/development content.
- **Blog content**: Blog posts are NOT stored in this repository - they come from the TACOS backend API.
- **Environment variables**: See `.env.example` for required variables. Use `.env.local` for development.
