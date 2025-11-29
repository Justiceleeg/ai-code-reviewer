# CLAUDE.md - AI Assistant Guidelines

## Project Overview

**AI Code Review** - A web app for intelligent, contextual code review. Users paste code, select lines, get AI feedback via inline threads.

## Key Documents

- `docs/prd.md` - Product requirements, tech stack, file structure
- `docs/tasks.md` - Implementation plan with task checklist

Read these first. They are the source of truth.

## Coding Conventions

### Files
- One component per file, max 150 lines
- Barrel exports (`index.ts`) in each component folder
- Business logic in `lib/`, UI in `components/`

### Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Stores: `useAppStore.ts`

### TypeScript
- Shared types in `types/index.ts`
- Prefer interfaces over types for objects
- Strict mode enabled

### React
- Functional components, named exports
- `'use client'` only when needed
- Careful with useEffect dependencies

## Common Pitfalls

1. **useEffect loops** - Avoid objects/arrays in deps that recreate each render
2. **Monaco SSR** - Must use dynamic import with `ssr: false`
3. **Zustand hydration** - Handle SSR/client mismatch with persist middleware
4. **Tailwind v4** - New config format differs from v3
5. **Zustand v5** - API changed; no `create` wrapper needed

## Implementation Order

Follow phases in `docs/tasks.md` sequentially (1-9).

## When in Doubt

1. Check `docs/prd.md` for requirements
2. Keep components small and focused
3. Prefer simplicity over cleverness
4. Ask before deviating from PRD
