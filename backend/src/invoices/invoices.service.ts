import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { addDays, assertDateOrder, endOfDay, itemRows, pricingFields } from '../common/documents/document-helpers';
import { lockDocument } from '../common/documents/row-lock';
import { asJson, SnapshotService } from '../common/documents/snapshot.service';
import { assertTransition, INVOICE_TRANSITIONS } from '../common/documents/status-workflow';
import { calculateDocument } from '../common/money/document-calculator';
import { NumberingService } from '../common/numbering/numbering.service';
import { DocumentTemplatesService } from '../document-templates/document-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, ListInvoicesQuery, UpdateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';

export const INVOICE_DETAIL_INCLUDE = {
  items: { orderBy: { position: 'asc' } },
  payments: { orderBy: { paymentDate: 'desc' } },
  quotation: { select: { id: true, number: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly snapshots: SnapshotService,
    private readonly templates: DocumentTemplatesService,
    private readonly audit: AuditService,
  ) {}

  findAll(agencyId: string, query: ListInvoicesQuery = {}) {
    const search = query.search?.trim();
    return this.prisma.invoice.findMany({
      where: {
        agencyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { reference: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { quotation: { select: { id: true, number: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(agencyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, agencyId }, include: INVOICE_DETAIL_INCLUDE });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /** Direct invoice creation (not from a quotation). */
  async create(agencyId: string, userId: string, dto: CreateInvoiceDto) {
    const calc = calculateDocument(dto.items, dto);
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : addDays(issueDate, 14);
    assertDateOrder(issueDate, dueDate, 'Due date must be on or after the issue date');

    return this.prisma.$transaction(async (tx) => {
      const { snapshot: clientSnapshot } = await this.snapshots.loadClient(tx, agencyId, dto.clientId);
      await this.snapshots.assertProject(tx, agencyId, dto.clientId, dto.projectId);
      const { snapshot: agencySnapshot } = await this.snapshots.loadAgency(tx, agencyId);
      const template = await this.templates.resolve(tx, agencyId, 'INVOICE', dto.templateId);
      const number = await this.numbering.next(tx, agencyId, 'INV');

      const invoice = await tx.invoice.create({
        data: {
          agencyId,
          number,
          title: dto.title.trim(),
          reference: dto.reference?.trim() || null,
          clientId: dto.clientId,
          projectId: dto.projectId ?? null,
          templateId: template.templateId,
          issueDate,
          dueDate: endOfDay(dueDate),
          clientSnapshot: asJson(clientSnapshot),
          agencySnapshot: asJson(agencySnapshot),
          templateSnapshot: asJson(template.snapshot),
          currency: agencySnapshot.currency,
          notes: dto.notes?.trim() || null,
          terms: dto.terms?.trim() || null,
          ...pricingFields(calc),
          paidAmount: 0,
          outstandingAmount: calc.total,
          items: { create: itemRows(calc) },
        },
        include: INVOICE_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, { agencyId, userId, action: 'invoice.created', entity: 'Invoice', entityId: invoice.id, details: { number } });
      return invoice;
    });
  }

  async update(agencyId: string, userId: string, id: string, dto: UpdateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'invoices', id, agencyId);
      const existing = await tx.invoice.findUniqueOrThrow({ where: { id }, include: { items: { orderBy: { position: 'asc' } } } });
      if (existing.status !== 'DRAFT') throw new ConflictException('Only DRAFT invoices can be edited');

      const calc = calculateDocument(dto.items ?? existing.items, {
        discountType: dto.discountType ?? existing.discountType,
        discountValue: dto.discountValue ?? existing.discountValue,
        taxRate: dto.taxRate ?? existing.taxRate,
      });
      const issueDate = dto.issueDate ? new Date(dto.issueDate) : existing.issueDate;
      const dueDate = dto.dueDate ? endOfDay(new Date(dto.dueDate)) : existing.dueDate;
      assertDateOrder(issueDate, dueDate, 'Due date must be on or after the issue date');

      const clientId = dto.clientId ?? existing.clientId;
      const projectId = dto.projectId !== undefined ? dto.projectId : existing.projectId;
      const { snapshot: clientSnapshot } = await this.snapshots.loadClient(tx, agencyId, clientId);
      await this.snapshots.assertProject(tx, agencyId, clientId, projectId);
      const { snapshot: agencySnapshot } = await this.snapshots.loadAgency(tx, agencyId);
      const template = await this.templates.resolve(
        tx,
        agencyId,
        'INVOICE',
        dto.templateId !== undefined ? dto.templateId : existing.templateId,
      );

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          title: dto.title?.trim() ?? existing.title,
          reference: dto.reference !== undefined ? dto.reference.trim() || null : existing.reference,
          clientId,
          projectId: projectId ?? null,
          templateId: template.templateId,
          issueDate,
          dueDate,
          clientSnapshot: asJson(clientSnapshot),
          agencySnapshot: asJson(agencySnapshot),
          templateSnapshot: asJson(template.snapshot),
          currency: agencySnapshot.currency,
          notes: dto.notes !== undefined ? dto.notes.trim() || null : existing.notes,
          terms: dto.terms !== undefined ? dto.terms.trim() || null : existing.terms,
          ...pricingFields(calc),
          // A DRAFT invoice can't have payments, so outstanding is simply the total.
          outstandingAmount: calc.total,
          items: { create: itemRows(calc) },
        },
        include: INVOICE_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, { agencyId, userId, action: 'invoice.updated', entity: 'Invoice', entityId: id });
      return invoice;
    });
  }

  async changeStatus(agencyId: string, userId: string, id: string, dto: UpdateInvoiceStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'invoices', id, agencyId);
      const existing = await tx.invoice.findUniqueOrThrow({ where: { id } });
      assertTransition(INVOICE_TRANSITIONS, existing.status, dto.status, 'Invoice');

      if (dto.status === 'VOID' && existing.paidAmount.gt(0)) {
        throw new ConflictException('Invoices with recorded payments cannot be voided');
      }
      if (dto.status === 'OVERDUE' && existing.dueDate >= new Date()) {
        throw new ConflictException('Invoice is not past its due date yet');
      }

      const invoice = await tx.invoice.update({
        where: { id },
        data: { status: dto.status, ...(dto.status === 'SENT' ? { sentAt: new Date() } : {}) },
        include: INVOICE_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, {
        agencyId,
        userId,
        action: 'invoice.status_changed',
        entity: 'Invoice',
        entityId: id,
        details: { from: existing.status, to: dto.status },
      });
      return invoice;
    });
  }
}
