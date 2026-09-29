import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.quotation.findMany({
      include: {
        client: true,
        project: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        invoices: true,
      },
    });
    if (!quotation) throw new NotFoundException(`Quotation with ID ${id} not found`);
    return quotation;
  }

  async create(dto: any) {
    const { items = [], ...data } = dto;

    const calculatedItems = items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.quantity || 1) * Number(item.unitPrice || 0),
    }));

    const subtotal = calculatedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
    const taxRate = Number(data.taxRate || 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const count = await this.prisma.quotation.count();
    const quoteNumber = data.quoteNumber || `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.quotation.create({
      data: {
        ...data,
        quoteNumber,
        validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        items: {
          create: calculatedItems,
        },
      },
      include: { client: true, items: true },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { items, ...data } = dto;

    if (items) {
      await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    }

    const calculatedItems = items
      ? items.map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          amount: Number(item.quantity || 1) * Number(item.unitPrice || 0),
        }))
      : undefined;

    const updateData: any = { ...data };
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);

    if (calculatedItems) {
      const subtotal = calculatedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
      const taxRate = Number(data.taxRate !== undefined ? data.taxRate : 0);
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
      updateData.items = { create: calculatedItems };
    }

    return this.prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quotation.delete({ where: { id } });
  }

  async convertToInvoice(id: string) {
    const quotation = await this.findOne(id);

    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        title: `Invoice for ${quotation.title}`,
        clientId: quotation.clientId,
        projectId: quotation.projectId,
        quotationId: quotation.id,
        status: 'SENT',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        paidAmount: 0,
        balance: quotation.totalAmount,
        notes: quotation.notes,
        terms: quotation.terms,
        items: {
          create: quotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: { client: true, items: true },
    });

    await this.prisma.quotation.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    return invoice;
  }
}
