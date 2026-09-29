import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { getRecords } from "@/services/workspace";

export default function TemplatesPage() { return <WorkspaceList kind="templates" records={getRecords("templates")} />; }
