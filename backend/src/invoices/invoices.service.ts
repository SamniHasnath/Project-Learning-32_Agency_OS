import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  private memoryInvoices = [
    {
      id: 'i1',
      invoiceNumber: 'INV-2026-0001',
      title: 'Brand Identity Design Milestone 1',
      clientId: 'c2',
      client: { id: 'c2', name: 'Globex Enterprise', email: 'hello@globex.io' },
      status: 'PAID',
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 9200,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 9200,
      paidAmount: 9200,
      balance: 0,
      notes: 'Paid via Bank Wire',
      items: [
        { id: 'ii1', description: 'Brand Strategy & UI Token Guidelines', quantity: 1, unitPrice: 4200, amount: 4200 },
        { id: 'ii2', description: 'Component Library & Figma Design Tokens', quantity: 1, unitPrice: 5000, amount: 5000 },
      ],
      payments: [
        { id: 'pay1', paymentNumber: 'PAY-2026-0001', amount: 9200, paymentMethod: 'BANK_TRANSFER', reference: 'WIRE-9938472', paymentDate: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'i2',
      invoiceNumber: 'INV-2026-0002',
      title: 'E-Commerce Initial Deposit (50%)',
      clientId: 'c1',
      client: { id: 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      status: 'SENT',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 8250,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 8250,
      paidAmount: 0,
      balance: 8250,
      items: [
        { id: 'ii3', description: 'Milestone 1 - E-Commerce Sprint 1 Deposit', quantity: 1, unitPrice: 8250, amount: 8250 },
      ],
      payments: [],
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.invoice.findMany({
          include: { client: true, project: true, items: true, payments: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    return this.memoryInvoices;
  }

  async findOne(id: string) {
    if (this.prisma.isConnected) {
      try {
        const invoice = await this.prisma.invoice.findUnique({
          where: { id },
          include: { client: true, project: true, items: true, payments: true },
        });
        if (invoice) return invoice;
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    const invoice = this.memoryInvoices.find((inv) => inv.id === id);
    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return invoice;
  }

  async create(dto: any) {
    const { items = [], ...data } = dto;
    const calculatedItems = items.map((item: any, i: number) => ({
      id: `ii-${Date.now()}-${i}`,
      description: item.description || 'Line item',
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

    if (this.prisma.isConnected) {
      try {
        const count = await this.prisma.invoice.count();
        const invoiceNumber = data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        return await this.prisma.invoice.create({
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
            items: { create: calculatedItems.map(({ id, ...rest }: any) => rest) },
          },
          include: { client: true, items: true, payments: true },
        });
      } catch (e) {
        console.warn('DB error, creating invoice in memory:', e?.message);
      }
    }

    const count = this.memoryInvoices.length;
    const invoiceNumber = data.invoiceNumber || `INV-2026-${String(count + 1).padStart(4, '0')}`;
    const newInvoice = {
      id: `i-${Date.now()}`,
      invoiceNumber,
      title: data.title || 'New Invoice',
      clientId: data.clientId || 'c1',
      client: { id: 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      status: data.status || 'DRAFT',
      issueDate: data.issueDate || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount,
      balance,
      notes: data.notes,
      terms: data.terms,
      items: calculatedItems,
      payments: [],
      createdAt: new Date().toISOString(),
    };
    this.memoryInvoices.unshift(newInvoice);
    return newInvoice;
  }

  async update(id: string, dto: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.invoice.update({ where: { id }, data: dto, include: { client: true, items: true, payments: true } });
      } catch (e) {
        console.warn('DB error, updating invoice in memory:', e?.message);
      }
    }
    const index = this.memoryInvoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new NotFoundException(`Invoice with ID ${id} not found`);
    this.memoryInvoices[index] = { ...this.memoryInvoices[index], ...dto };
    return this.memoryInvoices[index];
  }

  async remove(id: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.invoice.delete({ where: { id } });
      } catch (e) {
        console.warn('DB error, deleting from memory:', e?.message);
      }
    }
    this.memoryInvoices = this.memoryInvoices.filter((inv) => inv.id !== id);
    return { success: true };
  }
}
