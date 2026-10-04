"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { buttonClass, Card, DescriptionList, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { date, money, titleCase } from "@/lib/format";
import { PaymentsApi } from "@/services/agency-api";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: p, error, loading, reload } = useApi(() => PaymentsApi.get(id), [id]);
  if (loading && !p) return <LoadingState />;
  if (error || !p) return <ErrorState message={error ?? "Payment not found"} onRetry={reload} />;
  const cur = p.invoice?.currency;

  return (
    <>
      <PageHeading
        eyebrow="Payment"
        title={`${p.number} · ${money(p.amount, cur)}`}
        description={`Received ${date(p.paymentDate, "long")} via ${titleCase(p.method)}`}
        back={{ href: "/payments", label: "All payments" }}
        actions={
          <Link href={`/invoices/${p.invoiceId}`} className={buttonClass.secondary}>
            View invoice {p.invoice?.number}
          </Link>
        }
      />
      <div className="grid max-w-4xl gap-5 md:grid-cols-2">
        <Card title="Payment">
          <DescriptionList
            items={[
              ["Amount", money(p.amount, cur)],
              ["Method", titleCase(p.method)],
              ["Date", date(p.paymentDate)],
              ["Reference", p.reference],
              ["Notes", p.notes],
              ["Recorded", date(p.createdAt)],
            ]}
          />
        </Card>
        <Card title="Invoice">
          <DescriptionList
            items={[
              ["Invoice", p.invoice?.number],
              ["Client", p.invoice?.clientSnapshot.company || p.invoice?.clientSnapshot.name],
              ["Invoice total", money(p.invoice?.total, cur)],
              ["Outstanding now", money(p.invoice?.outstandingAmount, cur)],
              ["Status", p.invoice?.status ? <StatusBadge key="s" status={p.invoice.status} /> : null],
            ]}
          />
        </Card>
      </div>
    </>
  );
}
