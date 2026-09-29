import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { ProjectsService } from '../projects/projects.service';
import { InvoicesService } from '../invoices/invoices.service';
import { QuotationsService } from '../quotations/quotations.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private invoicesService: InvoicesService,
    private quotationsService: QuotationsService,
    private paymentsService: PaymentsService,
  ) {}

  async getMetrics() {
    if (this.prisma.isConnected) {
      try {
        const clientsCount = await this.prisma.client.count();
        const projectsCount = await this.prisma.project.count({
          where: { OR: [{ status: 'IN_PROGRESS' }, { status: 'PLANNING' }] },
        });
        const invoices = await this.prisma.invoice.findMany();
        const totalRevenue = invoices
          .filter((inv) => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID')
          .reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);

        const pendingInvoices = invoices.filter((inv) => inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE');
        const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);
        const activeQuotations = await this.prisma.quotation.count({
          where: { OR: [{ status: 'SENT' }, { status: 'DRAFT' }] },
        });

        return {
          totalRevenue,
          pendingAmount,
          activeProjects: projectsCount,
          totalClients: clientsCount,
          activeQuotations,
        };
      } catch (e) {
        console.warn('DB error in Dashboard metrics, using memory fallback:', e?.message);
      }
    }

    try {
      const clients = await this.clientsService.findAll();
      const projects = await this.projectsService.findAll();
      const invoices = await this.invoicesService.findAll();
      const quotations = await this.quotationsService.findAll();

      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID')
        .reduce((acc: number, inv: any) => acc + Number(inv.paidAmount || 0), 0);

      const pendingInvoices = invoices.filter(
        (inv: any) => inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE',
      );
      const pendingAmount = pendingInvoices.reduce((acc: number, inv: any) => acc + Number(inv.balance || 0), 0);

      const activeProjects = projects.filter(
        (p: any) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING',
      ).length;

      const activeQuotations = quotations.filter(
        (q: any) => q.status === 'SENT' || q.status === 'DRAFT',
      ).length;

      return {
        totalRevenue,
        pendingAmount,
        activeProjects,
        totalClients: clients.length,
        activeQuotations,
      };
    } catch (err) {
      console.error('Error fetching live fallback metrics:', err);
      return {
        totalRevenue: 0,
        pendingAmount: 0,
        activeProjects: 0,
        totalClients: 0,
        activeQuotations: 0,
      };
    }
  }

  async getRecentActivity() {
    if (this.prisma.isConnected) {
      try {
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
      } catch (e) {
        console.warn('DB error in Dashboard recent activity, using memory fallback:', e?.message);
      }
    }

    try {
      const invoices = await this.invoicesService.findAll();
      const quotations = await this.quotationsService.findAll();
      const payments = await this.paymentsService.findAll();

      return {
        invoices: invoices.slice(0, 5),
        quotations: quotations.slice(0, 5),
        payments: payments.slice(0, 5),
      };
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      return {
        invoices: [],
        quotations: [],
        payments: [],
      };
    }
  }
}
