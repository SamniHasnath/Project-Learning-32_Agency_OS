import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function TemplateDetailPage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="templates" record={getRecord("templates", id)} />;
}
