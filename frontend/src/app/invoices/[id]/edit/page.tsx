"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, ErrorState, LoadingState } from "@/components/ui/primitives";
import { DocumentForm } from "@/features/documents/components/document-form";
import { useApi } from "@/hooks/use-api";
import { InvoicesApi } from "@/services/agency-api";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi(() => InvoicesApi.get(id), [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Invoice not found"} onRetry={reload} />;
  if (data.status !== "DRAFT") {
    return (
      <Alert tone="warning">
        {data.number} has been issued and can no longer be edited.{" "}
        <Link href={`/invoices/${id}`} className="font-semibold underline">
          Back to invoice
        </Link>
      </Alert>
    );
  }
  return <DocumentForm kind="invoice" initial={data} />;
}
