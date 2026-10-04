"use client";

import Link from "next/link";
import { buttonClass, Card, ErrorState, LoadingState, PageHeading, Stat, StatusBadge } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { DashboardApi } from "@/services/agency-api";

export default function DashboardPage() {
  const { user, agency } = useSession();
  const { data, error, loading, reload } = useApi(() => Promise.all([DashboardApi.metrics(), DashboardApi.recent()]), []);
  const cur = agency.currency;

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Could not load dashboard"} onRetry={reload} />;
  const [m, recent] = data;
  const max = Math.max(1, ...m.revenueByMonth.map((r) => Number(r.amount)));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeading
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={`Here's what's happening at ${agency.name}.`}
        actions={
          <>
            <Link href="/invoices/new" className={buttonClass.secondary}>
              + Invoice
            </Link>
            <Link href="/quotations/new" className={buttonClass.primary}>
              + Quotation
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue collected" value={money(m.totalRevenue, cur)} hint="All recorded payments" tone="brand" />
        <Stat label="Outstanding" value={money(m.outstandingAmount, cur)} hint={`${m.openInvoices} open invoice${m.openInvoices === 1 ? "" : "s"}`} tone="amber" />
        <Stat label="Overdue" value={money(m.overdueAmount, cur)} hint={`${m.overdueInvoices} overdue invoice${m.overdueInvoices === 1 ? "" : "s"}`} tone="rose" />
        <Stat label="Open quotations" value={money(m.openQuotationsValue, cur)} hint={`${m.openQuotations} draft or sent · ${m.totalClients} clients · ${m.activeProjects} active projects`} tone="blue" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Revenue collected" description="Payments received over the last 12 months">
          <div className="flex h-48 items-end gap-1.5 border-b border-l border-slate-100 px-2 sm:gap-3">
            {m.revenueByMonth.map((r) => {
              const pct = (Number(r.amount) / max) * 100;
              const label = new Date(`${r.month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
              return (
                <div key={r.month} className="group relative flex h-full flex-1 items-end" title={`${label}: ${money(r.amount, cur)}`}>
                  <div className="w-full rounded-t-sm bg-brand-500 transition group-hover:bg-brand-700" style={{ height: `${Math.max(pct, Number(r.amount) > 0 ? 3 : 0.5)}%` }} aria-label={`${label}: ${money(r.amount, cur)}`} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 px-2 text-center text-[11px] text-slate-400 sm:gap-3" aria-hidden="true">
            {m.revenueByMonth.map((r, i, all) => (
              <span key={r.month} className="flex-1">
                {i % 2 === 1 || i === all.length - 1 ? new Date(`${r.month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : ""}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Recent payments" actions={<Link className="text-xs font-semibold" href="/payments">View all</Link>}>
          {recent.payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/invoices/${p.invoiceId}`} className="font-medium text-slate-800 hover:text-brand-700">
                      {p.invoice?.number}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {p.invoice?.clientSnapshot.company || p.invoice?.clientSnapshot.name} · {date(p.paymentDate)}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-700">{money(p.amount, p.invoice?.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Recent quotations" actions={<Link className="text-xs font-semibold" href="/quotations">View all</Link>}>
          <RecentList rows={recent.quotations.map((q) => ({ id: q.id, href: `/quotations/${q.id}`, number: q.number, title: q.title, status: q.status, amount: money(q.total, q.currency) }))} empty="No quotations yet." />
        </Card>
        <Card title="Recent invoices" actions={<Link className="text-xs font-semibold" href="/invoices">View all</Link>}>
          <RecentList rows={recent.invoices.map((i) => ({ id: i.id, href: `/invoices/${i.id}`, number: i.number, title: i.title, status: i.status, amount: money(i.total, i.currency) }))} empty="No invoices yet." />
        </Card>
      </div>
    </>
  );
}

function RecentList({ rows, empty }: { rows: { id: string; href: string; number: string; title: string; status: string; amount: string }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <Link href={r.href} className="font-medium text-slate-800 hover:text-brand-700">
              {r.number}
            </Link>
            <p className="truncate text-xs text-slate-500">{r.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={r.status} />
            <span className="w-24 text-right font-medium text-slate-900">{r.amount}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
