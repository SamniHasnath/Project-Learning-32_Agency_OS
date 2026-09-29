"use client";

import { useEffect, useState } from "react";
import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { QuotationsApi, type Quotation } from "@/services/agency-api";
import type { WorkspaceRecord } from "@/types/domain";

export default function QuotationsPage() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    async function loadQuotations() {
      try {
        const quotations = await QuotationsApi.getAll();
        const mapped: WorkspaceRecord[] = quotations.map((q: Quotation) => ({
          id: q.id,
          title: `${q.quoteNumber} - ${q.title}`,
          subtitle: q.client?.name || "Client",
          status: q.status === "ACCEPTED" ? "Accepted" : q.status === "SENT" ? "Sent" : "Draft",
          amount: q.totalAmount,
          date: q.createdAt ? q.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          secondary: `Valid until ${q.validUntil ? q.validUntil.split("T")[0] : "—"}`,
        }));
        setRecords(mapped);
      } catch (err) {
        console.warn("Using offline fallback for quotations list:", err);
      }
    }
    loadQuotations();
  }, []);

  return <WorkspaceList kind="quotations" records={records} />;
}
