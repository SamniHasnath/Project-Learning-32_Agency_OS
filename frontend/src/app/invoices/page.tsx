"use client";

import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { buttonClass, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { INVOICE_STATUSES } from "@/features/documents/status";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { InvoicesApi } from "@/services/agency-api";
import type { Invoice } from "@/types/models";

export default function InvoicesPage() {
  const { data, error, loading, reload } = useApi(() => InvoicesApi.list(), []);
  const newButton = (
    <Link href="/invoices/new" className={buttonClass.primary}>
      + New invoice
    </Link>
  );

  return (
    <>
      <PageHeading title="Invoices" description="Bill clients, record payments and track what's outstanding." actions={newButton} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DataTable<Invoice>
          rows={data ?? []}
          rowHref={(i) => `/invoices/${i.id}`}
          searchText={(i) => `${i.number} ${i.title} ${i.reference ?? ""} ${i.clientSnapshot.name} ${i.clientSnapshot.company ?? ""}`}
          searchPlaceholder="Search by number, title, reference or client…"
          statusOf={(i) => i.status}
          statuses={INVOICE_STATUSES}
          empty={{ title: "No invoices yet", description: "Create an invoice directly or convert an accepted quotation.", action: newButton }}
          columns={[
            {
              header: "Invoice",
              sortValue: (i) => i.number,
              cell: (i) => (
                <>
                  <span className="font-semibold">{i.number}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {i.title}
                    {i.quotation ? ` · from ${i.quotation.number}` : ""}
                  </span>
                </>
              ),
            },
            { header: "Client", sortValue: (i) => i.clientSnapshot.company || i.clientSnapshot.name, cell: (i) => i.clientSnapshot.company || i.clientSnapshot.name },
            { header: "Status", sortValue: (i) => i.status, cell: (i) => <StatusBadge status={i.status} /> },
            { header: "Total", align: "right", sortValue: (i) => Number(i.total), cell: (i) => money(i.total, i.currency) },
            {
              header: "Outstanding",
              align: "right",
              sortValue: (i) => Number(i.outstandingAmount),
              cell: (i) => <span className={Number(i.outstandingAmount) > 0 && i.status !== "VOID" ? "font-semibold text-slate-900" : "text-slate-400"}>{money(i.outstandingAmount, i.currency)}</span>,
            },
            { header: "Due", sortValue: (i) => i.dueDate, cell: (i) => <span className={i.status === "OVERDUE" ? "font-medium text-rose-700" : ""}>{date(i.dueDate)}</span> },
          ]}
        />
      )}
    </>
  );
}
