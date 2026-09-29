"use client";

import { useEffect, useState } from "react";
import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { ClientsApi, type Client } from "@/services/agency-api";
import type { WorkspaceRecord } from "@/types/domain";

export default function ClientsPage() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    async function loadClients() {
      try {
        const clients = await ClientsApi.getAll();
        const mapped: WorkspaceRecord[] = clients.map((c: Client) => ({
          id: c.id,
          title: c.name,
          subtitle: c.company || c.email,
          status: c.status === "ACTIVE" ? "Active" : "In progress",
          date: c.createdAt ? c.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          secondary: c.phone || c.email,
        }));
        setRecords(mapped);
      } catch (err) {
        console.warn("Using offline fallback for clients list:", err);
      }
    }
    loadClients();
  }, []);

  return <WorkspaceList kind="clients" records={records} />;
}
