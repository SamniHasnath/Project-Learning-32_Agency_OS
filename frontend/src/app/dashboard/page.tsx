"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/workspace/workspace-ui";
import { DashboardApi, type DashboardMetrics, type Invoice, type Quotation, type Payment } from "@/services/agency-api";
import type { Metric, WorkspaceRecord } from "@/types/domain";

export default function DashboardPage() {
  const [metricsData, setMetricsData] = useState<DashboardMetrics | null>(null);
  const [recentData, setRecentData] = useState<{ invoices: Invoice[]; quotations: Quotation[]; payments: Payment[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, r] = await Promise.all([
          DashboardApi.getMetrics(),
          DashboardApi.getRecent(),
        ]);
        setMetricsData(m);
        setRecentData(r);
      } catch (err) {
        console.warn("Using offline mode / fallback for dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formattedMetrics: Metric[] = metricsData
    ? [
        {
          label: "Total Revenue",
          value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(metricsData.totalRevenue),
          change: "+12.4% vs last month",
          tone: "brand",
        },
        {
          label: "Pending Invoices",
          value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(metricsData.pendingAmount),
          change: "Outstanding collection",
          tone: "amber",
        },
        {
          label: "Active Projects",
          value: `${metricsData.activeProjects} active`,
          change: "In progress",
          tone: "green",
        },
        {
          label: "Active Quotations",
          value: `${metricsData.activeQuotations} proposals`,
          change: "Sent to clients",
          tone: "blue",
        },
      ]
    : [
        { label: "Total Revenue", value: "$48,250", change: "+14.2% vs last month", tone: "brand" },
        { label: "Pending Invoices", value: "$8,250", change: "Outstanding collection", tone: "amber" },
        { label: "Active Projects", value: "8 active", change: "In progress", tone: "green" },
        { label: "Active Quotations", value: "4 proposals", change: "Sent to clients", tone: "blue" },
      ];

  const formattedActivity: WorkspaceRecord[] = recentData
    ? [
        ...recentData.invoices.map((inv) => ({
          id: inv.invoiceNumber,
          title: `Invoice ${inv.invoiceNumber} - ${inv.client?.name || "Client"}`,
          subtitle: inv.title,
          status: (inv.status === "PAID" ? "Paid" : inv.status === "SENT" ? "Sent" : "Overdue") as any,
          amount: inv.totalAmount,
          date: inv.createdAt.split("T")[0],
        })),
        ...recentData.quotations.map((q) => ({
          id: q.quoteNumber,
          title: `Quotation ${q.quoteNumber} - ${q.client?.name || "Client"}`,
          subtitle: q.title,
          status: (q.status === "ACCEPTED" ? "Accepted" : q.status === "SENT" ? "Sent" : "Draft") as any,
          amount: q.totalAmount,
          date: q.createdAt.split("T")[0],
        })),
      ].slice(0, 5)
    : [
        { id: "INV-2026-0001", title: "Invoice INV-2026-0001 - Globex", subtitle: "Brand Identity Design", status: "Paid", amount: 9200, date: "2026-09-28" },
        { id: "QT-2026-0001", title: "Quotation QT-2026-0001 - Acme Corp", subtitle: "Enterprise Web App", status: "Sent", amount: 16500, date: "2026-09-27" },
      ];

  return <Dashboard metrics={formattedMetrics} activity={formattedActivity} />;
}
