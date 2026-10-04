"use client";

import { useParams } from "next/navigation";
import { DocumentPreviewPage } from "@/features/documents/components/document-preview-page";
import { fromInvoice } from "@/features/documents/components/document-renderer";
import { InvoicesApi } from "@/services/agency-api";

export default function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DocumentPreviewPage
      deps={[id]}
      load={() => InvoicesApi.get(id)}
      toRenderable={fromInvoice}
      backHref={`/invoices/${id}`}
      loadPdf={() => InvoicesApi.pdf(id)}
    />
  );
}
