import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function InvoiceDetailPage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="invoices" record={getRecord("invoices", id)} />;
}
