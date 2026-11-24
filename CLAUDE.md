# ffl-admin client

Admin web frontend for ffl-admin. The backend lives in `../server`.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19, TypeScript (strict)
- Tailwind CSS v4 via `@tailwindcss/turbopack`. There is no `tailwind.config`: theme tokens live in `@theme` in `src/app/globals.css`
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

- Source code lives in `src/` (routes in `src/app/`). Import alias `@/*` maps to `src/`.
- Default to Server Components. Add `"use client"` only where interactivity requires it.
- Static assets go in `public/`.
- Put TypeScript types in their own files under `src/types/` (imported as `@/types/...`), not inline in components or pages.
- Use function components only, never class components.
- Use meaningful, descriptive names for state, variables and functions (e.g. `handleClickSubmitButton`, `getListOfKanbanItems`). No single-letter names.
- Every menu item (context menus, dropdowns, action lists) has an icon beside its label. Use `lucide-react` icons; a user avatar (`@/components/user-avatar`) counts as the icon for a person.
- Error states name the real cause in plain words and the next step (for example "Your sign-in has expired. Sign out and sign in again."), never a generic "Couldn't load X". Keep the raw `code: message` in a collapsed "Technical details" section. Map known Supabase codes with `describeRequestError` in `src/lib/request-error.ts` rather than writing a new generic message. Show failures from event handlers and background loads as a toast with `showRequestErrorToast` from `src/lib/toast.ts`, and never use `window.alert`.
- Forms are their own components in `src/components/forms/`, never written inline inside a dialog, page or other component. The form owns its fields, validation and submit/cancel buttons and takes `initialValues`/`onSubmit`/`onCancel` props, so it can be reused anywhere. Dialogs and pages only wrap it.
- Backend calls go through functions in `src/api/`. When an endpoint doesn't exist yet, the function body is a `// TODO:` naming the endpoint plus a `window.alert(...)` describing the call, and the UI updates local state afterwards. Replace these when the backend is integrated.

## File structure

Order the contents of every page, component or file like this:

1. Import statements
2. File-wide constants
3. The component itself

Inside a component, order the body like this:

1. API calls (hooks or calls using imported API functions)
2. React state (`useState`, `useReducer`)
3. Memoized values (`useMemo`)
4. Functions and handlers
5. Memoized functions (`useCallback`)
6. The returned JSX

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { getListOfKanbanItems } from "@/api/kanban";

const MAX_VISIBLE_ITEMS = 20;

export default function KanbanBoard() {
  const kanbanItems = getListOfKanbanItems();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const visibleKanbanItems = useMemo(
    () => kanbanItems.slice(0, MAX_VISIBLE_ITEMS),
    [kanbanItems],
  );

  function handleClickClearSelection() {
    setSelectedItemId(null);
  }

  const handleClickKanbanItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  return (
    <section>
      <p>Selected: {selectedItemId ?? "none"}</p>
      <button onClick={handleClickClearSelection}>Clear selection</button>
      <ul>
        {visibleKanbanItems.map((kanbanItem) => (
          <li key={kanbanItem.id} onClick={() => handleClickKanbanItem(kanbanItem.id)}>
            {kanbanItem.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
```
