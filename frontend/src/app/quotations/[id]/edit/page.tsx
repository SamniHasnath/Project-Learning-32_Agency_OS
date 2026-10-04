"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, ErrorState, LoadingState } from "@/components/ui/primitives";
import { DocumentForm } from "@/features/documents/components/document-form";
import { useApi } from "@/hooks/use-api";
import { QuotationsApi } from "@/services/agency-api";

export default function EditQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi(() => QuotationsApi.get(id), [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Quotation not found"} onRetry={reload} />;
  if (data.status !== "DRAFT") {
    return (
      <Alert tone="warning">
        {data.number} is {data.status.toLowerCase()} and can no longer be edited.{" "}
        <Link href={`/quotations/${id}`} className="font-semibold underline">
          Back to quotation
        </Link>
      </Alert>
    );
  }
  return <DocumentForm kind="quotation" initial={data} />;
}
