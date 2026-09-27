# Frontend foundation

This frontend uses the Next.js App Router, TypeScript, and Tailwind CSS. Source
code lives in `src/`; the `@/*` import alias points to that directory.

## Source folders

- `src/app/` — routes and layouts. For example, `page.tsx` defines `/`.
- `src/components/` — reusable UI building blocks that are not specific to one
  business feature.
- `src/features/` — feature-specific UI and behavior, grouped by capability.
- `src/services/` — code that communicates with external systems, such as the
  NestJS REST API.
- `src/hooks/` — reusable React hooks for stateful client-side behavior.
- `src/types/` — shared TypeScript types used across the frontend.

The backend-connection panel demonstrates these boundaries:

```text
app/page.tsx
  -> features/backend-connection/backend-connection.tsx
  -> hooks/use-backend-connection.ts
  -> services/api.ts
  -> NestJS REST API
```

The feature renders a reusable status component from `components/`, while the
API connection state is described in `types/`.

Start the frontend from `agency-os\frontend`:

```powershell
npm run dev
```
