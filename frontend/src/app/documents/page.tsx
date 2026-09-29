import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { getRecords } from "@/services/workspace";

export default function DocumentsPage() { return <WorkspaceList kind="documents" records={getRecords("documents")} />; }
