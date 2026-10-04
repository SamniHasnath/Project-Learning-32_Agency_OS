import { BadRequestException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;
type Numeric = string | number | Decimal;

export interface LineItemInput {
  description: string;
  quantity: Numeric;
  unitPrice: Numeric;
}

export interface CalculatedLine {
  position: number;
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  lineTotal: Decimal;
}

export interface CalculatedDocument {
  lines: CalculatedLine[];
  subtotal: Decimal;
  discountType: DiscountType;
  discountValue: Decimal;
  discountAmount: Decimal;
  taxRate: Decimal;
  taxAmount: Decimal;
  total: Decimal;
}

const money = (value: Decimal) => value.toDecimalPlaces(2, D.ROUND_HALF_UP);

/**
 * The single source of truth for document maths. Every create/update on the
 * server runs through this; totals sent by a client are never trusted.
 *
 *   lineTotal = round2(quantity × unitPrice)
 *   subtotal  = Σ lineTotal
 *   discount  = FIXED ? value : round2(subtotal × value / 100)      (≤ subtotal)
 *   tax       = round2((subtotal − discount) × taxRate / 100)
 *   total     = subtotal − discount + tax
 */
export function calculateDocument(
  items: LineItemInput[],
  options: { discountType?: DiscountType; discountValue?: Numeric; taxRate?: Numeric } = {},
): CalculatedDocument {
  if (!items.length) throw new BadRequestException('At least one line item is required');

  const lines = items.map((item, position) => {
    const quantity = new D(item.quantity);
    const unitPrice = new D(item.unitPrice);
    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new BadRequestException(`Line ${position + 1}: quantity must be greater than 0`);
    }
    if (!unitPrice.isFinite() || unitPrice.lt(0)) {
      throw new BadRequestException(`Line ${position + 1}: unit price cannot be negative`);
    }
    return {
      position,
      description: item.description.trim(),
      quantity,
      unitPrice,
      lineTotal: money(quantity.mul(unitPrice)),
    };
  });

  const subtotal = lines.reduce((sum, line) => sum.add(line.lineTotal), new D(0));

  const discountType = options.discountType ?? DiscountType.FIXED;
  const discountValue = new D(options.discountValue ?? 0);
  if (discountValue.lt(0)) throw new BadRequestException('Discount cannot be negative');
  if (discountType === DiscountType.PERCENTAGE && discountValue.gt(100)) {
    throw new BadRequestException('Percentage discount cannot exceed 100%');
  }
  const discountAmount =
    discountType === DiscountType.PERCENTAGE ? money(subtotal.mul(discountValue).div(100)) : money(discountValue);
  if (discountAmount.gt(subtotal)) throw new BadRequestException('Discount cannot exceed the subtotal');

  const taxRate = new D(options.taxRate ?? 0);
  if (taxRate.lt(0) || taxRate.gt(100)) throw new BadRequestException('Tax rate must be between 0 and 100');
  const taxAmount = money(subtotal.sub(discountAmount).mul(taxRate).div(100));

  return {
    lines,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxRate,
    taxAmount,
    total: subtotal.sub(discountAmount).add(taxAmount),
  };
}
