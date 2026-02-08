---
name: react-typescript-fp-practices
description: Applies React best practices, TypeScript best practices, and functional programming patterns when writing or reviewing React/TypeScript code. Use when building React components, improving type safety, refactoring toward FP style, or when the user asks for React, TypeScript, or functional programming guidance.
---

# React, TypeScript & Functional Programming Practices

## When to Use This Skill

- Writing or reviewing React components and hooks
- Adding or refining TypeScript types and generics
- Refactoring toward immutable, composable code
- Discussing React, TypeScript, or functional programming patterns

---

## React Best Practices

### Components

- Prefer **functional components** and hooks; avoid class components for new code.
- Keep components **small and focused**. Extract sub-components or custom hooks when a component grows (e.g. > 80–150 lines or multiple responsibilities).
- Use **composition** (children, render props, or slots) over prop drilling and large prop lists.
- Name components with **PascalCase** and files to match (e.g. `UserAvatar.tsx`).

### State and Data Flow

- Put state **as close as possible** to where it’s used; lift only when multiple siblings need it.
- Prefer **server components** (no `"use client"`) when there’s no interactivity or client-only dependency.
- Use **`"use client"`** only on the subtree that needs hooks, browser APIs, or event handlers.
- Avoid storing **derived data** in state; compute it during render or with `useMemo` when the computation is expensive.

### Hooks

- Respect **Rules of Hooks**: only call hooks at the top level (no conditionals, loops, or nested functions).
- Use **dependency arrays** correctly in `useEffect`, `useMemo`, and `useCallback`; include every value from the component scope that the hook uses.
- Prefer **`useCallback`** only when the function is passed to a memoized child or used in a dependency array; avoid wrapping every handler.
- Prefer **`useMemo`** for expensive computations or when referential stability is required (e.g. object/array passed to memoized children).
- **Custom hooks** should encapsulate reusable stateful logic and be named with `use` prefix.

### Performance and Rendering

- Use **`key`** on list items with a stable, unique id (not array index when list can reorder or change).
- Avoid **inline object/array literals** in JSX when they’re passed to memoized children (they break referential equality).
- Use **React.memo** for components that re-render often with the same props; don’t memoize everything by default.
- Prefer **lazy loading** (`React.lazy` + `Suspense`) for heavy or route-level components.

### Patterns

- Prefer **controlled components** for forms when you need validation, derivation, or single source of truth.
- Use **error boundaries** for granular error handling; keep them close to the failing subtree.
- Prefer **context** for theme, auth, or locale; avoid large context values that change often (split or use composition).

---

## TypeScript Best Practices

### General

- Enable **strict mode** (`strict: true` or equivalent) and fix resulting errors; avoid disabling checks to “make it compile.”
- Prefer **explicit return types** on exported functions and public API surfaces; allow inference for small internal helpers when obvious.
- **Avoid `any`**. Use `unknown` for truly unknown data and narrow with type guards; use `// @ts-expect-error` with a short comment only when necessary and document why.

### Types vs Interfaces

- Use **interfaces** for object shapes that may be extended or declared in multiple places.
- Use **types** for unions, intersections, mapped types, and tuple shapes.
- Prefer **const** assertions for literal values and readonly tuples when appropriate.

### Typing React

- Type **props** with an interface or type (e.g. `interface ButtonProps { label: string; onClick: () => void }`).
- Use **`React.ComponentProps<typeof Component>`** or **`ComponentPropsWithoutRef<'button'>`** when extending or wrapping built-in/UI components.
- Type **event handlers** precisely: `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`, etc.
- Type **children** when needed: `React.ReactNode` for flexible content; avoid `any` or untyped props.
- Use **generics** for reusable components (e.g. `<List<T>` or hooks that return typed data).

### Unions and Narrowing

- Prefer **union types** over optional fields when states are mutually exclusive; use **discriminated unions** with a common `type` or `kind` field for clear narrowing.
- Use **type guards** (`x is Type`) and **assertion functions** for runtime checks that TypeScript can use for narrowing.
- Use **exhaustive checks** (e.g. `default` with `never`) in switch/if-else for unions so missing cases are caught at compile time.

### Generics and Reuse

- Use **generics** when a type depends on another (e.g. API response, list item, form value); avoid over-typing with broad types.
- Prefer **const type parameters** where appropriate (e.g. `as const`, or generic constraints) to preserve literal types when needed.
- Document **generic constraints** with `extends` and short comments when the constraint is non-obvious.

---

## Functional Programming Practices

### Purity and Side Effects

- Prefer **pure functions**: same inputs → same outputs, no mutation of arguments or closed-over mutable state, no observable side effects.
- Isolate **side effects** (I/O, subscriptions, DOM, state updates) in a single layer (e.g. `useEffect`, event handlers, or dedicated modules); keep the rest of the logic pure.
- Avoid **hidden side effects** inside what looks like a pure function (e.g. reading/writing globals, mutating shared objects).

### Immutability

- **Do not mutate** arguments, existing objects, or arrays; return new values instead.
- Use **spread** and **updaters** for objects and arrays: `{ ...obj, key: newValue }`, `[...arr, item]`, `arr.filter(...)`, `arr.map(...)`.
- For nested updates, consider **immer** or small helpers that return new trees; avoid deep clones by default when a shallow copy suffices.

### Data Transformation

- Prefer **map, filter, reduce** (and flatMap) over imperative loops when transforming collections; keep logic declarative and chainable when readable.
- Use **early returns** and small functions to avoid deep nesting; name intermediate steps (e.g. `const validItems = items.filter(isValid)`).
- Prefer **expressions** over statements where it improves clarity (e.g. ternary for simple conditionals, expression-style callbacks).

### Composition and Abstraction

- **Compose** small functions instead of writing large ones; pass data through a pipeline (e.g. `pipe`/`compose` or chained method calls).
- Prefer **declarative** descriptions of what to compute over step-by-step mutation; keep functions **single-purpose** and easy to test.
- Use **higher-order functions** and **higher-order components/hooks** when they reduce duplication without obscuring intent.

### In React

- Keep **render logic** as pure as possible; no side effects during render.
- Use **functional updates** for state when the new state depends on the previous: `setCount(c => c + 1)`, `setItems(prev => [...prev, item])`.
- Prefer **reducer functions** (`useReducer`) for complex or multi-field state transitions; keep reducers pure and testable.

---

## Quick Checklist

**React:** Functional components, correct hooks usage, minimal and well-placed state, stable keys, composition, appropriate memoization.

**TypeScript:** Strict mode, no `any`, explicit public API types, proper event and React types, discriminated unions and narrowing.

**FP:** Pure functions where possible, immutability, map/filter/reduce, composition, side effects isolated in effects/handlers.
