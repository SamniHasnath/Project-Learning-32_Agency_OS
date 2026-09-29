# Agency OS frontend

Agency OS is a frontend-only agency operations workspace built with the
existing Next.js App Router, React, TypeScript, and Tailwind CSS stack. All
business data is local mock data. The app does not connect to authentication,
payments, PDF generation, or a backend.

## Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Revenue overview, workspace metrics, recent activity, and quick actions |
| `/clients`, `/clients/new`, `/clients/[id]` | Client list, client form, and record detail |
| `/projects` | Project list |
| `/quotations`, `/quotations/new`, `/quotations/[id]`, `/quotations/[id]/preview` | Quotations, itemized draft form, detail, and printable-style preview |
| `/invoices`, `/invoices/new`, `/invoices/[id]` | Invoice list, itemized draft form, and payment recording |
| `/payments` | Payment history |
| `/templates` | Document template list |
| `/documents` | Shared documents list |
| `/settings` | Local workspace profile and regional preferences |

The root route redirects to `/dashboard`. All routes use the existing responsive
app shell and navigation rather than defining a second layout.

## Architecture

```text
App Router page -> shared workspace UI -> typed workspace service -> mock data
                                                (future API boundary)
```

- `src/app/` contains App Router pages. Dynamic route `params` are awaited to
  comply with current Next.js async route props.
- `src/components/layout/` contains the shared responsive application shell,
  navigation, and top bar.
- `src/components/workspace/workspace-ui.tsx` contains reusable list, form,
  dashboard, status, detail, and quotation preview screens.
- `src/types/domain.ts` defines shared record, status, metric, and quotation
  line-item types.
- `src/lib/mock-data/` is the centralized source of sample records.
- `src/services/workspace.ts` is the only route-facing data access boundary;
  pages request records from the service instead of importing mock fixtures.
- `src/features/` remains available for feature-specific components as the
  frontend grows.

List screens support in-page text search, status filtering, date/amount sorting,
pagination, and no-results states. Client, quotation, and invoice forms validate
required fields; quotations and invoices calculate totals from editable line items and
tax. Invoice details validate recorded payment amounts against the remaining
balance. Form submissions and settings are local UI interactions only; they do
not persist to an API.

Global links use the Agency OS brand color (`#464feb`). Shared table styles
provide subtle `#e6e6e6` row borders and `#f5f5f5` headers, with the same tokens
used throughout the list and preview tables.

## Local development

From this directory:

```powershell
npm run dev
```

Open <http://localhost:3000>. Run `npm run lint` and `npm run build` to validate
the frontend.
