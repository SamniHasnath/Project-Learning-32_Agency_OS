"use client";

import { useParams } from "next/navigation";
import { DocumentPreviewPage } from "@/features/documents/components/document-preview-page";
import { fromQuotation } from "@/features/documents/components/document-renderer";
import { QuotationsApi } from "@/services/agency-api";

export default function QuotationPreviewPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DocumentPreviewPage
      deps={[id]}
      load={() => QuotationsApi.get(id)}
      toRenderable={fromQuotation}
      backHref={`/quotations/${id}`}
      loadPdf={() => QuotationsApi.pdf(id)}
    />
  );
}
