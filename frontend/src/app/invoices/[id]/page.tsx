"use client";

import { useParams } from "next/navigation";
import { InvoiceDetail } from "@/features/invoices/invoice-detail";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <InvoiceDetail id={id} />;
}
