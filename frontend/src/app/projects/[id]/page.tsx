import { RecordDetail } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function ProjectDetailPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return <RecordDetail kind="projects" record={getRecord("projects", id)} />;
}
