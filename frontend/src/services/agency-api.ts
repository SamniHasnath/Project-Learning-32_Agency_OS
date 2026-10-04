import { apiBlob, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Agency,
  AuthSession,
  Client,
  ClientDetail,
  DashboardMetrics,
  DocumentOverview,
  DocumentTemplate,
  DocumentType,
  Invoice,
  InvoiceInput,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  Project,
  ProjectDetail,
  Quotation,
  QuotationInput,
  QuotationStatus,
  RecentActivity,
  TemplateBranding,
  TemplateLayout,
  User,
} from "@/types/models";

const qs = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v);
  return entries.length ? `?${new URLSearchParams(entries as [string, string][]).toString()}` : "";
};

export const AuthApi = {
  login: (email: string, password: string) => apiPost<AuthSession>("/auth/login", { email, password }),
  register: (data: { agencyName: string; name: string; email: string; password: string }) =>
    apiPost<AuthSession>("/auth/register", data),
  me: () => apiGet<{ user: User; agency: Agency }>("/auth/me"),
};

export type ClientInput = Partial<Pick<Client, "name" | "email" | "phone" | "company" | "address" | "taxId" | "notes" | "status">>;
export const ClientsApi = {
  list: (search?: string) => apiGet<Client[]>(`/clients${qs({ search })}`),
  get: (id: string) => apiGet<ClientDetail>(`/clients/${id}`),
  create: (data: ClientInput) => apiPost<Client>("/clients", data),
  update: (id: string, data: ClientInput) => apiPatch<Client>(`/clients/${id}`, data),
  remove: (id: string) => apiDelete<{ success: boolean }>(`/clients/${id}`),
};

export type ProjectInput = { name?: string; description?: string; clientId?: string; status?: Project["status"]; budget?: number; startDate?: string; endDate?: string };
export const ProjectsApi = {
  list: (clientId?: string) => apiGet<Project[]>(`/projects${qs({ clientId })}`),
  get: (id: string) => apiGet<ProjectDetail>(`/projects/${id}`),
  create: (data: ProjectInput) => apiPost<Project>("/projects", data),
  update: (id: string, data: ProjectInput) => apiPatch<Project>(`/projects/${id}`, data),
  remove: (id: string) => apiDelete<{ success: boolean }>(`/projects/${id}`),
};

export const QuotationsApi = {
  list: (filters: { status?: QuotationStatus; clientId?: string; search?: string } = {}) => apiGet<Quotation[]>(`/quotations${qs(filters)}`),
  get: (id: string) => apiGet<Quotation>(`/quotations/${id}`),
  create: (data: QuotationInput) => apiPost<Quotation>("/quotations", data),
  update: (id: string, data: Partial<QuotationInput>) => apiPatch<Quotation>(`/quotations/${id}`, data),
  setStatus: (id: string, status: QuotationStatus) => apiPatch<Quotation>(`/quotations/${id}/status`, { status }),
  convertToInvoice: (id: string, data: { dueDate?: string; templateId?: string } = {}) =>
    apiPost<Invoice>(`/quotations/${id}/convert-to-invoice`, data),
  pdf: (id: string) => apiBlob(`/quotations/${id}/pdf`),
};

export const InvoicesApi = {
  list: (filters: { status?: InvoiceStatus; clientId?: string; search?: string } = {}) => apiGet<Invoice[]>(`/invoices${qs(filters)}`),
  get: (id: string) => apiGet<Invoice>(`/invoices/${id}`),
  create: (data: InvoiceInput) => apiPost<Invoice>("/invoices", data),
  update: (id: string, data: Partial<InvoiceInput>) => apiPatch<Invoice>(`/invoices/${id}`, data),
  setStatus: (id: string, status: InvoiceStatus) => apiPatch<Invoice>(`/invoices/${id}/status`, { status }),
  payments: (id: string) => apiGet<Payment[]>(`/invoices/${id}/payments`),
  pdf: (id: string) => apiBlob(`/invoices/${id}/pdf`),
};

export type PaymentInput = { invoiceId: string; amount: number; method?: PaymentMethod; paymentDate?: string; reference?: string; notes?: string };
export const PaymentsApi = {
  list: (invoiceId?: string) => apiGet<Payment[]>(`/payments${qs({ invoiceId })}`),
  get: (id: string) => apiGet<Payment>(`/payments/${id}`),
  create: (data: PaymentInput) => apiPost<Payment>("/payments", data),
};

export type TemplateInput = { name: string; type: DocumentType; isDefault?: boolean; branding: TemplateBranding; layout: TemplateLayout };
export const TemplatesApi = {
  list: (type?: DocumentType) => apiGet<DocumentTemplate[]>(`/document-templates${qs({ type })}`),
  get: (id: string) => apiGet<DocumentTemplate>(`/document-templates/${id}`),
  create: (data: TemplateInput) => apiPost<DocumentTemplate>("/document-templates", data),
  update: (id: string, data: Partial<Omit<TemplateInput, "type">>) => apiPatch<DocumentTemplate>(`/document-templates/${id}`, data),
  setDefault: (id: string) => apiPost<DocumentTemplate>(`/document-templates/${id}/set-default`),
  remove: (id: string) => apiDelete<{ success: boolean }>(`/document-templates/${id}`),
};

export const DashboardApi = {
  metrics: () => apiGet<DashboardMetrics>("/dashboard/metrics"),
  recent: () => apiGet<RecentActivity>("/dashboard/recent"),
  documents: () => apiGet<DocumentOverview>("/dashboard/documents"),
};

export type SettingsInput = Partial<Omit<Agency, "id">>;
export const SettingsApi = {
  get: () => apiGet<Agency>("/settings"),
  update: (data: SettingsInput) => apiPatch<Agency>("/settings", data),
};
