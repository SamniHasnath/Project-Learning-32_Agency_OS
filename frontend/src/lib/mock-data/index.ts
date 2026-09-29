import type { Metric, WorkspaceRecord } from "@/types/domain";

export const dashboardMetrics: Metric[] = [
  { label: "Total revenue", value: "$48,290", change: "+12.8% vs last month", tone: "brand" },
  { label: "Outstanding", value: "$12,450", change: "Across 8 invoices", tone: "amber" },
  { label: "Active projects", value: "12", change: "3 due this month", tone: "blue" },
  { label: "New clients", value: "8", change: "+2 this month", tone: "green" },
];

export const mockRecords: Record<string, WorkspaceRecord[]> = {
  clients: [
    { id: "CL-1042", title: "Acme Studio", subtitle: "Olivia Chen · olivia@acmestudio.co", status: "Active", date: "2026-09-18", secondary: "Brand identity" },
    { id: "CL-1041", title: "Northstar Labs", subtitle: "Marcus Lee · marcus@northstar.io", status: "Active", date: "2026-09-16", secondary: "Technology" },
    { id: "CL-1040", title: "Fieldwork Coffee", subtitle: "Sofia Reyes · sofia@fieldwork.coffee", status: "Active", date: "2026-09-12", secondary: "Hospitality" },
    { id: "CL-1039", title: "Forma Interiors", subtitle: "Noah Park · noah@formainteriors.com", status: "Pending", date: "2026-09-08", secondary: "Interior design" },
    { id: "CL-1038", title: "Monogram Goods", subtitle: "Ava Wilson · ava@monogramgoods.com", status: "Active", date: "2026-09-04", secondary: "Retail" },
  ],
  projects: [
    { id: "PR-208", title: "Brand refresh", subtitle: "Acme Studio", status: "In progress", amount: 8400, date: "2026-10-14", secondary: "65% complete" },
    { id: "PR-207", title: "E-commerce website", subtitle: "Northstar Labs", status: "In progress", amount: 12800, date: "2026-10-22", secondary: "40% complete" },
    { id: "PR-206", title: "Packaging system", subtitle: "Fieldwork Coffee", status: "Completed", amount: 6200, date: "2026-09-20", secondary: "100% complete" },
    { id: "PR-205", title: "Campaign creative", subtitle: "Forma Interiors", status: "In progress", amount: 4500, date: "2026-10-02", secondary: "80% complete" },
  ],
  quotations: [
    { id: "QT-2026-042", title: "Brand identity package", subtitle: "Acme Studio", status: "Sent", amount: 8400, date: "2026-09-22", secondary: "Expires Oct 22, 2026" },
    { id: "QT-2026-041", title: "Website redesign", subtitle: "Northstar Labs", status: "Accepted", amount: 12800, date: "2026-09-19", secondary: "Accepted Sep 21" },
    { id: "QT-2026-040", title: "Packaging design", subtitle: "Fieldwork Coffee", status: "Draft", amount: 6200, date: "2026-09-17", secondary: "Updated Sep 20" },
    { id: "QT-2026-039", title: "Social campaign", subtitle: "Forma Interiors", status: "Declined", amount: 3800, date: "2026-09-12", secondary: "Declined Sep 16" },
  ],
  invoices: [
    { id: "INV-2026-038", title: "Brand refresh · 1 of 2", subtitle: "Acme Studio", status: "Pending", amount: 4200, date: "2026-10-05", secondary: "Due in 8 days" },
    { id: "INV-2026-037", title: "Website project · deposit", subtitle: "Northstar Labs", status: "Paid", amount: 6400, date: "2026-09-20", secondary: "Paid Sep 20" },
    { id: "INV-2026-036", title: "Packaging design", subtitle: "Fieldwork Coffee", status: "Overdue", amount: 3100, date: "2026-09-12", secondary: "8 days overdue" },
    { id: "INV-2026-035", title: "Creative direction", subtitle: "Monogram Goods", status: "Paid", amount: 2400, date: "2026-09-08", secondary: "Paid Sep 8" },
  ],
  payments: [
    { id: "PAY-0098", title: "Website project deposit", subtitle: "Northstar Labs · INV-2026-037", status: "Paid", amount: 6400, date: "2026-09-20", secondary: "Bank transfer" },
    { id: "PAY-0097", title: "Brand identity · milestone 1", subtitle: "Acme Studio · INV-2026-034", status: "Paid", amount: 4200, date: "2026-09-18", secondary: "Card" },
    { id: "PAY-0096", title: "Packaging design", subtitle: "Fieldwork Coffee · INV-2026-036", status: "Pending", amount: 3100, date: "2026-09-16", secondary: "Bank transfer" },
  ],
  templates: [
    { id: "TM-01", title: "Brand identity proposal", subtitle: "Quotation · Updated Sep 18", status: "Active", date: "2026-09-18", secondary: "6 sections" },
    { id: "TM-02", title: "Website development", subtitle: "Quotation · Updated Sep 12", status: "Active", date: "2026-09-12", secondary: "8 sections" },
    { id: "TM-03", title: "Monthly retainer", subtitle: "Invoice · Updated Sep 10", status: "Active", date: "2026-09-10", secondary: "4 sections" },
  ],
  documents: [
    { id: "DOC-104", title: "Brand strategy brief.pdf", subtitle: "Acme Studio · 2.4 MB", status: "Active", date: "2026-09-22", secondary: "PDF" },
    { id: "DOC-103", title: "Project scope v2.docx", subtitle: "Northstar Labs · 864 KB", status: "Active", date: "2026-09-19", secondary: "DOCX" },
    { id: "DOC-102", title: "Packaging references.zip", subtitle: "Fieldwork Coffee · 18.2 MB", status: "Active", date: "2026-09-15", secondary: "ZIP" },
  ],
};
