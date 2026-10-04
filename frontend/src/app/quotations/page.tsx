"use client";

import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { buttonClass, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { QUOTATION_STATUSES } from "@/features/documents/status";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { QuotationsApi } from "@/services/agency-api";
import type { Quotation } from "@/types/models";

export default function QuotationsPage() {
  const { data, error, loading, reload } = useApi(() => QuotationsApi.list(), []);
  const newButton = (
    <Link href="/quotations/new" className={buttonClass.primary}>
      + New quotation
    </Link>
  );

  return (
    <>
      <PageHeading title="Quotations" description="Create, send and track quotations through acceptance and invoicing." actions={newButton} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DataTable<Quotation>
          rows={data ?? []}
          rowHref={(q) => `/quotations/${q.id}`}
          searchText={(q) => `${q.number} ${q.title} ${q.clientSnapshot.name} ${q.clientSnapshot.company ?? ""}`}
          searchPlaceholder="Search by number, title or client…"
          statusOf={(q) => q.status}
          statuses={QUOTATION_STATUSES}
          empty={{ title: "No quotations yet", description: "Create your first quotation to get started.", action: newButton }}
          columns={[
            {
              header: "Quotation",
              sortValue: (q) => q.number,
              cell: (q) => (
                <>
                  <span className="font-semibold">{q.number}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{q.title}</span>
                </>
              ),
            },
            { header: "Client", sortValue: (q) => q.clientSnapshot.company || q.clientSnapshot.name, cell: (q) => q.clientSnapshot.company || q.clientSnapshot.name },
            { header: "Status", sortValue: (q) => q.status, cell: (q) => <StatusBadge status={q.status} /> },
            { header: "Total", align: "right", sortValue: (q) => Number(q.total), cell: (q) => <span className="font-medium">{money(q.total, q.currency)}</span> },
            { header: "Issued", sortValue: (q) => q.issueDate, cell: (q) => date(q.issueDate) },
            { header: "Expires", sortValue: (q) => q.expiryDate, cell: (q) => date(q.expiryDate) },
            {
              header: "Invoice",
              cell: (q) =>
                q.invoice ? (
                  <Link href={`/invoices/${q.invoice.id}`} className="text-sm font-medium">
                    {q.invoice.number}
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
          ]}
        />
      )}
    </>
  );
}
