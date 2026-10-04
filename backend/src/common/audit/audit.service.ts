import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  /** Writes an audit entry inside the caller's transaction. */
  log(
    tx: Prisma.TransactionClient,
    entry: { agencyId: string; userId?: string; action: string; entity: string; entityId?: string; details?: Prisma.InputJsonValue },
  ) {
    return tx.auditLog.create({ data: entry });
  }
}
