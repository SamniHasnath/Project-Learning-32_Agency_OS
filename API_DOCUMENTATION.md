# Agency OS REST API

Base URL: `http://localhost:3001/api`. Live OpenAPI/Swagger UI is at `/api/docs`.

## Conventions

- **Auth:** every endpoint except `POST /auth/register`, `POST /auth/login` and `GET /health` requires `Authorization: Bearer <accessToken>`.
- **Tenancy:** the agency is taken from the token. Sending `agencyId` (or any unknown field) is rejected with `400`. Records of another agency return `404`.
- **Money:** returned as decimal strings (e.g. `"1424.43"`). Send numbers with at most 2 decimals (quantities: 3).
- **Server-calculated fields:** `lineTotal`, `subtotal`, `discountAmount`, `taxAmount`, `total`, `paidAmount`, `outstandingAmount`, `number` and `status` are never accepted from the client.
- **Errors:** `{ "statusCode": 400, "message": "…" | ["…"], "error": "Bad Request" }`. `409` signals a business-rule conflict (e.g. an illegal status change).

Totals: `lineTotal = round2(qty × unitPrice)`, `subtotal = Σ lineTotal`, `discount = FIXED value | round2(subtotal × % / 100)`, `tax = round2((subtotal − discount) × taxRate / 100)`, `total = subtotal − discount + tax`.

## Auth

| Method | Path | Body / notes |
|---|---|---|
| POST | `/auth/register` | `{ agencyName, name, email, password }` → `{ accessToken, user, agency }`. Creates the agency and 4 starter templates. |
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user, agency }` |
| GET | `/auth/me` | Current user and agency |

## Quotations

| Method | Path | Notes |
|---|---|---|
| GET | `/quotations?status=&clientId=&search=` | List |
| GET | `/quotations/:id` | Includes `items`, `invoice`, snapshots |
| POST | `/quotations` | See body below. Created as `DRAFT` with number `QT-YYYY-NNNN`. |
| PATCH | `/quotations/:id` | Any create field. **DRAFT only.** Totals and snapshots recomputed. |
| PATCH | `/quotations/:id/status` | `{ status }`. Allowed: DRAFT→SENT/VOID, SENT→ACCEPTED/REJECTED/EXPIRED/VOID, ACCEPTED→VOID (if not converted). An expired quotation can't be accepted. |
| POST | `/quotations/:id/convert-to-invoice` | `{ dueDate?, templateId? }`. **ACCEPTED only.** Idempotent: repeat calls return the same invoice. |
| GET | `/quotations/:id/pdf[?download=1]` | `application/pdf` |

```json
{
  "clientId": "uuid", "projectId": "uuid|null", "templateId": "uuid|null",
  "title": "Website redesign", "issueDate": "2026-10-04", "expiryDate": "2026-11-03",
  "items": [{ "description": "Design", "quantity": 2, "unitPrice": 1500 }],
  "discountType": "FIXED|PERCENTAGE", "discountValue": 0, "taxRate": 10,
  "notes": "…", "terms": "…"
}
```

## Invoices

| Method | Path | Notes |
|---|---|---|
| GET | `/invoices?status=&clientId=&search=` | List |
| GET | `/invoices/:id` | Includes `items`, `payments`, `quotation` |
| POST | `/invoices` | Same body as a quotation, but `dueDate?` (default +14 days) and `reference?` instead of `expiryDate`. |
| PATCH | `/invoices/:id` | **DRAFT only.** |
| PATCH | `/invoices/:id/status` | DRAFT→SENT/VOID, SENT→OVERDUE/VOID, OVERDUE→VOID. Can't void once paid; `PARTIALLY_PAID`/`PAID` are set by payments only. |
| GET | `/invoices/:id/payments` | Payment history |
| GET | `/invoices/:id/pdf[?download=1]` | `application/pdf` |

## Payments

| Method | Path | Notes |
|---|---|---|
| GET | `/payments?invoiceId=` | List |
| GET | `/payments/:id` | Detail |
| POST | `/payments` | `{ invoiceId, amount, method?, paymentDate?, reference?, notes? }`. The invoice must be SENT, PARTIALLY_PAID or OVERDUE. `amount > outstanding` → `400`. |

## Document templates

| Method | Path | Notes |
|---|---|---|
| GET | `/document-templates?type=QUOTATION\|INVOICE` | List |
| GET | `/document-templates/:id` | Detail |
| POST | `/document-templates` | `{ name, type, isDefault?, branding: { primaryColor, accentColor, fontFamily: Helvetica\|Times-Roman\|Courier, showLogo }, layout: { title, sections: [{ key, visible }], footerText? } }` |
| PATCH | `/document-templates/:id` | Partial; bumps `version`. Issued documents are unaffected. |
| POST | `/document-templates/:id/set-default` | Makes it the default for its type |
| DELETE | `/document-templates/:id` | Not allowed for the default template |

Section keys: `header, parties, items, totals, notes, terms, footer`. `items` and `totals` are always visible.

## Clients, projects, settings, dashboard

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/clients` | `?search=`; body `{ name, email, company?, phone?, address?, taxId?, notes?, status? }`. Email is unique per agency. |
| GET/PATCH/DELETE | `/clients/:id` | Delete is refused (`409`) when the client has projects or documents. |
| GET/POST | `/projects` | `?clientId=`; body `{ name, clientId, status?, budget?, startDate?, endDate?, description? }` |
| GET/PATCH/DELETE | `/projects/:id` | |
| GET/PATCH | `/settings` | Agency profile: `name, email, phone, website, address, taxId, currency (ISO 4217), logoUrl (PNG/JPEG data URL or "")` |
| GET | `/dashboard/metrics` | Revenue, outstanding, overdue, open quotations, 12-month revenue |
| GET | `/dashboard/recent` | Latest quotations, invoices and payments |
| GET | `/dashboard/documents` | Status breakdown, expiring quotations, overdue invoices |
| GET | `/health` | Public liveness/DB check |
