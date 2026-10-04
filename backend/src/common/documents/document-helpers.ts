import { BadRequestException } from '@nestjs/common';
import type { CalculatedDocument } from '../money/document-calculator';

/** Prisma field values for the money columns shared by quotations and invoices. */
export function pricingFields(calc: CalculatedDocument) {
  return {
    subtotal: calc.subtotal,
    discountType: calc.discountType,
    discountValue: calc.discountValue,
    discountAmount: calc.discountAmount,
    taxRate: calc.taxRate,
    taxAmount: calc.taxAmount,
    total: calc.total,
  };
}

export function itemRows(calc: CalculatedDocument) {
  return calc.lines.map(
    ({ position, description, quantity, unitPrice, lineTotal }) => ({
      position,
      description,
      quantity,
      unitPrice,
      lineTotal,
    }),
  );
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Parses an ISO date and ensures `later` is not before `earlier` (by calendar day). */
export function assertDateOrder(earlier: Date, later: Date, message: string) {
  const day = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (Number.isNaN(later.getTime()) || Number.isNaN(earlier.getTime()))
    throw new BadRequestException('Invalid date');
  if (day(later) < day(earlier)) throw new BadRequestException(message);
}

/** End of the given calendar day (UTC), so a document "valid until Oct 10" is valid all of Oct 10. */
export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
