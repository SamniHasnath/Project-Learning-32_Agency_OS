import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const OPEN_INVOICE = ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] as const;
const zero = () => new Prisma.Decimal(0);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(agencyId: string) {
    const since = new Date();
    since.setUTCDate(1);
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCMonth(since.getUTCMonth() - 11);

    const [
      revenue,
      outstanding,
      overdue,
      openQuotes,
      totalClients,
      activeProjects,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { agencyId },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { agencyId, status: { in: [...OPEN_INVOICE] } },
        _sum: { outstandingAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { agencyId, status: 'OVERDUE' },
        _sum: { outstandingAmount: true },
        _count: true,
      }),
      this.prisma.quotation.aggregate({
        where: { agencyId, status: { in: ['DRAFT', 'SENT'] } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.client.count({ where: { agencyId } }),
      this.prisma.project.count({
        where: { agencyId, status: { in: ['PLANNING', 'IN_PROGRESS'] } },
      }),
      this.prisma.payment.findMany({
        where: { agencyId, paymentDate: { gte: since } },
        select: { amount: true, paymentDate: true },
      }),
    ]);

    const months: { month: string; amount: Prisma.Decimal }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(since);
      d.setUTCMonth(since.getUTCMonth() + i);
      months.push({ month: d.toISOString().slice(0, 7), amount: zero() });
    }
    for (const p of recentPayments) {
      const bucket = months.find(
        (m) => m.month === p.paymentDate.toISOString().slice(0, 7),
      );
      if (bucket) bucket.amount = bucket.amount.add(p.amount);
    }

    return {
      totalRevenue: revenue._sum.amount ?? zero(),
      outstandingAmount: outstanding._sum.outstandingAmount ?? zero(),
      openInvoices: outstanding._count,
      overdueAmount: overdue._sum.outstandingAmount ?? zero(),
      overdueInvoices: overdue._count,
      openQuotationsValue: openQuotes._sum.total ?? zero(),
      openQuotations: openQuotes._count,
      totalClients,
      activeProjects,
      revenueByMonth: months,
    };
  }

  async getRecentActivity(agencyId: string) {
    const [quotations, invoices, payments] = await Promise.all([
      this.prisma.quotation.findMany({
        where: { agencyId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: { agencyId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.payment.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              clientSnapshot: true,
              currency: true,
            },
          },
        },
      }),
    ]);
    return { quotations, invoices, payments };
  }

  /** Data for the Document Overview screen. */
  async getDocumentOverview(agencyId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [quotationGroups, invoiceGroups, expiringSoon, overdue, templates] =
      await Promise.all([
        this.prisma.quotation.groupBy({
          by: ['status'],
          where: { agencyId },
          _count: true,
          _sum: { total: true },
        }),
        this.prisma.invoice.groupBy({
          by: ['status'],
          where: { agencyId },
          _count: true,
          _sum: { total: true, outstandingAmount: true },
        }),
        this.prisma.quotation.findMany({
          where: {
            agencyId,
            status: 'SENT',
            expiryDate: { gte: now, lte: soon },
          },
          orderBy: { expiryDate: 'asc' },
          take: 10,
        }),
        this.prisma.invoice.findMany({
          where: { agencyId, status: 'OVERDUE' },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
        this.prisma.documentTemplate.groupBy({
          by: ['type'],
          where: { agencyId },
          _count: true,
        }),
      ]);
    return {
      quotations: quotationGroups.map((g) => ({
        status: g.status,
        count: g._count,
        total: g._sum.total ?? zero(),
      })),
      invoices: invoiceGroups.map((g) => ({
        status: g.status,
        count: g._count,
        total: g._sum.total ?? zero(),
        outstanding: g._sum.outstandingAmount ?? zero(),
      })),
      expiringSoon,
      overdue,
      templates: templates.map((t) => ({ type: t.type, count: t._count })),
    };
  }
}
