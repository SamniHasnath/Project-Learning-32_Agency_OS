"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert, buttonClass, Card, Field, LoadingState, PageHeading } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { previewTotals } from "@/lib/calc";
import { isoDay, money } from "@/lib/format";
import { ClientsApi, InvoicesApi, ProjectsApi, QuotationsApi, TemplatesApi } from "@/services/agency-api";
import type { DiscountType, Invoice, InvoiceInput, Project, Quotation, QuotationInput } from "@/types/models";

type Kind = "quotation" | "invoice";
type Row = { key: string; description: string; quantity: string; unitPrice: string };

const newRow = (): Row => ({ key: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" });

/**
 * Create/edit form shared by quotations and invoices. Totals shown here are a
 * live preview only — the server recalculates everything on save.
 */
export function DocumentForm({ kind, initial }: { kind: Kind; initial?: Quotation | Invoice }) {
  const router = useRouter();
  const { agency } = useSession();
  const isEdit = Boolean(initial);
  const label = kind === "quotation" ? "quotation" : "invoice";
  const quotation = kind === "quotation" ? (initial as Quotation | undefined) : undefined;
  const invoice = kind === "invoice" ? (initial as Invoice | undefined) : undefined;

  const clients = useApi(() => ClientsApi.list(), []);
  const templates = useApi(() => TemplatesApi.list(kind === "quotation" ? "QUOTATION" : "INVOICE"), [kind]);

  // ?clientId= pre-selects the client (e.g. "+ Quotation" from a client page).
  const clientFromUrl = useSearchParams().get("clientId");
  const [clientId, setClientId] = useState(initial?.clientId ?? clientFromUrl ?? "");
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [templateId, setTemplateId] = useState(initial?.templateId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [issueDate, setIssueDate] = useState(initial ? initial.issueDate.slice(0, 10) : isoDay(0));
  const [endDate, setEndDate] = useState(
    quotation ? quotation.expiryDate.slice(0, 10) : invoice ? invoice.dueDate.slice(0, 10) : isoDay(kind === "quotation" ? 30 : 14),
  );
  const [reference, setReference] = useState(invoice?.reference ?? "");
  const [rows, setRows] = useState<Row[]>(
    initial?.items?.length
      ? initial.items.map((i) => ({ key: crypto.randomUUID(), description: i.description, quantity: String(Number(i.quantity)), unitPrice: String(Number(i.unitPrice)) }))
      : [newRow()],
  );
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? "FIXED");
  const [discountValue, setDiscountValue] = useState(initial ? String(Number(initial.discountValue)) : "0");
  const [taxRate, setTaxRate] = useState(initial ? String(Number(initial.taxRate)) : "0");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Projects of the selected client; tagged with the client id so a stale list is never shown.
  const [projectList, setProjectList] = useState<{ clientId: string; items: Project[] }>({ clientId: "", items: [] });
  const projects = projectList.clientId === clientId ? projectList.items : [];

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    ProjectsApi.list(clientId)
      .then((items) => !cancelled && setProjectList({ clientId, items }))
      .catch(() => !cancelled && setProjectList({ clientId, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const client = clients.data?.find((c) => c.id === clientId);
  const totals = useMemo(
    () =>
      previewTotals(
        rows.map((r) => ({ quantity: Number(r.quantity), unitPrice: Number(r.unitPrice) })),
        discountType,
        Number(discountValue),
        Number(taxRate),
      ),
    [rows, discountType, discountValue, taxRate],
  );
  const currency = initial?.currency ?? agency.currency;

  const updateRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const moveRow = (index: number, delta: number) =>
    setRows((rs) => {
      const next = [...rs];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row);
      return next;
    });

  function validate(): string | null {
    if (!clientId) return "Select a client.";
    if (!title.trim()) return "Enter a title.";
    if (!rows.length) return "Add at least one line item.";
    for (const [i, r] of rows.entries()) {
      if (!r.description.trim()) return `Line ${i + 1}: add a description.`;
      if (!(Number(r.quantity) > 0)) return `Line ${i + 1}: quantity must be greater than 0.`;
      if (r.unitPrice === "" || Number(r.unitPrice) < 0 || Number.isNaN(Number(r.unitPrice))) return `Line ${i + 1}: enter a valid unit price.`;
    }
    if (endDate && issueDate && endDate < issueDate) return `${kind === "quotation" ? "Expiry" : "Due"} date must be on or after the issue date.`;
    if (Number(taxRate) < 0 || Number(taxRate) > 100) return "Tax rate must be between 0 and 100.";
    if (Number(discountValue) < 0) return "Discount cannot be negative.";
    if (totals.discountExceeds) return "Discount cannot exceed the subtotal.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    const base = {
      clientId,
      projectId: projectId || null,
      templateId: templateId || null,
      title: title.trim(),
      issueDate,
      items: rows.map((r) => ({ description: r.description.trim(), quantity: Number(r.quantity), unitPrice: Number(r.unitPrice) })),
      discountType,
      discountValue: Number(discountValue) || 0,
      taxRate: Number(taxRate) || 0,
      notes,
      terms,
    };
    try {
      let id: string;
      if (kind === "quotation") {
        const payload: QuotationInput = { ...base, expiryDate: endDate };
        id = (initial ? await QuotationsApi.update(initial.id, payload) : await QuotationsApi.create(payload)).id;
      } else {
        const payload: InvoiceInput = { ...base, dueDate: endDate, reference };
        id = (initial ? await InvoicesApi.update(initial.id, payload) : await InvoicesApi.create(payload)).id;
      }
      router.push(`/${kind}s/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  if (clients.loading || templates.loading) return <LoadingState />;

  return (
    <>
      <PageHeading
        title={isEdit ? `Edit ${initial!.number}` : `New ${label}`}
        description={isEdit ? "Only draft documents can be edited." : `Choose a client, add line items and save as a draft ${label}.`}
        back={{ href: isEdit ? `/${kind}s/${initial!.id}` : `/${kind}s`, label: isEdit ? `Back to ${initial!.number}` : `All ${label}s` }}
      />
      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_340px]" noValidate>
        <div className="min-w-0 space-y-5">
          <Card title="Client">
            {clients.data && clients.data.length === 0 ? (
              <Alert tone="info">
                You don&apos;t have any clients yet.{" "}
                <Link href="/clients/new" className="font-semibold underline">
                  Add a client
                </Link>{" "}
                first.
              </Alert>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client" required>
                  <select className="form-input" value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(""); }} required>
                    <option value="">Select a client…</option>
                    {clients.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.company} — ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Project" hint="Optional">
                  <select className="form-input" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!clientId}>
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {client && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:col-span-2" data-testid="client-autofill">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to (auto-filled)</p>
                    <p className="mt-1 font-semibold text-slate-900">{client.company || client.name}</p>
                    <p className="mt-0.5 whitespace-pre-line text-slate-600">
                      {[client.company ? client.name : null, client.email, client.phone, client.address, client.taxId && `Tax ID: ${client.taxId}`].filter(Boolean).join("\n")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Document details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" required className="sm:col-span-2">
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website redesign — phase 1" maxLength={200} />
              </Field>
              <Field label="Issue date" required>
                <input className="form-input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </Field>
              <Field label={kind === "quotation" ? "Expiry date" : "Due date"} required>
                <input className="form-input" type="date" value={endDate} min={issueDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
              <Field label="Template" hint="Controls layout and branding of the preview and PDF">
                <select className="form-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="">Agency default</option>
                  {templates.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              {kind === "invoice" && (
                <Field label="Reference / PO number" hint="Optional">
                  <input className="form-input" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} />
                </Field>
              )}
            </div>
          </Card>

          <Card title="Line items" description="Quantity × unit price. Totals are recalculated by the server when you save.">
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={row.key} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_90px_130px_110px] sm:items-end" data-testid="line-item">
                  <Field label={`Description ${index + 1}`}>
                    <input className="form-input" value={row.description} onChange={(e) => updateRow(row.key, { description: e.target.value })} placeholder="e.g. Visual identity design" maxLength={500} />
                  </Field>
                  <Field label="Qty">
                    <input className="form-input" type="number" min="0.001" step="any" inputMode="decimal" value={row.quantity} onChange={(e) => updateRow(row.key, { quantity: e.target.value })} />
                  </Field>
                  <Field label={`Unit price (${currency})`}>
                    <input className="form-input" type="number" min="0" step="0.01" inputMode="decimal" value={row.unitPrice} onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })} placeholder="0.00" />
                  </Field>
                  <div className="flex items-center justify-between gap-1 sm:flex-col sm:items-end sm:pb-1">
                    <span className="text-sm font-semibold text-slate-800">{money(totals.lines[index] ?? 0, currency)}</span>
                    <div className="flex gap-1">
                      <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move line ${index + 1} up`} disabled={index === 0} onClick={() => moveRow(index, -1)}>
                        ↑
                      </button>
                      <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move line ${index + 1} down`} disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}>
                        ↓
                      </button>
                      <button type="button" className="rounded px-1.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label={`Remove line ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className={`${buttonClass.ghost} mt-3`} onClick={() => setRows((rs) => [...rs, newRow()])}>
              + Add line item
            </button>
          </Card>

          <Card title="Notes and terms">
            <div className="grid gap-4">
              <Field label="Notes" hint="Shown on the document">
                <textarea className="form-input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} />
              </Field>
              <Field label="Terms & conditions">
                <textarea className="form-input min-h-24" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. 50% deposit on acceptance, balance on delivery." maxLength={5000} />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <Card title="Summary">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span data-testid="preview-subtotal">{money(totals.subtotal, currency)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <select className="form-input" aria-label="Discount type" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                  <option value="FIXED">Discount ({currency})</option>
                  <option value="PERCENTAGE">Discount (%)</option>
                </select>
                <input className="form-input w-24 text-right" aria-label="Discount value" type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>-{money(totals.discount, currency)}</span>
                </div>
              )}
              <label className="flex items-center justify-between gap-2 text-slate-600">
                <span>Tax rate (%)</span>
                <input className="form-input w-24 text-right" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </label>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{money(totals.tax, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span data-testid="preview-total">{money(totals.total, currency)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Preview only — final amounts are calculated by the server.</p>
            {error && (
              <div className="mt-4">
                <Alert>{error}</Alert>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" className={buttonClass.primary} disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Save as draft"}
              </button>
              <Link href={isEdit ? `/${kind}s/${initial!.id}` : `/${kind}s`} className={buttonClass.secondary}>
                Cancel
              </Link>
            </div>
          </Card>
        </aside>
      </form>
    </>
  );
}
