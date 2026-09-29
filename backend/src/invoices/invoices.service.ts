import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.invoice.findMany({
      include: {
        client: true,
        project: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return invoice;
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
    const paidAmount = Number(data.paidAmount || 0);
    const balance = totalAmount - paidAmount;

    const count = await this.prisma.invoice.count();
    const invoiceNumber = data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount,
        balance,
        items: {
          create: calculatedItems,
        },
      },
      include: { client: true, items: true, payments: true },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { items, ...data } = dto;

    if (items) {
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
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
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    if (calculatedItems) {
      const subtotal = calculatedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
      const taxRate = Number(data.taxRate !== undefined ? data.taxRate : 0);
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const currentInvoice = await this.prisma.invoice.findUnique({ where: { id } });
      const paidAmount = currentInvoice?.paidAmount || 0;

      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
      updateData.balance = totalAmount - paidAmount;
      updateData.items = { create: calculatedItems };
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true, payments: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
