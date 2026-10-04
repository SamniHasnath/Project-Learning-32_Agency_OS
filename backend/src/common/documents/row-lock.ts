import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const LABELS = { quotations: 'Quotation', invoices: 'Invoice' } as const;

/**
 * Takes a row-level lock (SELECT … FOR UPDATE) on a tenant-owned document for
 * the rest of the transaction. Concurrent requests touching the same document
 * (double-clicked convert, two payments at once, edit + status change) queue up
 * behind each other instead of reading stale totals or status.
 *
 * Also acts as the tenant check: a row belonging to another agency is reported
 * as not found.
 */
export async function lockDocument(
  tx: Prisma.TransactionClient,
  table: keyof typeof LABELS,
  id: string,
  agencyId: string,
) {
  // `table` comes from the fixed union above, never from user input.
  const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "${table}" WHERE id = $1 AND "agencyId" = $2 FOR UPDATE`,
    id,
    agencyId,
  );
  if (!rows.length) throw new NotFoundException(`${LABELS[table]} not found`);
}
