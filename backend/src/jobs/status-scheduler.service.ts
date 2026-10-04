import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Time-based status changes: SENT quotations past their expiry date become
 * EXPIRED, and unpaid invoices past their due date become OVERDUE. Runs hourly
 * and once at startup.
 */
@Injectable()
export class StatusSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StatusSchedulerService.name);

  onApplicationBootstrap() {
    if (process.env.NODE_ENV !== 'test') void this.sweep();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sweep(now = new Date()) {
    try {
      const [expired, overdue] = await Promise.all([
        this.prisma.quotation.updateMany({
          where: { status: 'SENT', expiryDate: { lt: now } },
          data: { status: 'EXPIRED' },
        }),
        this.prisma.invoice.updateMany({
          where: {
            status: { in: ['SENT', 'PARTIALLY_PAID'] },
            dueDate: { lt: now },
            outstandingAmount: { gt: 0 },
          },
          data: { status: 'OVERDUE' },
        }),
      ]);
      if (expired.count || overdue.count) {
        this.logger.log(
          `Marked ${expired.count} quotation(s) EXPIRED and ${overdue.count} invoice(s) OVERDUE`,
        );
      }
      return { expired: expired.count, overdue: overdue.count };
    } catch (e) {
      this.logger.error(`Status sweep failed: ${(e as Error).message}`);
      return { expired: 0, overdue: 0 };
    }
  }

  constructor(private readonly prisma: PrismaService) {}
}
