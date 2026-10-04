import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NumberingService } from '../common/numbering/numbering.service';
import { AuditService } from '../common/audit/audit.service';
import { SnapshotService } from '../common/documents/snapshot.service';

/** Global infrastructure shared by every feature module. */
@Global()
@Module({
  providers: [PrismaService, NumberingService, AuditService, SnapshotService],
  exports: [PrismaService, NumberingService, AuditService, SnapshotService],
})
export class PrismaModule {}
