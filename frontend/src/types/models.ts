/**
 * API models. Money and quantities arrive as decimal strings (Prisma Decimal)
 * — never do arithmetic on them for anything that's saved; the server is the
 * source of truth for totals.
 */
export type Money = string;

export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "VOID";
export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
export type DocumentStatus = QuotationStatus | InvoiceStatus;
export type DocumentType = "QUOTATION" | "INVOICE";
export type DiscountType = "FIXED" | "PERCENTAGE";
export type ClientStatus = "ACTIVE" | "INACTIVE" | "LEAD";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHECK" | "STRIPE" | "PAYPAL" | "OTHER";

export type User = { id: string; email: string; name: string; role: "OWNER" | "MEMBER"; agencyId: string };

export type Agency = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  currency: string;
  logoUrl: string | null;
};

export type AuthSession = { accessToken: string; user: User; agency: Agency };

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  status: ClientStatus;
  createdAt: string;
  _count?: { projects: number; quotations: number; invoices: number };
};

export type ClientDetail = Client & { projects: Project[]; quotations: Quotation[]; invoices: Invoice[] };

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  budget: Money;
  startDate: string | null;
  endDate: string | null;
  clientId: string;
  client?: Pick<Client, "id" | "name" | "company" | "email">;
  createdAt: string;
  _count?: { quotations: number; invoices: number };
};

export type ProjectDetail = Project & { quotations: Quotation[]; invoices: Invoice[] };

export type SectionKey = "header" | "parties" | "items" | "totals" | "notes" | "terms" | "footer";
export type FontFamily = "Helvetica" | "Times-Roman" | "Courier";
export type TemplateBranding = { primaryColor: string; accentColor: string; fontFamily: FontFamily; showLogo: boolean };
export type TemplateLayout = { title: string; sections: { key: SectionKey; visible: boolean }[]; footerText?: string };

export type DocumentTemplate = {
  id: string;
  name: string;
  type: DocumentType;
  isDefault: boolean;
  branding: TemplateBranding;
  layout: TemplateLayout;
  version: number;
  updatedAt: string;
};

export type TemplateSnapshot = { id: string | null; name: string; version: number; branding: TemplateBranding; layout: TemplateLayout };
export type ClientSnapshot = Pick<Client, "id" | "name" | "email" | "phone" | "company" | "address" | "taxId">;
export type AgencySnapshot = Omit<Agency, "id">;

export type LineItem = { id?: string; position?: number; description: string; quantity: Money; unitPrice: Money; lineTotal: Money };

type CommercialDocument = {
  id: string;
  number: string;
  title: string;
  issueDate: string;
  clientId: string;
  projectId: string | null;
  templateId: string | null;
  clientSnapshot: ClientSnapshot;
  agencySnapshot: AgencySnapshot;
  templateSnapshot: TemplateSnapshot;
  subtotal: Money;
  discountType: DiscountType;
  discountValue: Money;
  discountAmount: Money;
  taxRate: Money;
  taxAmount: Money;
  total: Money;
  currency: string;
  notes: string | null;
  terms: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: LineItem[];
  project?: { id: string; name: string } | null;
};

export type Quotation = CommercialDocument & {
  status: QuotationStatus;
  expiryDate: string;
  acceptedAt: string | null;
  invoice?: { id: string; number: string; status?: InvoiceStatus } | null;
};

export type Payment = {
  id: string;
  number: string;
  invoiceId: string;
  amount: Money;
  method: PaymentMethod;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    number: string;
    title?: string;
    currency: string;
    clientSnapshot: ClientSnapshot;
    total?: Money;
    outstandingAmount?: Money;
    status?: InvoiceStatus;
  };
};

export type Invoice = CommercialDocument & {
  status: InvoiceStatus;
  dueDate: string;
  reference: string | null;
  quotationId: string | null;
  quotation?: { id: string; number: string } | null;
  paidAmount: Money;
  outstandingAmount: Money;
  paidAt: string | null;
  payments?: Payment[];
};

export type DashboardMetrics = {
  totalRevenue: Money;
  outstandingAmount: Money;
  openInvoices: number;
  overdueAmount: Money;
  overdueInvoices: number;
  openQuotationsValue: Money;
  openQuotations: number;
  totalClients: number;
  activeProjects: number;
  revenueByMonth: { month: string; amount: Money }[];
};

export type RecentActivity = { quotations: Quotation[]; invoices: Invoice[]; payments: Payment[] };

export type DocumentOverview = {
  quotations: { status: QuotationStatus; count: number; total: Money }[];
  invoices: { status: InvoiceStatus; count: number; total: Money; outstanding: Money }[];
  expiringSoon: Quotation[];
  overdue: Invoice[];
  templates: { type: DocumentType; count: number }[];
};

/** Payload shared by quotation and invoice create/edit. */
export type DocumentInput = {
  clientId: string;
  projectId?: string | null;
  templateId?: string | null;
  title: string;
  issueDate?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  terms?: string;
};
export type QuotationInput = DocumentInput & { expiryDate: string };
export type InvoiceInput = DocumentInput & { dueDate?: string; reference?: string };
