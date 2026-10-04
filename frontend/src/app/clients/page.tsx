"use client";

import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { buttonClass, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { date } from "@/lib/format";
import { ClientsApi } from "@/services/agency-api";
import type { Client } from "@/types/models";

export default function ClientsPage() {
  const { data, error, loading, reload } = useApi(() => ClientsApi.list(), []);
  const newButton = (
    <Link href="/clients/new" className={buttonClass.primary}>
      + New client
    </Link>
  );
  return (
    <>
      <PageHeading title="Clients" description="The people and companies you quote and invoice." actions={newButton} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DataTable<Client>
          rows={data ?? []}
          rowHref={(c) => `/clients/${c.id}`}
          searchText={(c) => `${c.name} ${c.email} ${c.company ?? ""}`}
          searchPlaceholder="Search by name, company or email…"
          statusOf={(c) => c.status}
          statuses={["ACTIVE", "LEAD", "INACTIVE"]}
          empty={{ title: "No clients yet", description: "Add a client to start creating quotations.", action: newButton }}
          columns={[
            {
              header: "Client",
              sortValue: (c) => c.company || c.name,
              cell: (c) => (
                <>
                  <span className="font-semibold">{c.company || c.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{c.company ? c.name : c.email}</span>
                </>
              ),
            },
            { header: "Email", sortValue: (c) => c.email, cell: (c) => c.email },
            { header: "Status", sortValue: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
            { header: "Quotations", align: "right", sortValue: (c) => c._count?.quotations ?? 0, cell: (c) => c._count?.quotations ?? 0 },
            { header: "Invoices", align: "right", sortValue: (c) => c._count?.invoices ?? 0, cell: (c) => c._count?.invoices ?? 0 },
            { header: "Added", sortValue: (c) => c.createdAt, cell: (c) => date(c.createdAt) },
          ]}
        />
      )}
    </>
  );
}
