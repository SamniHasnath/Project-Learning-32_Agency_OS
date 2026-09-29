import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private memoryPayments = [
    {
      id: 'pay1',
      paymentNumber: 'PAY-2026-0001',
      invoiceId: 'i1',
      invoice: {
        id: 'i1',
        invoiceNumber: 'INV-2026-0001',
        title: 'Brand Identity Design Milestone 1',
        client: { name: 'Globex Enterprise', email: 'hello@globex.io' },
      },
      amount: 9200,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString(),
      reference: 'WIRE-9938472',
      notes: 'Full payment received',
    },
  ];

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.payment.findMany({
          include: { invoice: { include: { client: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    return this.memoryPayments;
  }

  async findOne(id: string) {
    if (this.prisma.isConnected) {
      try {
        const payment = await this.prisma.payment.findUnique({
          where: { id },
          include: { invoice: { include: { client: true } } },
        });
        if (payment) return payment;
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    const payment = this.memoryPayments.find((p) => p.id === id);
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async create(dto: any) {
    const { invoiceId, amount, paymentMethod, reference, notes } = dto;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (this.prisma.isConnected) {
      try {
        const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const count = await this.prisma.payment.count();
          const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
          const payment = await this.prisma.payment.create({
            data: { paymentNumber, invoiceId, amount: numAmount, paymentMethod: paymentMethod || 'BANK_TRANSFER', reference, notes },
            include: { invoice: { include: { client: true } } },
          });

          const newPaidAmount = invoice.paidAmount + numAmount;
          const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
          const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { paidAmount: newPaidAmount, balance: newBalance, status: newStatus },
          });

          return payment;
        }
      } catch (e) {
        console.warn('DB error, creating payment in memory:', e?.message);
      }
    }

    const count = this.memoryPayments.length;
    const paymentNumber = `PAY-2026-${String(count + 1).padStart(4, '0')}`;
    const newPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber,
      invoiceId: invoiceId || 'i1',
      invoice: {
        id: invoiceId || 'i1',
        invoiceNumber: 'INV-2026-0001',
        title: 'Brand Identity Design Milestone 1',
        client: { name: 'Globex Enterprise', email: 'hello@globex.io' },
      },
      amount: numAmount,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      paymentDate: new Date().toISOString(),
      reference: reference || `REF-${Date.now()}`,
      notes: notes || 'Payment processed',
    };
    this.memoryPayments.unshift(newPayment);
    return newPayment;
  }
}
