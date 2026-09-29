import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: { client: true },
        },
      },
    });
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async create(dto: any) {
    const { invoiceId, amount, paymentMethod, reference, notes } = dto;

    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const count = await this.prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: numAmount,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        reference,
        notes,
      },
      include: { invoice: { include: { client: true } } },
    });

    const newPaidAmount = invoice.paidAmount + numAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    return payment;
  }
}
