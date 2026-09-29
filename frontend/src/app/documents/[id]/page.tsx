import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="documents" record={getRecord("documents", id)} />;
}
