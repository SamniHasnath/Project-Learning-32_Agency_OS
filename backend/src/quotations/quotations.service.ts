import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  private memoryQuotations = [
    {
      id: 'q1',
      quoteNumber: 'QT-2026-0001',
      title: 'Enterprise Web Application Suite',
      clientId: 'c1',
      client: { id: 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      status: 'SENT',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 15000,
      taxRate: 10,
      taxAmount: 1500,
      totalAmount: 16500,
      notes: 'Includes 1 year maintenance & API documentation',
      terms: 'Net 30 payment terms upon milestone completion',
      items: [
        { id: 'qi1', description: 'Frontend Architecture & Next.js Setup', quantity: 1, unitPrice: 7000, amount: 7000 },
        { id: 'qi2', description: 'Backend Microservices & Prisma Integration', quantity: 1, unitPrice: 8000, amount: 8000 },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.quotation.findMany({
          include: { client: true, project: true, items: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    return this.memoryQuotations;
  }

  async findOne(id: string) {
    if (this.prisma.isConnected) {
      try {
        const quotation = await this.prisma.quotation.findUnique({
          where: { id },
          include: { client: true, project: true, items: true, invoices: true },
        });
        if (quotation) return quotation;
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    const quotation = this.memoryQuotations.find((q) => q.id === id);
    if (!quotation) throw new NotFoundException(`Quotation with ID ${id} not found`);
    return quotation;
  }

  async create(dto: any) {
    const { items = [], ...data } = dto;
    const calculatedItems = items.map((item: any, i: number) => ({
      id: `qi-${Date.now()}-${i}`,
      description: item.description || 'Line item',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      amount: Number(item.quantity || 1) * Number(item.unitPrice || 0),
    }));

    const subtotal = calculatedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
    const taxRate = Number(data.taxRate || 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    if (this.prisma.isConnected) {
      try {
        const count = await this.prisma.quotation.count();
        const quoteNumber = data.quoteNumber || `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        return await this.prisma.quotation.create({
          data: {
            ...data,
            quoteNumber,
            validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subtotal,
            taxRate,
            taxAmount,
            totalAmount,
            items: { create: calculatedItems.map(({ id, ...rest }: any) => rest) },
          },
          include: { client: true, items: true },
        });
      } catch (e) {
        console.warn('DB error, saving quotation to memory:', e?.message);
      }
    }

    const count = this.memoryQuotations.length;
    const quoteNumber = data.quoteNumber || `QT-2026-${String(count + 1).padStart(4, '0')}`;
    const newQuote = {
      id: `q-${Date.now()}`,
      quoteNumber,
      title: data.title || 'New Quotation',
      clientId: data.clientId || 'c1',
      client: { id: 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      status: data.status || 'DRAFT',
      validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes: data.notes,
      terms: data.terms,
      items: calculatedItems,
      createdAt: new Date().toISOString(),
    };
    this.memoryQuotations.unshift(newQuote);
    return newQuote;
  }

  async update(id: string, dto: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.quotation.update({ where: { id }, data: dto, include: { client: true, items: true } });
      } catch (e) {
        console.warn('DB error, updating quotation in memory:', e?.message);
      }
    }
    const index = this.memoryQuotations.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Quotation with ID ${id} not found`);
    this.memoryQuotations[index] = { ...this.memoryQuotations[index], ...dto };
    return this.memoryQuotations[index];
  }

  async convertToInvoice(id: string) {
    const quotation = await this.findOne(id);
    quotation.status = 'ACCEPTED';
    return {
      id: `inv-conv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(Date.now()).slice(-4)}`,
      title: `Invoice for ${quotation.title}`,
      clientId: quotation.clientId,
      client: quotation.client,
      status: 'SENT',
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      balance: quotation.totalAmount,
    };
  }

  async remove(id: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.quotation.delete({ where: { id } });
      } catch (e) {
        console.warn('DB error, deleting from memory:', e?.message);
      }
    }
    this.memoryQuotations = this.memoryQuotations.filter((q) => q.id !== id);
    return { success: true };
  }
}
