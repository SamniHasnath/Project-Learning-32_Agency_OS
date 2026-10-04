import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { lockDocument } from '../common/documents/row-lock';
import { statusAfterPayment } from '../common/documents/status-workflow';
import { NumberingService } from '../common/numbering/numbering.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/payment.dto';

const PAYMENT_INCLUDE = {
  invoice: {
    select: {
      id: true,
      number: true,
      title: true,
      currency: true,
      clientSnapshot: true,
      total: true,
      outstandingAmount: true,
      status: true,
    },
  },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly audit: AuditService,
  ) {}

  findAll(agencyId: string, invoiceId?: string) {
    return this.prisma.payment.findMany({
      where: { agencyId, ...(invoiceId ? { invoiceId } : {}) },
      include: PAYMENT_INCLUDE,
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(agencyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, agencyId },
      include: PAYMENT_INCLUDE,
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Records a (partial or full) payment against an invoice.
   *
   * The invoice row is locked (SELECT … FOR UPDATE) before its outstanding
   * amount is read, so two simultaneous payments cannot both pass the
   * overpayment check. Paid/outstanding are recomputed from stored Decimal
   * values, never taken from the request.
   */
  async create(agencyId: string, userId: string, dto: CreatePaymentDto) {
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0))
      throw new BadRequestException('Payment amount must be greater than 0');

    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'invoices', dto.invoiceId, agencyId);
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: dto.invoiceId },
      });

      if (invoice.status === 'DRAFT')
        throw new ConflictException(
          'Send the invoice before recording payments',
        );
      if (invoice.status === 'VOID')
        throw new ConflictException('Cannot record payments on a VOID invoice');
      if (invoice.status === 'PAID' || invoice.outstandingAmount.lte(0)) {
        throw new ConflictException('This invoice is already fully paid');
      }
      if (amount.gt(invoice.outstandingAmount)) {
        throw new BadRequestException(
          `Payment of ${amount.toFixed(2)} exceeds the outstanding amount of ${invoice.outstandingAmount.toFixed(2)}`,
        );
      }

      const paidAmount = invoice.paidAmount.add(amount);
      const outstandingAmount = invoice.total.sub(paidAmount);
      const status = statusAfterPayment(
        outstandingAmount.isZero(),
        invoice.dueDate,
      );
      const number = await this.numbering.next(tx, agencyId, 'PAY');

      const payment = await tx.payment.create({
        data: {
          agencyId,
          number,
          invoiceId: invoice.id,
          amount,
          method: dto.method ?? 'BANK_TRANSFER',
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          reference: dto.reference?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
        include: PAYMENT_INCLUDE,
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount,
          outstandingAmount,
          status,
          ...(status === 'PAID' ? { paidAt: new Date() } : {}),
        },
      });
      await this.audit.log(tx, {
        agencyId,
        userId,
        action: 'payment.recorded',
        entity: 'Invoice',
        entityId: invoice.id,
        details: { paymentId: payment.id, amount: amount.toFixed(2), status },
      });
      // Re-read so the embedded invoice reflects the new balance.
      return tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: PAYMENT_INCLUDE,
      });
    });
  }
}
