import { fetchApi } from "./api";

// Types
export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  status: "ACTIVE" | "INACTIVE" | "LEAD";
  createdAt: string;
  _count?: { projects: number; quotations: number; invoices: number };
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  budget: number;
  startDate?: string;
  endDate?: string;
  clientId: string;
  client?: Client;
  createdAt: string;
};

export type QuotationItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Quotation = {
  id: string;
  quoteNumber: string;
  title: string;
  clientId: string;
  client?: Client;
  projectId?: string;
  project?: Project;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  validUntil: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  items: QuotationItem[];
  createdAt: string;
};

export type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Payment = {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  title: string;
  clientId: string;
  client?: Client;
  projectId?: string;
  project?: Project;
  quotationId?: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
};

export type AgencySettings = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  address?: string;
  logoUrl?: string;
};

export type DashboardMetrics = {
  totalRevenue: number;
  pendingAmount: number;
  activeProjects: number;
  totalClients: number;
  activeQuotations: number;
};

// Client API Calls
export const ClientsApi = {
  getAll: () => fetchApi<Client[]>("/api/clients"),
  getOne: (id: string) => fetchApi<Client>(`/api/clients/${id}`),
  create: (data: Partial<Client>) => fetchApi<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Client>) => fetchApi<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ success: boolean }>(`/api/clients/${id}`, { method: "DELETE" }),
};

// Projects API Calls
export const ProjectsApi = {
  getAll: () => fetchApi<Project[]>("/api/projects"),
  getOne: (id: string) => fetchApi<Project>(`/api/projects/${id}`),
  create: (data: Partial<Project>) => fetchApi<Project>("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) => fetchApi<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ success: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
};

// Quotations API Calls
export const QuotationsApi = {
  getAll: () => fetchApi<Quotation[]>("/api/quotations"),
  getOne: (id: string) => fetchApi<Quotation>(`/api/quotations/${id}`),
  create: (data: Partial<Quotation>) => fetchApi<Quotation>("/api/quotations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Quotation>) => fetchApi<Quotation>(`/api/quotations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  convertToInvoice: (id: string) => fetchApi<Invoice>(`/api/quotations/${id}/convert`, { method: "POST" }),
  delete: (id: string) => fetchApi<{ success: boolean }>(`/api/quotations/${id}`, { method: "DELETE" }),
};

// Invoices API Calls
export const InvoicesApi = {
  getAll: () => fetchApi<Invoice[]>("/api/invoices"),
  getOne: (id: string) => fetchApi<Invoice>(`/api/invoices/${id}`),
  create: (data: Partial<Invoice>) => fetchApi<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Invoice>) => fetchApi<Invoice>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<{ success: boolean }>(`/api/invoices/${id}`, { method: "DELETE" }),
};

// Payments API Calls
export const PaymentsApi = {
  getAll: () => fetchApi<Payment[]>("/api/payments"),
  getOne: (id: string) => fetchApi<Payment>(`/api/payments/${id}`),
  create: (data: { invoiceId: string; amount: number; paymentMethod?: string; reference?: string; notes?: string }) =>
    fetchApi<Payment>("/api/payments", { method: "POST", body: JSON.stringify(data) }),
};

// Dashboard & Settings API Calls
export const DashboardApi = {
  getMetrics: () => fetchApi<DashboardMetrics>("/api/dashboard/metrics"),
  getRecent: () => fetchApi<{ invoices: Invoice[]; quotations: Quotation[]; payments: Payment[] }>("/api/dashboard/recent"),
};

export const SettingsApi = {
  get: () => fetchApi<AgencySettings>("/api/settings"),
  update: (data: Partial<AgencySettings>) => fetchApi<AgencySettings>("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
};
