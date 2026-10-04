"use client";

import { useState, type FormEvent } from "react";
import { Alert, buttonClass, Field, LoadingState } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { ClientsApi, ProjectsApi } from "@/services/agency-api";
import type { Project, ProjectStatus } from "@/types/models";

const STATUSES: ProjectStatus[] = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

export function ProjectForm({ initial, onSaved, onCancel }: { initial?: Project; onSaved: (p: Project) => void; onCancel?: () => void }) {
  const clients = useApi(() => ClientsApi.list(), []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    if (!get("name") || !get("clientId")) return setError("Name and client are required.");
    setSaving(true);
    setError(null);
    const data = {
      name: get("name"),
      clientId: get("clientId"),
      description: get("description"),
      status: get("status") as ProjectStatus,
      budget: Number(get("budget") || 0),
      ...(get("startDate") ? { startDate: get("startDate") } : {}),
      ...(get("endDate") ? { endDate: get("endDate") } : {}),
    };
    try {
      onSaved(initial ? await ProjectsApi.update(initial.id, data) : await ProjectsApi.create(data));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  // The client <select> is uncontrolled, so render only once its options exist.
  if (clients.loading) return <LoadingState />;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" required>
          <input className="form-input" name="name" defaultValue={initial?.name} maxLength={160} />
        </Field>
        <Field label="Client" required>
          <select className="form-input" name="clientId" defaultValue={initial?.clientId ?? ""}>
            <option value="">Select a client…</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="form-input" name="status" defaultValue={initial?.status ?? "IN_PROGRESS"}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").toLowerCase().replace(/^\w/, (x) => x.toUpperCase())}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget">
          <input className="form-input" name="budget" type="number" min="0" step="0.01" defaultValue={initial ? Number(initial.budget) : ""} />
        </Field>
        <Field label="Start date">
          <input className="form-input" name="startDate" type="date" defaultValue={initial?.startDate?.slice(0, 10) ?? ""} />
        </Field>
        <Field label="End date">
          <input className="form-input" name="endDate" type="date" defaultValue={initial?.endDate?.slice(0, 10) ?? ""} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="form-input min-h-20" name="description" defaultValue={initial?.description ?? ""} maxLength={2000} />
        </Field>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass.primary} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save project" : "Create project"}
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
