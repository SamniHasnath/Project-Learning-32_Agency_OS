"use client";

import Link from "next/link";
import { DataTable } from "@/components/tables/data-table";
import { ErrorState, LoadingState, PageHeading } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { date, money, titleCase } from "@/lib/format";
import { PaymentsApi } from "@/services/agency-api";
import type { Payment } from "@/types/models";

export default function PaymentsPage() {
  const { data, error, loading, reload } = useApi(() => PaymentsApi.list(), []);
  return (
    <>
      <PageHeading title="Payments" description="Every payment recorded against your invoices. Record new payments from an invoice." />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DataTable<Payment>
          rows={data ?? []}
          rowHref={(p) => `/payments/${p.id}`}
          searchText={(p) => `${p.number} ${p.reference ?? ""} ${p.invoice?.number ?? ""} ${p.invoice?.clientSnapshot.name ?? ""} ${p.invoice?.clientSnapshot.company ?? ""}`}
          searchPlaceholder="Search by payment, invoice, reference or client…"
          statusOf={(p) => p.method}
          statuses={["BANK_TRANSFER", "CREDIT_CARD", "CASH", "CHECK", "STRIPE", "PAYPAL", "OTHER"]}
          empty={{
            title: "No payments yet",
            description: "Open a sent invoice to record a payment against it.",
            action: (
              <Link href="/invoices" className="text-sm font-semibold">
                Go to invoices →
              </Link>
            ),
          }}
          columns={[
            { header: "Payment", sortValue: (p) => p.number, cell: (p) => <span className="font-semibold">{p.number}</span> },
            {
              header: "Invoice",
              sortValue: (p) => p.invoice?.number ?? "",
              cell: (p) => (
                <Link href={`/invoices/${p.invoiceId}`} className="font-medium">
                  {p.invoice?.number}
                </Link>
              ),
            },
            { header: "Client", cell: (p) => p.invoice?.clientSnapshot.company || p.invoice?.clientSnapshot.name },
            { header: "Method", sortValue: (p) => p.method, cell: (p) => titleCase(p.method) },
            { header: "Amount", align: "right", sortValue: (p) => Number(p.amount), cell: (p) => <span className="font-semibold text-emerald-700">{money(p.amount, p.invoice?.currency)}</span> },
            { header: "Date", sortValue: (p) => p.paymentDate, cell: (p) => date(p.paymentDate) },
          ]}
        />
      )}
    </>
  );
}
