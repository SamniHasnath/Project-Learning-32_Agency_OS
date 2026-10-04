import type { DiscountType } from "@/types/models";

/**
 * Live preview of totals while editing a form. Display only — the backend
 * recomputes everything with exact decimal arithmetic on save, and the saved
 * values are what the app shows afterwards. Works in integer cents to avoid
 * float drift in the preview.
 */
export function previewTotals(
  items: { quantity: number; unitPrice: number }[],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
) {
  const cents = (n: number) => Math.round(n * 100);
  const lines = items.map((i) => cents((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)));
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const rawDiscount = discountType === "PERCENTAGE" ? Math.round((subtotal * (discountValue || 0)) / 100) : cents(discountValue || 0);
  const discount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const tax = Math.round(((subtotal - discount) * (taxRate || 0)) / 100);
  return {
    lines: lines.map((c) => c / 100),
    subtotal: subtotal / 100,
    discount: discount / 100,
    tax: tax / 100,
    total: (subtotal - discount + tax) / 100,
    discountExceeds: rawDiscount > subtotal,
  };
}
