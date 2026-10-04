import { formatDocumentNumber } from './numbering.service';

describe('formatDocumentNumber', () => {
  it.each([
    ['QT', 2026, 1, 'QT-2026-0001'],
    ['QT', 2026, 2, 'QT-2026-0002'],
    ['INV', 2026, 1, 'INV-2026-0001'],
    ['INV', 2026, 42, 'INV-2026-0042'],
    ['PAY', 2027, 12345, 'PAY-2027-12345'],
  ] as const)('%s %d #%d → %s', (prefix, year, value, expected) => {
    expect(formatDocumentNumber(prefix, year, value)).toBe(expected);
  });
});
