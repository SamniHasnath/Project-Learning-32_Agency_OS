"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, buttonClass, Card, ConfirmButton, DescriptionList, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { ClientForm } from "@/features/clients/client-form";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { date, money } from "@/lib/format";
import { ClientsApi } from "@/services/agency-api";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: c, error, loading, reload } = useApi(() => ClientsApi.get(id), [id]);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !c) return <LoadingState />;
  if (error || !c) return <ErrorState message={error ?? "Client not found"} onRetry={reload} />;

  const hasHistory = c.quotations.length + c.invoices.length + c.projects.length > 0;

  return (
    <>
      <PageHeading
        eyebrow="Client"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.company || c.name} <StatusBadge status={c.status} />
          </span>
        }
        description={c.company ? `${c.name} · ${c.email}` : c.email}
        back={{ href: "/clients", label: "All clients" }}
        actions={
          <>
            <Link href={`/quotations/new?clientId=${c.id}`} className={buttonClass.secondary}>
              + Quotation
            </Link>
            <Link href={`/invoices/new?clientId=${c.id}`} className={buttonClass.secondary}>
              + Invoice
            </Link>
            {!editing && (
              <button type="button" className={buttonClass.primary} onClick={() => setEditing(true)}>
                Edit client
              </button>
            )}
          </>
        }
      />
      {actionError && (
        <div className="mb-5">
          <Alert>{actionError}</Alert>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card title="Quotations">
            <DocRows rows={c.quotations.map((q) => ({ id: q.id, href: `/quotations/${q.id}`, number: q.number, title: q.title, status: q.status, amount: money(q.total, q.currency), date: date(q.issueDate) }))} empty="No quotations for this client yet." />
          </Card>
          <Card title="Invoices">
            <DocRows rows={c.invoices.map((i) => ({ id: i.id, href: `/invoices/${i.id}`, number: i.number, title: i.title, status: i.status, amount: money(i.total, i.currency), date: date(i.issueDate) }))} empty="No invoices for this client yet." />
          </Card>
          <Card title="Projects">
            {c.projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {c.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/projects/${p.id}`} className="font-medium">
                      {p.name}
                    </Link>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <aside className="space-y-5">
          <Card title={editing ? "Edit client" : "Details"}>
            {editing ? (
              <ClientForm
                initial={c}
                onSaved={() => {
                  setEditing(false);
                  void reload();
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <DescriptionList
                  items={[
                    ["Contact", c.name],
                    ["Email", c.email],
                    ["Phone", c.phone],
                    ["Company", c.company],
                    ["Address", c.address],
                    ["Tax ID", c.taxId],
                    ["Notes", c.notes],
                    ["Added", date(c.createdAt)],
                  ]}
                />
                <p className="mt-4 text-xs leading-5 text-slate-500">Editing a client only affects new and draft documents — issued quotations and invoices keep the details they were sent with.</p>
              </>
            )}
          </Card>
          {!hasHistory && !editing && (
            <ConfirmButton
              label="Delete client"
              confirmLabel="Delete this client permanently?"
              onConfirm={async () => {
                try {
                  await ClientsApi.remove(c.id);
                  router.push("/clients");
                } catch (e) {
                  setActionError(errorMessage(e));
                }
              }}
            />
          )}
        </aside>
      </div>
    </>
  );
}

function DocRows({ rows, empty }: { rows: { id: string; href: string; number: string; title: string; status: string; amount: string; date: string }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <Link href={r.href} className="min-w-0">
            <span className="font-semibold text-slate-900">{r.number}</span>
            <span className="ml-2 text-slate-500">
              {r.title} · {r.date}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={r.status} />
            <span className="w-24 text-right font-medium">{r.amount}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
