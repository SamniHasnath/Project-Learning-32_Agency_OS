import type { InvoiceStatus, QuotationStatus } from "@/types/models";

export const QUOTATION_STATUSES: QuotationStatus[] = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "VOID"];
export const INVOICE_STATUSES: InvoiceStatus[] = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"];

type Action<S> = { to: S; label: string; variant: "primary" | "secondary" | "danger"; confirm?: string };

/** Buttons shown on the quotation detail page. Mirrors the server's allowed transitions. */
export function quotationActions(status: QuotationStatus, converted: boolean): Action<QuotationStatus>[] {
  switch (status) {
    case "DRAFT":
      return [
        { to: "SENT", label: "Mark as sent", variant: "primary" },
        { to: "VOID", label: "Void quotation", variant: "danger", confirm: "Void this quotation? This cannot be undone." },
      ];
    case "SENT":
      return [
        { to: "ACCEPTED", label: "Mark as accepted", variant: "primary" },
        { to: "REJECTED", label: "Mark as rejected", variant: "secondary" },
        { to: "EXPIRED", label: "Mark as expired", variant: "secondary" },
        { to: "VOID", label: "Void quotation", variant: "danger", confirm: "Void this quotation? This cannot be undone." },
      ];
    case "ACCEPTED":
      return converted ? [] : [{ to: "VOID", label: "Void quotation", variant: "danger", confirm: "Void this accepted quotation?" }];
    default:
      return [];
  }
}

export function invoiceActions(status: InvoiceStatus, hasPayments: boolean): Action<InvoiceStatus>[] {
  const voidAction: Action<InvoiceStatus> = { to: "VOID", label: "Void invoice", variant: "danger", confirm: "Void this invoice? This cannot be undone." };
  switch (status) {
    case "DRAFT":
      return [{ to: "SENT", label: "Mark as sent", variant: "primary" }, voidAction];
    case "SENT":
    case "OVERDUE":
      return hasPayments ? [] : [voidAction];
    default:
      return [];
  }
}

export const PAYMENT_METHODS = [
  ["BANK_TRANSFER", "Bank transfer"],
  ["CREDIT_CARD", "Credit card"],
  ["CASH", "Cash"],
  ["CHECK", "Check"],
  ["STRIPE", "Stripe"],
  ["PAYPAL", "PayPal"],
  ["OTHER", "Other"],
] as const;
