import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type DocumentPrefix = 'QT' | 'INV' | 'PAY';

export function formatDocumentNumber(
  prefix: DocumentPrefix,
  year: number,
  value: number,
) {
  return `${prefix}-${year}-${String(value).padStart(4, '0')}`;
}

/**
 * Issues sequential, agency-scoped document numbers (QT-2026-0001, …).
 *
 * The increment is one atomic INSERT … ON CONFLICT DO UPDATE … RETURNING, so
 * concurrent requests serialise on the sequence row and can never receive the
 * same value. Always call inside the transaction that creates the document so
 * a rollback also rolls the counter back (no gaps from failed creates).
 */
@Injectable()
export class NumberingService {
  async next(
    tx: Prisma.TransactionClient,
    agencyId: string,
    prefix: DocumentPrefix,
    date = new Date(),
  ) {
    const year = date.getUTCFullYear();
    const rows = await tx.$queryRaw<{ last_value: number }[]>`
      INSERT INTO document_sequences (agency_id, type, year, last_value)
      VALUES (${agencyId}, ${prefix}, ${year}, 1)
      ON CONFLICT (agency_id, type, year)
      DO UPDATE SET last_value = document_sequences.last_value + 1
      RETURNING last_value`;
    return formatDocumentNumber(prefix, year, Number(rows[0].last_value));
  }
}
