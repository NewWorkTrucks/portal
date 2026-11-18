# ffl-admin client

Admin web frontend for ffl-admin. The backend lives in `../server`.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19, TypeScript (strict)
- Tailwind CSS v4 via `@tailwindcss/turbopack`. There is no `tailwind.config`: theme tokens live in `@theme` in `app/globals.css`
- ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- npm (`package-lock.json`)

## Commands

```bash
npm run dev     # dev server on http://localhost:3000
npm run build   # production build, which also type-checks
npm run lint
```

There is no test runner yet.

## Next.js 16 notes

This Next version is newer than most training data. Check the docs bundled at `node_modules/next/dist/docs/` before relying on memory for APIs.

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Pages are dynamic by default; opt into caching explicitly with `"use cache"`, and wrap dynamic/uncached data access in `<Suspense>`.
- Use the global typed route helpers (`LayoutProps<"/">`, `PageProps<"/path">`) for layout and page props.

## Conventions

- Import alias `@/*` maps to the project root.
- Default to Server Components. Add `"use client"` only where interactivity requires it.
- Static assets go in `public/`.
