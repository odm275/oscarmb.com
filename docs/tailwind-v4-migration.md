# Tailwind CSS v4 Migration Runbook

This project has been migrated from Tailwind CSS v3 to v4.

## What Changed

- Updated `tailwindcss` from v3 to v4.
- Added `@tailwindcss/postcss` and switched PostCSS config to use it.
- Moved Tailwind setup to CSS-first configuration in `src/app/globals.css`.
- Removed `tailwind.config.ts`.
- Updated `components.json` for shadcn/ui v4-style Tailwind setup (`tailwind.config` is now empty).

## New Tailwind Configuration Pattern

Tailwind is now configured in `src/app/globals.css` using:

- `@import "tailwindcss"`
- `@plugin "tailwindcss-animate"`
- `@plugin "@tailwindcss/typography"`
- `@custom-variant dark (...)`
- `@theme inline { ... }`

Design tokens previously mapped in `tailwind.config.ts` are now mapped in `@theme inline`.

## Custom Utilities

The following custom utilities were moved from Tailwind plugin code to CSS utilities:

- `.ios-prevent-zoom`
- `.touch-target`

## Animations

Custom accordion keyframes and animation tokens are now defined in `src/app/globals.css`:

- `@keyframes accordion-down`
- `@keyframes accordion-up`
- `--animate-accordion-down`
- `--animate-accordion-up`

## Verification

Validation run during migration:

- `pnpm install` succeeded
- `pnpm lint` succeeded
- `pnpm build` reached `Compiled successfully` before being manually stopped while waiting in `runAfterProductionCompile` (Sentry-related post-compile step)

## If You Need to Add New Theme Tokens

Add them in `@theme inline` in `src/app/globals.css`:

```css
@theme inline {
  --color-brand: hsl(var(--brand));
  --animate-wave: wave 1.6s ease-in-out infinite;
}

@keyframes wave {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(12deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
```
