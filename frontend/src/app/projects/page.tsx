"use client";

import { useEffect, useState } from "react";
import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { ProjectsApi, type Project } from "@/services/agency-api";
import type { WorkspaceRecord } from "@/types/domain";

export default function ProjectsPage() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const projects = await ProjectsApi.getAll();
        const mapped: WorkspaceRecord[] = projects.map((p: Project) => ({
          id: p.id,
          title: p.name,
          subtitle: p.client?.name || "Client",
          status: p.status === "COMPLETED" ? "Completed" : p.status === "IN_PROGRESS" ? "In progress" : "Active",
          amount: p.budget,
          date: p.createdAt ? p.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          secondary: p.description || undefined,
        }));
        setRecords(mapped);
      } catch (err) {
        console.warn("Using offline fallback for projects list:", err);
      }
    }
    loadProjects();
  }, []);

  return <WorkspaceList kind="projects" records={records} />;
}
