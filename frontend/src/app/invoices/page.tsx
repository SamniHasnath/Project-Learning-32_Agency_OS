"use client";

import { useEffect, useState } from "react";
import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { InvoicesApi, type Invoice } from "@/services/agency-api";
import type { WorkspaceRecord } from "@/types/domain";

export default function InvoicesPage() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const invoices = await InvoicesApi.getAll();
        const mapped: WorkspaceRecord[] = invoices.map((inv: Invoice) => ({
          id: inv.id,
          title: `${inv.invoiceNumber} - ${inv.title}`,
          subtitle: inv.client?.name || "Client",
          status: inv.status === "PAID" ? "Paid" : inv.status === "PARTIALLY_PAID" ? "In progress" : inv.status === "SENT" ? "Sent" : "Draft",
          amount: inv.totalAmount,
          date: inv.createdAt ? inv.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          secondary: `Balance due: $${inv.balance.toLocaleString()}`,
        }));
        setRecords(mapped);
      } catch (err) {
        console.warn("Using offline fallback for invoices list:", err);
      }
    }
    loadInvoices();
  }, []);

  return <WorkspaceList kind="invoices" records={records} />;
}
