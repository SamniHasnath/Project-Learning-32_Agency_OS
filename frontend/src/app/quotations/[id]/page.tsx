import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function QuotationDetailPage({ params }: PageProps<"/quotations/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="quotations" record={getRecord("quotations", id)} />;
}
