import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function PaymentDetailPage({ params }: PageProps<"/payments/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="payments" record={getRecord("payments", id)} />;
}
