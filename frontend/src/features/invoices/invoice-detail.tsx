"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, buttonClass, Card, ConfirmButton, DescriptionList, ErrorState, Field, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { DocumentRenderer, fromInvoice } from "@/features/documents/components/document-renderer";
import { PdfActions } from "@/features/documents/components/pdf-actions";
import { invoiceActions, PAYMENT_METHODS } from "@/features/documents/status";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { date, isoDay, money, titleCase } from "@/lib/format";
import { InvoicesApi, PaymentsApi } from "@/services/agency-api";
import type { InvoiceStatus, PaymentMethod } from "@/types/models";

const PAYABLE: InvoiceStatus[] = ["SENT", "PARTIALLY_PAID", "OVERDUE"];

export function InvoiceDetail({ id }: { id: string }) {
  const { data: inv, error, loading, reload, setData } = useApi(() => InvoicesApi.get(id), [id]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const notice = useSearchParams().get("converted") ? "Invoice created from the accepted quotation. Review it and mark it as sent." : null;

  if (loading && !inv) return <LoadingState />;
  if (error || !inv) return <ErrorState message={error ?? "Invoice not found"} onRetry={reload} />;

  async function setStatus(status: InvoiceStatus) {
    setBusy(status);
    setActionError(null);
    try {
      setData(await InvoicesApi.setStatus(id, status));
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const payments = inv.payments ?? [];
  const actions = invoiceActions(inv.status, payments.length > 0);
  const total = Number(inv.total);
  const paidPct = total > 0 ? Math.min(100, (Number(inv.paidAmount) / total) * 100) : 0;

  return (
    <>
      <PageHeading
        eyebrow="Invoice"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {inv.number} <StatusBadge status={inv.status} />
          </span>
        }
        description={`${inv.title} · ${inv.clientSnapshot.company || inv.clientSnapshot.name}`}
        back={{ href: "/invoices", label: "All invoices" }}
        actions={
          <>
            {inv.status === "DRAFT" && (
              <Link href={`/invoices/${id}/edit`} className={buttonClass.secondary}>
                Edit
              </Link>
            )}
            <PdfActions number={inv.number} previewHref={`/invoices/${id}/preview`} loadPdf={() => InvoicesApi.pdf(id)} />
          </>
        }
      />

      {notice && (
        <div className="mb-5">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <DocumentRenderer doc={fromInvoice(inv)} />
        </div>

        <aside className="space-y-5">
          {actionError && <Alert>{actionError}</Alert>}

          <Card title="Balance">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Total</dt>
                <dd className="font-medium text-slate-900">{money(inv.total, inv.currency)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Paid</dt>
                <dd className="font-medium text-emerald-700" data-testid="paid-amount">
                  {money(inv.paidAmount, inv.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <dt>Outstanding</dt>
                <dd data-testid="outstanding-amount">{money(inv.outstandingAmount, inv.currency)}</dd>
              </div>
            </dl>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(paidPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Paid">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} />
            </div>
            {actions.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                {actions.map((a) =>
                  a.confirm ? (
                    <ConfirmButton key={a.to} label={a.label} confirmLabel={a.confirm} onConfirm={() => setStatus(a.to)} disabled={busy !== null} />
                  ) : (
                    <button key={a.to} type="button" className={buttonClass[a.variant]} disabled={busy !== null} onClick={() => setStatus(a.to)}>
                      {busy === a.to ? "Updating…" : a.label}
                    </button>
                  ),
                )}
              </div>
            )}
            {inv.status === "DRAFT" && <p className="mt-3 text-xs text-slate-500">Mark the invoice as sent to start recording payments.</p>}
          </Card>

          {PAYABLE.includes(inv.status) && Number(inv.outstandingAmount) > 0 && (
            <PaymentForm invoiceId={id} outstanding={inv.outstandingAmount} currency={inv.currency} onRecorded={reload} />
          )}

          <Card title="Payment history">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100" data-testid="payment-history">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/payments/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                        {p.number}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {date(p.paymentDate)} · {titleCase(p.method)}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-700">{money(p.amount, inv.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Details">
            <DescriptionList
              items={[
                ["Issued", date(inv.issueDate)],
                ["Due", date(inv.dueDate)],
                ["Sent", date(inv.sentAt)],
                ["Paid in full", date(inv.paidAt)],
                ["Reference", inv.reference],
                ["Template", inv.templateSnapshot.name],
                ["From quotation", inv.quotation ? <Link href={`/quotations/${inv.quotation.id}`}>{inv.quotation.number}</Link> : null],
                ["Client", <Link key="c" href={`/clients/${inv.clientId}`}>{inv.clientSnapshot.company || inv.clientSnapshot.name}</Link>],
              ]}
            />
          </Card>
        </aside>
      </div>
    </>
  );
}

function PaymentForm({ invoiceId, outstanding, currency, onRecorded }: { invoiceId: string; outstanding: string; currency: string; onRecorded: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(isoDay(0));
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const max = Number(outstanding);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount greater than 0.");
    if (Math.round(value * 100) / 100 !== value) return setError("Amounts can have at most 2 decimal places.");
    if (value > max) return setError(`Payment can't exceed the outstanding ${money(outstanding, currency)}.`);
    setSaving(true);
    setError(null);
    try {
      await PaymentsApi.create({ invoiceId, amount: value, method, paymentDate, reference: reference || undefined });
      setAmount("");
      setReference("");
      onRecorded();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Record a payment" description={`Outstanding: ${money(outstanding, currency)}`}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label={`Amount (${currency})`} required>
          <div className="flex gap-2">
            <input className="form-input" type="number" min="0.01" max={max} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" data-testid="payment-amount" />
            <button type="button" className={buttonClass.secondary} onClick={() => setAmount(String(max))}>
              Full
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method">
            <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className="form-input" type="date" value={paymentDate} max={isoDay(0)} onChange={(e) => setPaymentDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Reference" hint="Optional — e.g. transfer ID">
          <input className="form-input" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} />
        </Field>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={`${buttonClass.primary} w-full`} disabled={saving}>
          {saving ? "Recording…" : "Record payment"}
        </button>
      </form>
    </Card>
  );
}
