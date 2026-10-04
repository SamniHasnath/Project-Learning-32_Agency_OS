import { ConflictException } from '@nestjs/common';
import {
  assertTransition,
  INVOICE_TRANSITIONS,
  QUOTATION_TRANSITIONS,
  statusAfterPayment,
} from './status-workflow';

describe('quotation status workflow', () => {
  it.each([
    ['DRAFT', 'SENT'],
    ['DRAFT', 'VOID'],
    ['SENT', 'ACCEPTED'],
    ['SENT', 'REJECTED'],
    ['SENT', 'EXPIRED'],
    ['SENT', 'VOID'],
    ['ACCEPTED', 'VOID'],
  ] as const)('allows %s → %s', (from, to) => {
    expect(() =>
      assertTransition(QUOTATION_TRANSITIONS, from, to, 'Quotation'),
    ).not.toThrow();
  });

  it.each([
    ['DRAFT', 'ACCEPTED'],
    ['DRAFT', 'REJECTED'],
    ['ACCEPTED', 'DRAFT'],
    ['REJECTED', 'ACCEPTED'],
    ['EXPIRED', 'ACCEPTED'],
    ['VOID', 'DRAFT'],
    ['SENT', 'SENT'],
  ] as const)('rejects %s → %s', (from, to) => {
    expect(() =>
      assertTransition(QUOTATION_TRANSITIONS, from, to, 'Quotation'),
    ).toThrow(ConflictException);
  });
});

describe('invoice status workflow', () => {
  it('only allows payment-driven statuses to be set by payments', () => {
    for (const from of Object.keys(
      INVOICE_TRANSITIONS,
    ) as (keyof typeof INVOICE_TRANSITIONS)[]) {
      expect(INVOICE_TRANSITIONS[from]).not.toContain('PAID');
      expect(INVOICE_TRANSITIONS[from]).not.toContain('PARTIALLY_PAID');
    }
  });

  it('treats PAID and VOID as terminal', () => {
    expect(INVOICE_TRANSITIONS.PAID).toEqual([]);
    expect(INVOICE_TRANSITIONS.VOID).toEqual([]);
  });

  it('derives status after a payment', () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    expect(statusAfterPayment(true, past)).toBe('PAID');
    expect(statusAfterPayment(false, future)).toBe('PARTIALLY_PAID');
    expect(statusAfterPayment(false, past)).toBe('OVERDUE');
  });
});
