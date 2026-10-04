"use client";

import { useState, type FormEvent } from "react";
import { Alert, buttonClass, Field } from "@/components/ui/primitives";
import { errorMessage } from "@/lib/api";
import { ClientsApi, type ClientInput } from "@/services/agency-api";
import type { Client, ClientStatus } from "@/types/models";

export function ClientForm({ initial, onSaved, onCancel }: { initial?: Client; onSaved: (c: Client) => void; onCancel?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const data: ClientInput = {
      name: get("name"),
      email: get("email"),
      company: get("company"),
      phone: get("phone"),
      address: get("address"),
      taxId: get("taxId"),
      notes: get("notes"),
      status: get("status") as ClientStatus,
    };
    if (!data.name || !data.email) return setError("Name and email are required.");
    setSaving(true);
    setError(null);
    try {
      onSaved(initial ? await ClientsApi.update(initial.id, data) : await ClientsApi.create(data));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required>
          <input className="form-input" name="name" defaultValue={initial?.name} maxLength={120} required />
        </Field>
        <Field label="Email" required>
          <input className="form-input" name="email" type="email" defaultValue={initial?.email} required />
        </Field>
        <Field label="Company">
          <input className="form-input" name="company" defaultValue={initial?.company ?? ""} maxLength={160} />
        </Field>
        <Field label="Phone">
          <input className="form-input" name="phone" type="tel" defaultValue={initial?.phone ?? ""} maxLength={40} />
        </Field>
        <Field label="Billing address" className="sm:col-span-2">
          <textarea className="form-input min-h-20" name="address" defaultValue={initial?.address ?? ""} maxLength={500} />
        </Field>
        <Field label="Tax / VAT ID">
          <input className="form-input" name="taxId" defaultValue={initial?.taxId ?? ""} maxLength={60} />
        </Field>
        <Field label="Status">
          <select className="form-input" name="status" defaultValue={initial?.status ?? "ACTIVE"}>
            <option value="ACTIVE">Active</option>
            <option value="LEAD">Lead</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
        <Field label="Internal notes" className="sm:col-span-2">
          <textarea className="form-input min-h-20" name="notes" defaultValue={initial?.notes ?? ""} maxLength={2000} />
        </Field>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass.primary} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save client" : "Add client"}
        </button>
        {onCancel && (
          <button type="button" className={buttonClass.secondary} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
