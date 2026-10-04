import { ConflictException } from '@nestjs/common';
import { InvoiceStatus, QuotationStatus } from '@prisma/client';

/**
 * Manual status transitions a user may request. Anything not listed is
 * rejected. EXPIRED and OVERDUE are also applied automatically by the
 * scheduler; PARTIALLY_PAID / PAID are only ever set by recording payments.
 */
export const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT', 'VOID'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'VOID'],
  ACCEPTED: ['VOID'],
  REJECTED: [],
  EXPIRED: [],
  VOID: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['SENT', 'VOID'],
  SENT: ['OVERDUE', 'VOID'],
  OVERDUE: ['VOID'],
  PARTIALLY_PAID: [],
  PAID: [],
  VOID: [],
};

export function assertTransition<S extends string>(map: Record<S, S[]>, from: S, to: S, label: string) {
  if (from === to) throw new ConflictException(`${label} is already ${to}`);
  if (!map[from].includes(to)) {
    const allowed = map[from].length ? map[from].join(', ') : 'none';
    throw new ConflictException(`Cannot change ${label.toLowerCase()} from ${from} to ${to} (allowed: ${allowed})`);
  }
}

/** Status an invoice should have after its paid amount changes. */
export function statusAfterPayment(outstandingIsZero: boolean, dueDate: Date, now = new Date()): InvoiceStatus {
  if (outstandingIsZero) return 'PAID';
  return dueDate < now ? 'OVERDUE' : 'PARTIALLY_PAID';
}
