import { dashboardMetrics, mockRecords } from "@/lib/mock-data";
import type { Metric, WorkspaceRecord } from "@/types/domain";

export type WorkspaceKind = keyof typeof mockRecords;

export const getRecords = (kind: WorkspaceKind): WorkspaceRecord[] =>
  mockRecords[kind].map((record) => ({ ...record }));

export const getRecord = (kind: WorkspaceKind, id: string): WorkspaceRecord | undefined =>
  getRecords(kind).find((record) => record.id === id);

export const getDashboardMetrics = (): Metric[] => dashboardMetrics.map((metric) => ({ ...metric }));

export const getRecentActivity = (): WorkspaceRecord[] => [
  { id: "ACT-1", title: "Quotation accepted", subtitle: "Website redesign · Northstar Labs", status: "Accepted", date: "2026-09-21" },
  { id: "ACT-2", title: "Payment received", subtitle: "$6,400 from Northstar Labs", status: "Paid", date: "2026-09-20" },
  { id: "ACT-3", title: "New client added", subtitle: "Fieldwork Coffee", status: "Active", date: "2026-09-18" },
  { id: "ACT-4", title: "Invoice overdue", subtitle: "Packaging design · Fieldwork Coffee", status: "Overdue", date: "2026-09-12" },
];
