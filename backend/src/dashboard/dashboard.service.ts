import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const clientsCount = await this.prisma.client.count();
    const projectsCount = await this.prisma.project.count({ where: { status: 'IN_PROGRESS' } });
    
    const invoices = await this.prisma.invoice.findMany();
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID')
      .reduce((acc, inv) => acc + inv.paidAmount, 0);

    const pendingInvoices = invoices.filter((inv) => inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE');
    const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + inv.balance, 0);

    const activeQuotations = await this.prisma.quotation.count({ where: { status: 'SENT' } });

    return {
      totalRevenue,
      pendingAmount,
      activeProjects: projectsCount,
      totalClients: clientsCount,
      activeQuotations,
    };
  }

  async getRecentActivity() {
    const recentInvoices = await this.prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });

    const recentQuotations = await this.prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });

    const recentPayments = await this.prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { invoice: { include: { client: true } } },
    });

    return {
      invoices: recentInvoices,
      quotations: recentQuotations,
      payments: recentPayments,
    };
  }
}
