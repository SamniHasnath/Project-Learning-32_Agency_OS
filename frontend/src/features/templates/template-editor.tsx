"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Alert, buttonClass, Card, ConfirmButton, Field, PageHeading } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { DocumentRenderer, normaliseLayout, type RenderableDocument } from "@/features/documents/components/document-renderer";
import { errorMessage } from "@/lib/api";
import { date, isoDay } from "@/lib/format";
import { TemplatesApi } from "@/services/agency-api";
import type { DocumentTemplate, DocumentType, FontFamily, SectionKey, TemplateBranding, TemplateLayout } from "@/types/models";

const SECTION_LABELS: Record<SectionKey, string> = {
  header: "Header (logo, agency details, title)",
  parties: "Client & document details",
  items: "Line items",
  totals: "Totals",
  notes: "Notes",
  terms: "Terms & conditions",
  footer: "Footer text",
};
const LOCKED: SectionKey[] = ["items", "totals"];
const FONTS: [FontFamily, string][] = [
  ["Helvetica", "Helvetica (sans-serif)"],
  ["Times-Roman", "Times (serif)"],
  ["Courier", "Courier (monospace)"],
];

const DEFAULTS: Record<DocumentType, { branding: TemplateBranding; layout: TemplateLayout }> = {
  QUOTATION: {
    branding: { primaryColor: "#464feb", accentColor: "#0f172a", fontFamily: "Helvetica", showLogo: true },
    layout: normaliseLayout({ title: "QUOTATION", sections: [], footerText: "" }),
  },
  INVOICE: {
    branding: { primaryColor: "#464feb", accentColor: "#0f172a", fontFamily: "Helvetica", showLogo: true },
    layout: normaliseLayout({ title: "INVOICE", sections: [], footerText: "" }),
  },
};

export function TemplateEditor({ initial, onSaved }: { initial?: DocumentTemplate; onSaved?: (t: DocumentTemplate) => void }) {
  const router = useRouter();
  const { agency } = useSession();
  const [type, setType] = useState<DocumentType>(initial?.type ?? "QUOTATION");
  const [name, setName] = useState(initial?.name ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [branding, setBranding] = useState<TemplateBranding>(initial?.branding ?? DEFAULTS.QUOTATION.branding);
  const [layout, setLayout] = useState<TemplateLayout>(normaliseLayout(initial?.layout ?? DEFAULTS.QUOTATION.layout));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sample = useMemo<RenderableDocument>(
    () => ({
      number: type === "QUOTATION" ? "QT-2026-0042" : "INV-2026-0042",
      title: "Website redesign — phase 1",
      status: "SENT",
      currency: agency.currency,
      meta:
        type === "QUOTATION"
          ? [["Quotation no.", "QT-2026-0042"], ["Issue date", date(isoDay(0))], ["Valid until", date(isoDay(30))]]
          : [["Invoice no.", "INV-2026-0042"], ["Issue date", date(isoDay(0))], ["Due date", date(isoDay(14))], ["Reference", "QT-2026-0041"]],
      client: { id: "sample", name: "Olivia Chen", company: "Acme Studio", email: "olivia@acmestudio.co", phone: "+1 (555) 123-4567", address: "100 Industrial Parkway, Oakland, CA", taxId: null },
      agency,
      template: { id: null, name, version: 1, branding, layout },
      items: [
        { description: "UX research & information architecture", quantity: 1, unitPrice: 3800, lineTotal: 3800 },
        { description: "UI design — page templates", quantity: 8, unitPrice: 650, lineTotal: 5200 },
      ],
      totals: [
        { label: "Subtotal", value: 9000 },
        { label: "Tax (10%)", value: 900 },
        { label: "Total", value: 9900, strong: true },
        ...(type === "INVOICE" ? [{ label: "Amount paid", value: 4000 }, { label: "Balance due", value: 5900, strong: true }] : []),
      ],
      notes: "Includes two rounds of revisions per deliverable.",
      terms: "50% deposit on acceptance, balance on delivery.",
    }),
    [type, name, branding, layout, agency],
  );

  const moveSection = (index: number, delta: number) =>
    setLayout((l) => {
      const sections = [...l.sections];
      const [s] = sections.splice(index, 1);
      sections.splice(index + delta, 0, s);
      return { ...l, sections };
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the template a name.");
    if (!layout.title.trim()) return setError("Enter a document title.");
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = { name: name.trim(), branding, layout: { ...layout, footerText: layout.footerText || undefined } };
      if (initial) {
        const saved = await TemplatesApi.update(initial.id, { ...payload, ...(isDefault && !initial.isDefault ? { isDefault: true } : {}) });
        setNotice("Template saved. New documents will use these settings; issued documents are unchanged.");
        onSaved?.(saved);
      } else {
        const saved = await TemplatesApi.create({ ...payload, type, isDefault });
        router.push(`/templates/${saved.id}`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    try {
      await TemplatesApi.remove(initial.id);
      router.push("/templates");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Template"
        title={initial ? initial.name : "New template"}
        description={initial ? `${initial.type === "QUOTATION" ? "Quotation" : "Invoice"} template · version ${initial.version}` : "Design a reusable layout for quotations or invoices."}
        back={{ href: "/templates", label: "All templates" }}
        actions={initial?.isDefault ? <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Default template</span> : undefined}
      />
      <div className="grid gap-5 2xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Card title="General">
            <div className="grid gap-4">
              <Field label="Template name" required>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              </Field>
              <Field label="Used for" hint={initial ? "The document type can't be changed after creation." : undefined}>
                <select
                  className="form-input"
                  value={type}
                  disabled={Boolean(initial)}
                  onChange={(e) => {
                    const t = e.target.value as DocumentType;
                    setType(t);
                    setLayout((l) => ({ ...l, title: DEFAULTS[t].layout.title }));
                  }}
                >
                  <option value="QUOTATION">Quotations</option>
                  <option value="INVOICE">Invoices</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isDefault} disabled={initial?.isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Default for new {type === "QUOTATION" ? "quotations" : "invoices"}
              </label>
            </div>
          </Card>

          <Card title="Branding">
            <div className="grid grid-cols-2 gap-4">
              {(["primaryColor", "accentColor"] as const).map((key) => (
                <Field key={key} label={key === "primaryColor" ? "Primary colour" : "Accent colour"}>
                  <div className="flex items-center gap-2">
                    <input type="color" className="h-10 w-12 cursor-pointer rounded border border-slate-200" value={branding[key]} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} aria-label={`${key} picker`} />
                    <input className="form-input font-mono" value={branding[key]} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} maxLength={7} pattern="#[0-9a-fA-F]{6}" />
                  </div>
                </Field>
              ))}
              <Field label="Font" className="col-span-2">
                <select className="form-input" value={branding.fontFamily} onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value as FontFamily })}>
                  {FONTS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={branding.showLogo} onChange={(e) => setBranding({ ...branding, showLogo: e.target.checked })} />
                Show agency logo {agency.logoUrl ? "" : "(upload one in Settings)"}
              </label>
            </div>
          </Card>

          <Card title="Layout" description="Reorder and toggle the sections of the document.">
            <div className="grid gap-4">
              <Field label="Document title">
                <input className="form-input" value={layout.title} onChange={(e) => setLayout({ ...layout, title: e.target.value })} maxLength={40} />
              </Field>
              <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {layout.sections.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.visible}
                      disabled={LOCKED.includes(s.key)}
                      aria-label={`Show ${SECTION_LABELS[s.key]}`}
                      onChange={(e) => setLayout({ ...layout, sections: layout.sections.map((x) => (x.key === s.key ? { ...x, visible: e.target.checked } : x)) })}
                    />
                    <span className={`flex-1 ${s.visible ? "text-slate-800" : "text-slate-400 line-through"}`}>{SECTION_LABELS[s.key]}</span>
                    <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up" disabled={i === 0} onClick={() => moveSection(i, -1)}>
                      ↑
                    </button>
                    <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down" disabled={i === layout.sections.length - 1} onClick={() => moveSection(i, 1)}>
                      ↓
                    </button>
                  </li>
                ))}
              </ol>
              <Field label="Footer text">
                <textarea className="form-input min-h-20" value={layout.footerText ?? ""} onChange={(e) => setLayout({ ...layout, footerText: e.target.value })} maxLength={500} />
              </Field>
            </div>
          </Card>

          {error && <Alert>{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass.primary} disabled={saving}>
              {saving ? "Saving…" : initial ? "Save template" : "Create template"}
            </button>
            {initial && !initial.isDefault && <ConfirmButton label="Delete" confirmLabel="Delete this template? Documents already issued with it are not affected." onConfirm={remove} />}
          </div>
        </form>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Live preview (sample data)</p>
          <DocumentRenderer doc={sample} />
        </div>
      </div>
    </>
  );
}
