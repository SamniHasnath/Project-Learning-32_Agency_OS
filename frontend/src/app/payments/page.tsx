"use client";

import { useEffect, useState } from "react";
import { WorkspaceList } from "@/components/workspace/workspace-ui";
import { PaymentsApi, type Payment } from "@/services/agency-api";
import type { WorkspaceRecord } from "@/types/domain";

export default function PaymentsPage() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    async function loadPayments() {
      try {
        const payments = await PaymentsApi.getAll();
        const mapped: WorkspaceRecord[] = payments.map((p: Payment) => ({
          id: p.id,
          title: `${p.paymentNumber} (${p.paymentMethod.replace("_", " ")})`,
          subtitle: p.invoice?.client?.name || "Invoice Payment",
          status: "Paid",
          amount: p.amount,
          date: p.paymentDate ? p.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0],
          secondary: p.reference ? `Ref: ${p.reference}` : p.notes || undefined,
        }));
        setRecords(mapped);
      } catch (err) {
        console.warn("Using offline fallback for payments list:", err);
      }
    }
    loadPayments();
  }, []);

  return <WorkspaceList kind="payments" records={records} />;
}
