"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { buttonClass, Card, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { INVOICE_STATUSES, QUOTATION_STATUSES } from "@/features/documents/status";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { DashboardApi, InvoicesApi, QuotationsApi } from "@/services/agency-api";

/** Document Overview: status breakdown of all commercial documents, what needs attention, and a unified search. */
export default function DocumentsPage() {
  // Re-key on ?q= so searching from the top bar while already here resets the box.
  const q = useSearchParams().get("q") ?? "";
  return <DocumentOverview key={q} initialQuery={q} />;
}

function DocumentOverview({ initialQuery }: { initialQuery: string }) {
  const { agency } = useSession();
  const { data, error, loading, reload } = useApi(() => Promise.all([DashboardApi.documents(), QuotationsApi.list(), InvoicesApi.list()]), []);
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const [, quotations, invoices] = data;
    return [
      ...quotations.map((d) => ({ kind: "Quotation", href: `/quotations/${d.id}`, ...d })),
      ...invoices.map((d) => ({ kind: "Invoice", href: `/invoices/${d.id}`, ...d })),
    ].filter((d) => `${d.number} ${d.title} ${d.clientSnapshot.name} ${d.clientSnapshot.company ?? ""}`.toLowerCase().includes(q));
  }, [data, query]);

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Could not load documents"} onRetry={reload} />;
  const [overview] = data;
  const cur = agency.currency;
  const qBy = new Map(overview.quotations.map((g) => [g.status, g]));
  const iBy = new Map(overview.invoices.map((g) => [g.status, g]));

  return (
    <>
      <PageHeading
        title="Document overview"
        description="Every quotation and invoice at a glance — and what needs your attention."
        actions={
          <>
            <Link href="/templates" className={buttonClass.secondary}>
              Templates
            </Link>
            <Link href="/quotations/new" className={buttonClass.primary}>
              + New quotation
            </Link>
          </>
        }
      />

      <Card className="mb-5">
        <label>
          <span className="sr-only">Search all documents</span>
          <input className="form-input" type="search" placeholder="Search all quotations and invoices by number, title or client…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {query.trim() && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="text-sm text-slate-500">No documents match “{query}”.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {results.map((d) => (
                  <li key={d.href} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <Link href={d.href} className="min-w-0">
                      <span className="font-semibold text-slate-900">{d.number}</span>
                      <span className="ml-2 text-slate-500">
                        {d.kind} · {d.title} · {d.clientSnapshot.company || d.clientSnapshot.name}
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={d.status} />
                      <span className="w-24 text-right font-medium">{money(d.total, d.currency)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Quotations by status" actions={<Link className="text-xs font-semibold" href="/quotations">Open list</Link>}>
          <StatusGrid rows={QUOTATION_STATUSES.map((s) => ({ status: s, count: qBy.get(s)?.count ?? 0, value: money(qBy.get(s)?.total ?? 0, cur) }))} />
        </Card>
        <Card title="Invoices by status" actions={<Link className="text-xs font-semibold" href="/invoices">Open list</Link>}>
          <StatusGrid
            rows={INVOICE_STATUSES.map((s) => ({
              status: s,
              count: iBy.get(s)?.count ?? 0,
              value: money(iBy.get(s)?.total ?? 0, cur),
              extra: Number(iBy.get(s)?.outstanding ?? 0) > 0 && s !== "VOID" ? `${money(iBy.get(s)?.outstanding, cur)} due` : undefined,
            }))}
          />
        </Card>

        <Card title="Quotations expiring within 7 days">
          {overview.expiringSoon.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing expiring soon.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overview.expiringSoon.map((q) => (
                <li key={q.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/quotations/${q.id}`} className="min-w-0 truncate">
                    <span className="font-semibold">{q.number}</span> <span className="text-slate-500">· {q.clientSnapshot.company || q.clientSnapshot.name}</span>
                  </Link>
                  <span className="shrink-0 text-amber-700">expires {date(q.expiryDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Overdue invoices">
          {overview.overdue.length === 0 ? (
            <p className="text-sm text-slate-500">No overdue invoices.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overview.overdue.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/invoices/${i.id}`} className="min-w-0 truncate">
                    <span className="font-semibold">{i.number}</span> <span className="text-slate-500">· due {date(i.dueDate)}</span>
                  </Link>
                  <span className="shrink-0 font-semibold text-rose-700">{money(i.outstandingAmount, i.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function StatusGrid({ rows }: { rows: { status: string; count: number; value: string; extra?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.status} className="rounded-lg border border-slate-200 p-3">
          <StatusBadge status={r.status} />
          <p className="mt-2 text-xl font-semibold text-slate-900">{r.count}</p>
          <p className="text-xs text-slate-500">{r.value}</p>
          {r.extra && <p className="text-xs font-medium text-amber-700">{r.extra}</p>}
        </div>
      ))}
    </div>
  );
}
