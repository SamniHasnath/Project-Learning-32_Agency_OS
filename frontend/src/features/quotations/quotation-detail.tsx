"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, buttonClass, Card, ConfirmButton, DescriptionList, ErrorState, Field, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { DocumentRenderer, fromQuotation } from "@/features/documents/components/document-renderer";
import { PdfActions } from "@/features/documents/components/pdf-actions";
import { quotationActions } from "@/features/documents/status";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { date, isoDay, money } from "@/lib/format";
import { QuotationsApi } from "@/services/agency-api";
import type { QuotationStatus } from "@/types/models";

export function QuotationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: q, error, loading, reload, setData } = useApi(() => QuotationsApi.get(id), [id]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(isoDay(14));

  if (loading && !q) return <LoadingState />;
  if (error || !q) return <ErrorState message={error ?? "Quotation not found"} onRetry={reload} />;

  async function setStatus(status: QuotationStatus) {
    setBusy(status);
    setActionError(null);
    try {
      setData(await QuotationsApi.setStatus(id, status));
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function convert() {
    setBusy("convert");
    setActionError(null);
    try {
      const invoice = await QuotationsApi.convertToInvoice(id, { dueDate });
      router.push(`/invoices/${invoice.id}?converted=1`);
    } catch (e) {
      setActionError(errorMessage(e));
      setBusy(null);
    }
  }

  const actions = quotationActions(q.status, Boolean(q.invoice));
  const expired = new Date(q.expiryDate) < new Date();

  return (
    <>
      <PageHeading
        eyebrow="Quotation"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {q.number} <StatusBadge status={q.status} />
          </span>
        }
        description={`${q.title} · ${q.clientSnapshot.company || q.clientSnapshot.name}`}
        back={{ href: "/quotations", label: "All quotations" }}
        actions={
          <>
            {q.status === "DRAFT" && (
              <Link href={`/quotations/${id}/edit`} className={buttonClass.secondary}>
                Edit
              </Link>
            )}
            <PdfActions number={q.number} previewHref={`/quotations/${id}/preview`} loadPdf={() => QuotationsApi.pdf(id)} />
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <DocumentRenderer doc={fromQuotation(q)} />
        </div>

        <aside className="space-y-5">
          {actionError && <Alert>{actionError}</Alert>}

          <Card title="Status">
            <div className="flex items-center justify-between">
              <StatusBadge status={q.status} />
              <span className="text-sm font-semibold text-slate-900">{money(q.total, q.currency)}</span>
            </div>
            {q.status === "SENT" && expired && (
              <p className="mt-3 text-sm text-amber-700">This quotation passed its expiry date and can no longer be accepted.</p>
            )}
            {actions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {actions.map((a) =>
                  a.confirm ? (
                    <ConfirmButton key={a.to} label={a.label} confirmLabel={a.confirm} onConfirm={() => setStatus(a.to)} disabled={busy !== null} />
                  ) : (
                    <button
                      key={a.to}
                      type="button"
                      className={buttonClass[a.variant]}
                      disabled={busy !== null || (a.to === "ACCEPTED" && expired)}
                      onClick={() => setStatus(a.to)}
                    >
                      {busy === a.to ? "Updating…" : a.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </Card>

          {q.status === "ACCEPTED" && !q.invoice && (
            <Card title="Convert to invoice" description="Copies the client, line items, totals, notes and terms into a new draft invoice.">
              <Field label="Invoice due date">
                <input className="form-input" type="date" value={dueDate} min={isoDay(0)} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
              <button type="button" className={`${buttonClass.primary} mt-4 w-full`} disabled={busy !== null} onClick={convert} data-testid="convert-button">
                {busy === "convert" ? "Converting…" : "Convert to invoice"}
              </button>
            </Card>
          )}

          {q.invoice && (
            <Card title="Invoice">
              <p className="text-sm text-slate-600">This quotation was converted to an invoice.</p>
              <Link href={`/invoices/${q.invoice.id}`} className={`${buttonClass.secondary} mt-3 w-full`}>
                View {q.invoice.number}
              </Link>
            </Card>
          )}

          <Card title="Details">
            <DescriptionList
              items={[
                ["Issued", date(q.issueDate)],
                ["Valid until", date(q.expiryDate)],
                ["Sent", date(q.sentAt)],
                ["Accepted", date(q.acceptedAt)],
                ["Template", q.templateSnapshot.name],
                ["Project", q.project ? <Link href={`/projects/${q.project.id}`}>{q.project.name}</Link> : null],
                [
                  "Client",
                  <Link key="c" href={`/clients/${q.clientId}`}>
                    {q.clientSnapshot.company || q.clientSnapshot.name}
                  </Link>,
                ],
              ]}
            />
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Client, agency and template details are captured on this document{q.status === "DRAFT" ? " and refreshed while it's a draft" : ""}. Later edits to the client don&apos;t change it.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
