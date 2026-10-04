"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, buttonClass, Card, Field, PageHeading } from "@/components/ui/primitives";
import { useAuth, useSession } from "@/context/auth-context";
import { errorMessage } from "@/lib/api";

const CURRENCIES = [
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["GBP", "Pound Sterling"],
  ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"],
  ["NZD", "New Zealand Dollar"],
  ["INR", "Indian Rupee"],
  ["LKR", "Sri Lankan Rupee"],
  ["SGD", "Singapore Dollar"],
  ["AED", "UAE Dirham"],
  ["JPY", "Japanese Yen"],
  ["ZAR", "South African Rand"],
] as const;
const MAX_LOGO_BYTES = 350 * 1024;

export default function SettingsPage() {
  const { agency } = useSession();
  const { updateAgency } = useAuth();
  const [form, setForm] = useState({
    name: agency.name,
    email: agency.email,
    phone: agency.phone ?? "",
    website: agency.website ?? "",
    address: agency.address ?? "",
    taxId: agency.taxId ?? "",
    currency: agency.currency,
    logoUrl: agency.logoUrl ?? "",
  });
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const welcome = useSearchParams().has("welcome");

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setStatus(null);
  };

  function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return setStatus({ tone: "error", text: "Logo must be a PNG or JPEG image." });
    if (file.size > MAX_LOGO_BYTES) return setStatus({ tone: "error", text: "Logo must be smaller than 350 KB." });
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setStatus({ tone: "error", text: "Agency name and email are required." });
    setSaving(true);
    try {
      await updateAgency(form);
      setStatus({ tone: "success", text: "Settings saved. New documents will use these details; issued documents keep the details they were created with." });
    } catch (err) {
      setStatus({ tone: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading title="Agency settings" description="Company details and branding printed on your quotations and invoices." />
      {welcome && (
        <div className="mb-5 max-w-3xl">
          <Alert tone="info">Welcome! Add your company details and logo — they&apos;ll appear on every quotation and invoice you create.</Alert>
        </div>
      )}
      <form className="max-w-3xl space-y-5" onSubmit={submit} noValidate>
        <Card title="Agency profile" description="This information appears in the header of your documents.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Agency name" required>
              <input className="form-input" value={form.name} onChange={set("name")} maxLength={120} />
            </Field>
            <Field label="Billing email" required>
              <input className="form-input" type="email" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Phone">
              <input className="form-input" type="tel" value={form.phone} onChange={set("phone")} maxLength={40} />
            </Field>
            <Field label="Website">
              <input className="form-input" value={form.website} onChange={set("website")} maxLength={200} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea className="form-input min-h-20" value={form.address} onChange={set("address")} maxLength={500} />
            </Field>
            <Field label="Tax / VAT ID">
              <input className="form-input" value={form.taxId} onChange={set("taxId")} maxLength={60} />
            </Field>
            <Field label="Currency" hint="Applies to new documents">
              <select className="form-input" value={form.currency} onChange={set("currency")}>
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Logo" description="PNG or JPEG, up to 350 KB. Shown on templates with “Show logo” enabled.">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-44 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
                <img src={form.logoUrl} alt="Agency logo" className="max-h-16 max-w-40 object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No logo</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className={`${buttonClass.secondary} cursor-pointer`}>
                Upload logo
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={onLogo} />
              </label>
              {form.logoUrl && (
                <button type="button" className={buttonClass.secondary} onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </Card>

        {status && <Alert tone={status.tone}>{status.text}</Alert>}
        <button type="submit" disabled={saving} className={buttonClass.primary}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </>
  );
}
