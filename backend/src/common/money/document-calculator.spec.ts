import { BadRequestException } from '@nestjs/common';
import { calculateDocument } from './document-calculator';

const str = (d: { toFixed: (n: number) => string }) => d.toFixed(2);

describe('calculateDocument', () => {
  it('computes lineTotal = quantity × unitPrice for each line', () => {
    const r = calculateDocument([
      { description: 'Design', quantity: 3, unitPrice: 150 },
      { description: 'Dev', quantity: 2.5, unitPrice: 80 },
    ]);
    expect(r.lines.map((l) => str(l.lineTotal))).toEqual(['450.00', '200.00']);
    expect(str(r.subtotal)).toBe('650.00');
  });

  it('total = subtotal − discount + tax, with tax applied after discount', () => {
    const r = calculateDocument([{ description: 'A', quantity: 1, unitPrice: 1000 }], {
      discountType: 'FIXED',
      discountValue: 100,
      taxRate: 10,
    });
    expect(str(r.subtotal)).toBe('1000.00');
    expect(str(r.discountAmount)).toBe('100.00');
    expect(str(r.taxAmount)).toBe('90.00'); // 10% of 900
    expect(str(r.total)).toBe('990.00');
  });

  it('supports percentage discounts', () => {
    const r = calculateDocument([{ description: 'A', quantity: 1, unitPrice: 17640 }], {
      discountType: 'PERCENTAGE',
      discountValue: 5,
      taxRate: 8.5,
    });
    expect(str(r.discountAmount)).toBe('882.00');
    expect(str(r.taxAmount)).toBe('1424.43');
    expect(str(r.total)).toBe('18182.43');
  });

  it('uses exact decimal arithmetic (no floating point drift)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 with JS numbers
    const r = calculateDocument([
      { description: 'A', quantity: 1, unitPrice: 0.1 },
      { description: 'B', quantity: 1, unitPrice: 0.2 },
    ]);
    expect(r.subtotal.toString()).toBe('0.3');
    const thirds = calculateDocument([{ description: 'C', quantity: 3, unitPrice: 33.33 }], { taxRate: 7.25 });
    expect(str(thirds.subtotal)).toBe('99.99');
    expect(str(thirds.taxAmount)).toBe('7.25'); // 7.249275 → 7.25 (half-up)
    expect(str(thirds.total)).toBe('107.24');
  });

  it('rounds each line total to cents half-up', () => {
    const r = calculateDocument([{ description: 'A', quantity: 0.333, unitPrice: 10.05 }]);
    expect(str(r.lines[0].lineTotal)).toBe('3.35'); // 3.34665
  });

  it('accepts string and Decimal-like inputs identically', () => {
    const a = calculateDocument([{ description: 'A', quantity: '2', unitPrice: '19.99' }], { taxRate: '20' });
    const b = calculateDocument([{ description: 'A', quantity: 2, unitPrice: 19.99 }], { taxRate: 20 });
    expect(str(a.total)).toBe(str(b.total));
  });

  it.each([
    [[], {}, 'At least one line item'],
    [[{ description: 'A', quantity: 0, unitPrice: 10 }], {}, 'quantity must be greater than 0'],
    [[{ description: 'A', quantity: 1, unitPrice: -1 }], {}, 'unit price cannot be negative'],
    [[{ description: 'A', quantity: 1, unitPrice: 100 }], { discountValue: 101 }, 'Discount cannot exceed the subtotal'],
    [[{ description: 'A', quantity: 1, unitPrice: 100 }], { discountValue: -5 }, 'Discount cannot be negative'],
    [[{ description: 'A', quantity: 1, unitPrice: 100 }], { discountType: 'PERCENTAGE', discountValue: 150 }, 'cannot exceed 100%'],
    [[{ description: 'A', quantity: 1, unitPrice: 100 }], { taxRate: 120 }, 'Tax rate must be between 0 and 100'],
  ] as const)('rejects invalid input %#', (items, opts, message) => {
    expect(() => calculateDocument([...items], opts as never)).toThrow(BadRequestException);
    expect(() => calculateDocument([...items], opts as never)).toThrow(message);
  });

  it('allows a 100% discount producing a zero total', () => {
    const r = calculateDocument([{ description: 'A', quantity: 1, unitPrice: 100 }], { discountType: 'PERCENTAGE', discountValue: 100, taxRate: 10 });
    expect(str(r.total)).toBe('0.00');
  });
});
