export type RecordStatus =
  | "Active"
  | "In progress"
  | "Completed"
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Declined"
  | "Paid"
  | "Overdue"
  | "Pending";

export type WorkspaceRecord = {
  id: string;
  title: string;
  subtitle: string;
  status: RecordStatus;
  amount?: number;
  date: string;
  secondary?: string;
};

export type Metric = {
  label: string;
  value: string;
  change: string;
  tone: "brand" | "green" | "amber" | "blue";
};

export type QuoteLine = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};
