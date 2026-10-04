import type { CSSProperties, ReactNode } from "react";
import { date, money, quantity, titleCase } from "@/lib/format";
import type { AgencySnapshot, ClientSnapshot, Invoice, Quotation, SectionKey, TemplateLayout, TemplateSnapshot } from "@/types/models";

export type RenderableDocument = {
  number: string;
  title: string;
  status: string;
  currency: string;
  meta: [string, string][];
  client: ClientSnapshot;
  agency: AgencySnapshot;
  template: TemplateSnapshot;
  items: { description: string; quantity: string | number; unitPrice: string | number; lineTotal: string | number }[];
  totals: { label: string; value: string | number; strong?: boolean; negative?: boolean }[];
  notes: string | null;
  terms: string | null;
};

const SECTION_KEYS: SectionKey[] = ["header", "parties", "items", "totals", "notes", "terms", "footer"];
const FONT_STACK: Record<string, string> = {
  Helvetica: "Helvetica, Arial, sans-serif",
  "Times-Roman": "'Times New Roman', Times, serif",
  Courier: "'Courier New', Courier, monospace",
};

/** Same rules as the server: every section once, items & totals always visible. */
export function normaliseLayout(layout: TemplateLayout): TemplateLayout {
  const seen = new Set<SectionKey>();
  const sections: TemplateLayout["sections"] = [];
  for (const s of layout.sections ?? []) {
    if (!SECTION_KEYS.includes(s.key) || seen.has(s.key)) continue;
    seen.add(s.key);
    sections.push({ key: s.key, visible: s.key === "items" || s.key === "totals" ? true : s.visible });
  }
  for (const key of SECTION_KEYS) if (!seen.has(key)) sections.push({ key, visible: true });
  return { ...layout, sections };
}

function baseTotals(d: Quotation | Invoice): RenderableDocument["totals"] {
  const rows: RenderableDocument["totals"] = [{ label: "Subtotal", value: d.subtotal }];
  if (Number(d.discountAmount) > 0) {
    rows.push({
      label: d.discountType === "PERCENTAGE" ? `Discount (${Number(d.discountValue)}%)` : "Discount",
      value: d.discountAmount,
      negative: true,
    });
  }
  rows.push({ label: `Tax (${Number(d.taxRate)}%)`, value: d.taxAmount });
  rows.push({ label: "Total", value: d.total, strong: true });
  return rows;
}

export function fromQuotation(q: Quotation): RenderableDocument {
  return {
    number: q.number,
    title: q.title,
    status: q.status,
    currency: q.currency,
    meta: [
      ["Quotation no.", q.number],
      ["Issue date", date(q.issueDate)],
      ["Valid until", date(q.expiryDate)],
    ],
    client: q.clientSnapshot,
    agency: q.agencySnapshot,
    template: q.templateSnapshot,
    items: q.items ?? [],
    totals: baseTotals(q),
    notes: q.notes,
    terms: q.terms,
  };
}

export function fromInvoice(inv: Invoice): RenderableDocument {
  const meta: [string, string][] = [
    ["Invoice no.", inv.number],
    ["Issue date", date(inv.issueDate)],
    ["Due date", date(inv.dueDate)],
  ];
  if (inv.reference) meta.push(["Reference", inv.reference]);
  return {
    number: inv.number,
    title: inv.title,
    status: inv.status,
    currency: inv.currency,
    meta,
    client: inv.clientSnapshot,
    agency: inv.agencySnapshot,
    template: inv.templateSnapshot,
    items: inv.items ?? [],
    totals: [
      ...baseTotals(inv),
      { label: "Amount paid", value: inv.paidAmount },
      { label: "Balance due", value: inv.outstandingAmount, strong: true },
    ],
    notes: inv.notes,
    terms: inv.terms,
  };
}

/**
 * Renders a quotation or invoice as an on-screen/printable A4 sheet. Driven
 * entirely by the document's template snapshot — the same configuration the
 * server's PDF renderer uses — so preview, print and PDF match.
 */
export function DocumentRenderer({ doc }: { doc: RenderableDocument }) {
  const { branding } = doc.template;
  const layout = normaliseLayout(doc.template.layout);
  const style = { "--doc-primary": branding.primaryColor, "--doc-accent": branding.accentColor, fontFamily: FONT_STACK[branding.fontFamily] ?? FONT_STACK.Helvetica } as CSSProperties;
  const fmt = (v: string | number) => money(v, doc.currency);
  const showFooter = layout.sections.some((s) => s.key === "footer" && s.visible);
  const watermark = doc.status === "DRAFT" || doc.status === "VOID" ? doc.status : null;

  const sections: Record<SectionKey, ReactNode> = {
    header: (
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 pb-6" style={{ borderColor: "var(--doc-primary)" }}>
        <div className="min-w-0">
          {branding.showLogo && doc.agency.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- data URL logo, not an optimisable remote image
            <img src={doc.agency.logoUrl} alt={`${doc.agency.name} logo`} className="mb-3 max-h-12 max-w-[160px] object-contain" />
          )}
          <p className="text-lg font-bold text-slate-900">{doc.agency.name}</p>
          <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">
            {[doc.agency.address, doc.agency.email, doc.agency.phone, doc.agency.website, doc.agency.taxId && `Tax ID: ${doc.agency.taxId}`].filter(Boolean).join("\n")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--doc-primary)" }}>
            {layout.title}
          </p>
          <p className="mt-1 text-sm text-slate-800">{doc.number}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">{titleCase(doc.status)}</p>
        </div>
      </header>
    ),
    parties: (
      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
            Bill to
          </p>
          <p className="mt-1.5 font-bold text-slate-900">{doc.client.company || doc.client.name}</p>
          <p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-slate-500">
            {[doc.client.company ? doc.client.name : null, doc.client.email, doc.client.phone, doc.client.address, doc.client.taxId && `Tax ID: ${doc.client.taxId}`]
              .filter(Boolean)
              .join("\n")}
          </p>
        </div>
        <dl className="space-y-1.5 text-sm sm:justify-self-end sm:min-w-56">
          {doc.meta.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
    items: (
      <div className="py-2">
        <h3 className="mb-3 text-base font-bold text-slate-900">{doc.title}</h3>
        <div className="overflow-x-auto">
          <table className="doc-table w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--doc-primary)" }}>
                <th className="w-8 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Unit price</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                  <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="whitespace-pre-line px-3 py-2.5 text-slate-800">{item.description}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{quantity(item.quantity)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{fmt(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{fmt(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    totals: (
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-2 py-2 text-sm">
        {doc.totals.map((row) => (
          <div
            key={row.label}
            className={`flex justify-between ${row.strong ? "text-base font-bold" : "text-slate-600"} ${row.label === "Total" ? "border-t border-slate-200 pt-2" : ""}`}
            style={row.strong ? { color: "var(--doc-primary)" } : undefined}
          >
            <dt>{row.label}</dt>
            <dd className={row.strong ? "" : "text-slate-900"}>{row.negative ? `-${fmt(row.value)}` : fmt(row.value)}</dd>
          </div>
        ))}
      </dl>
    ),
    notes: doc.notes ? <TextBlock heading="Notes" body={doc.notes} /> : null,
    terms: doc.terms ? <TextBlock heading="Terms & conditions" body={doc.terms} /> : null,
    footer: null,
  };

  return (
    <article className="document-sheet relative mx-auto w-full max-w-[820px] overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-12" style={style}>
      {watermark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] select-none text-[120px] font-black tracking-widest opacity-[0.06]"
          style={{ color: watermark === "VOID" ? "#dc2626" : "#475569" }}
        >
          {watermark}
        </span>
      )}
      {layout.sections.filter((s) => s.visible).map((s) => (
        <div key={s.key}>{sections[s.key]}</div>
      ))}
      {showFooter && layout.footerText && <p className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">{layout.footerText}</p>}
    </article>
  );
}

function TextBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="mt-4 py-2">
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
        {heading}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}
