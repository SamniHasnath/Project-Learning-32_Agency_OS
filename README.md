# Agency OS

Multi-tenant quotation, invoice, payment and document-template management for agencies.

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** NestJS 11, Prisma 7, PostgreSQL 16
- **PDF:** server-side vector PDFs with `pdfkit` (real text, not screenshots)
<img width="698" height="383" alt="image" src="https://github.com/user-attachments/assets/7316905e-ef12-4c7e-be82-36ddb121d07e" />

## Features

| Area | What you get |
|---|---|
| Quotations | Create/edit drafts, pick an existing client (details auto-fill), multiple line items, discount (fixed or %), tax, notes, terms, expiry date, template selection, preview, print, PDF. Statuses `DRAFT → SENT → ACCEPTED / REJECTED / EXPIRED`, plus `VOID`. |
| Invoices | Direct creation or conversion from an **accepted** quotation (client, items, totals, notes, terms and reference copied). Statuses `DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID`. |
| Payments | Partial payments, paid/outstanding tracking, overpayment rejected, payment history per invoice. |
| Templates | Reusable per-agency templates: colours, font, logo on/off, title, section order & visibility, footer. One default per document type. |
| Tenancy | Every record belongs to an agency; the agency id comes only from the signed JWT. |
| History | Each document stores frozen snapshots of the client, agency and template, so later edits never change issued documents. |
| Numbering | `QT-2026-0001`, `INV-2026-0001`, `PAY-2026-0001`: per agency, per year, gap-free and concurrency-safe. |
| Automation | Hourly job marks overdue invoices `OVERDUE` and expired quotations `EXPIRED`. |

## Quick start (Docker, recommended)

```bash
cp .env.example .env            # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up -d --build
docker compose exec api npm run db:seed   # optional demo data
```

- Web app: http://localhost:3000. Demo login: `demo@agencyos.dev` / `Demo1234!` (after seeding), or register a new agency.
- API: http://localhost:3001/api. Interactive docs: http://localhost:3001/api/docs
- Health: http://localhost:3001/api/health

The API container applies database migrations itself on start (`prisma migrate deploy`).

## Local development

Requirements: Node 22+, PostgreSQL 16 (or `docker run -d --name agency-os-db -e POSTGRES_USER=agency_os -e POSTGRES_PASSWORD=agency_os_dev -e POSTGRES_DB=agency_os -p 5434:5432 postgres:16-alpine`).

```bash
# API
cd backend
cp .env.example .env              # fill DATABASE_URL, TEST_DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate                # create/upgrade schema
npm run db:seed                   # optional demo data
npm run start:dev                 # http://localhost:3001/api

# Web
cd ../frontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                       # http://localhost:3000
```

## Tests

| Command | What it covers |
|---|---|
| `cd backend && npm test` | Unit: money calculations (Decimal, rounding, discount/tax), status workflows, numbering format, template normalisation |
| `cd backend && npm run test:e2e` | API integration against a real PostgreSQL (`TEST_DATABASE_URL`, wiped each run): auth, tenant isolation, quotation → invoice conversion (including 8 concurrent clicks producing exactly one invoice), payments (1000 / 800 / +500 is rejected, plus concurrent overpayment), concurrent numbering, snapshot protection, templates, PDF |
| `cd frontend && npm run test:e2e` | Browser (Playwright, Chrome): register → client → quotation → send → accept → PDF → convert (double-click) → partial payment → overpayment blocked → paid; cross-agency access blocked; auth redirect. Needs the stack running. |

## Deploying

Any container host works (Render, Railway, Fly.io, ECS, a VM with Docker):

1. Provision PostgreSQL and set `DATABASE_URL` for the API.
2. Deploy `backend/` (Dockerfile) with `JWT_SECRET` (48+ random chars), `FRONTEND_URL` (your web origin, comma-separate multiple) and `PORT`.
3. Deploy `frontend/` (Dockerfile) with build arg `NEXT_PUBLIC_API_URL` set to the public API URL.
4. Serve both over HTTPS. Set `SWAGGER=false` on the API if you don't want public docs.

## Project structure

```text
backend/src
  auth/                 JWT login/register, global guard, @CurrentAgency()
  common/
    money/              document-calculator (single source of truth for totals)
    numbering/          atomic per-agency sequence (INSERT … ON CONFLICT … RETURNING)
    documents/          snapshots, row locks, status workflow, shared DTOs
  quotations/ invoices/ payments/ clients/ projects/ settings/ dashboard/
  document-templates/   template CRUD + built-in starter templates
  pdf/                  template-driven PDF renderer
  jobs/                 hourly EXPIRED / OVERDUE sweep
frontend/src
  app/                  routes (quotations, invoices, payments, templates, documents, …)
  features/documents/   shared form, renderer (preview/print), PDF actions, status rules
  features/…            quotation/invoice detail, template editor, client/project forms
  components/           layout shell, data table, UI primitives
  lib/ services/ types/ API client, formatting, typed endpoints, models
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the REST API.
