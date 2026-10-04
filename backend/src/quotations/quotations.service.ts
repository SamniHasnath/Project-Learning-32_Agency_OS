import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import {
  addDays,
  assertDateOrder,
  endOfDay,
  itemRows,
  pricingFields,
} from '../common/documents/document-helpers';
import { lockDocument } from '../common/documents/row-lock';
import { asJson, SnapshotService } from '../common/documents/snapshot.service';
import {
  assertTransition,
  QUOTATION_TRANSITIONS,
} from '../common/documents/status-workflow';
import { calculateDocument } from '../common/money/document-calculator';
import { NumberingService } from '../common/numbering/numbering.service';
import { DocumentTemplatesService } from '../document-templates/document-templates.service';
import { INVOICE_DETAIL_INCLUDE } from '../invoices/invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConvertQuotationDto,
  CreateQuotationDto,
  ListQuotationsQuery,
  UpdateQuotationDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';

export const QUOTATION_DETAIL_INCLUDE = {
  items: { orderBy: { position: 'asc' } },
  invoice: { select: { id: true, number: true, status: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.QuotationInclude;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly snapshots: SnapshotService,
    private readonly templates: DocumentTemplatesService,
    private readonly audit: AuditService,
  ) {}

  findAll(agencyId: string, query: ListQuotationsQuery = {}) {
    const search = query.search?.trim();
    return this.prisma.quotation.findMany({
      where: {
        agencyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { invoice: { select: { id: true, number: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(agencyId: string, id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, agencyId },
      include: QUOTATION_DETAIL_INCLUDE,
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async create(agencyId: string, userId: string, dto: CreateQuotationDto) {
    const calc = calculateDocument(dto.items, dto);
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const expiryDate = new Date(dto.expiryDate);
    assertDateOrder(
      issueDate,
      expiryDate,
      'Expiry date must be on or after the issue date',
    );

    return this.prisma.$transaction(async (tx) => {
      const { snapshot: clientSnapshot } = await this.snapshots.loadClient(
        tx,
        agencyId,
        dto.clientId,
      );
      await this.snapshots.assertProject(
        tx,
        agencyId,
        dto.clientId,
        dto.projectId,
      );
      const { snapshot: agencySnapshot } = await this.snapshots.loadAgency(
        tx,
        agencyId,
      );
      const template = await this.templates.resolve(
        tx,
        agencyId,
        'QUOTATION',
        dto.templateId,
      );
      const number = await this.numbering.next(tx, agencyId, 'QT');

      const quotation = await tx.quotation.create({
        data: {
          agencyId,
          number,
          title: dto.title.trim(),
          clientId: dto.clientId,
          projectId: dto.projectId ?? null,
          templateId: template.templateId,
          issueDate,
          expiryDate: endOfDay(expiryDate),
          clientSnapshot: asJson(clientSnapshot),
          agencySnapshot: asJson(agencySnapshot),
          templateSnapshot: asJson(template.snapshot),
          currency: agencySnapshot.currency,
          notes: dto.notes?.trim() || null,
          terms: dto.terms?.trim() || null,
          ...pricingFields(calc),
          items: { create: itemRows(calc) },
        },
        include: QUOTATION_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, {
        agencyId,
        userId,
        action: 'quotation.created',
        entity: 'Quotation',
        entityId: quotation.id,
        details: { number },
      });
      return quotation;
    });
  }

  /**
   * Edits a DRAFT quotation. Totals are always recomputed server-side, and the
   * client/agency/template snapshots are refreshed (they freeze once SENT).
   */
  async update(
    agencyId: string,
    userId: string,
    id: string,
    dto: UpdateQuotationDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'quotations', id, agencyId);
      const existing = await tx.quotation.findUniqueOrThrow({
        where: { id },
        include: { items: { orderBy: { position: 'asc' } } },
      });
      if (existing.status !== 'DRAFT')
        throw new ConflictException('Only DRAFT quotations can be edited');

      const calc = calculateDocument(dto.items ?? existing.items, {
        discountType: dto.discountType ?? existing.discountType,
        discountValue: dto.discountValue ?? existing.discountValue,
        taxRate: dto.taxRate ?? existing.taxRate,
      });
      const issueDate = dto.issueDate
        ? new Date(dto.issueDate)
        : existing.issueDate;
      const expiryDate = dto.expiryDate
        ? endOfDay(new Date(dto.expiryDate))
        : existing.expiryDate;
      assertDateOrder(
        issueDate,
        expiryDate,
        'Expiry date must be on or after the issue date',
      );

      const clientId = dto.clientId ?? existing.clientId;
      const projectId =
        dto.projectId !== undefined ? dto.projectId : existing.projectId;
      const { snapshot: clientSnapshot } = await this.snapshots.loadClient(
        tx,
        agencyId,
        clientId,
      );
      await this.snapshots.assertProject(tx, agencyId, clientId, projectId);
      const { snapshot: agencySnapshot } = await this.snapshots.loadAgency(
        tx,
        agencyId,
      );
      const template = await this.templates.resolve(
        tx,
        agencyId,
        'QUOTATION',
        dto.templateId !== undefined ? dto.templateId : existing.templateId,
      );

      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          title: dto.title?.trim() ?? existing.title,
          clientId,
          projectId: projectId ?? null,
          templateId: template.templateId,
          issueDate,
          expiryDate,
          clientSnapshot: asJson(clientSnapshot),
          agencySnapshot: asJson(agencySnapshot),
          templateSnapshot: asJson(template.snapshot),
          currency: agencySnapshot.currency,
          notes:
            dto.notes !== undefined ? dto.notes.trim() || null : existing.notes,
          terms:
            dto.terms !== undefined ? dto.terms.trim() || null : existing.terms,
          ...pricingFields(calc),
          items: { create: itemRows(calc) },
        },
        include: QUOTATION_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, {
        agencyId,
        userId,
        action: 'quotation.updated',
        entity: 'Quotation',
        entityId: id,
      });
      return quotation;
    });
  }

  async changeStatus(
    agencyId: string,
    userId: string,
    id: string,
    dto: UpdateQuotationStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'quotations', id, agencyId);
      const existing = await tx.quotation.findUniqueOrThrow({
        where: { id },
        include: { invoice: { select: { id: true } } },
      });
      assertTransition(
        QUOTATION_TRANSITIONS,
        existing.status,
        dto.status,
        'Quotation',
      );

      if (dto.status === 'ACCEPTED' && existing.expiryDate < new Date()) {
        throw new ConflictException(
          'This quotation has passed its expiry date and can no longer be accepted',
        );
      }
      if (dto.status === 'VOID' && existing.invoice) {
        throw new ConflictException(
          'This quotation has been converted to an invoice and cannot be voided',
        );
      }

      const now = new Date();
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.status === 'SENT' ? { sentAt: now } : {}),
          ...(dto.status === 'ACCEPTED' ? { acceptedAt: now } : {}),
        },
        include: QUOTATION_DETAIL_INCLUDE,
      });
      await this.audit.log(tx, {
        agencyId,
        userId,
        action: 'quotation.status_changed',
        entity: 'Quotation',
        entityId: id,
        details: { from: existing.status, to: dto.status },
      });
      return quotation;
    });
  }

  /**
   * Converts an ACCEPTED quotation into an invoice, copying the client,
   * agency and line-item snapshots, totals, notes, terms and reference.
   *
   * Idempotent: if the quotation already has an invoice, that invoice is
   * returned. Duplicates are impossible because (1) the quotation row is locked
   * for the duration of the transaction, so concurrent clicks run one after the
   * other and the second sees the invoice, and (2) Invoice.quotationId is
   * UNIQUE in the database as a last line of defence.
   */
  async convertToInvoice(
    agencyId: string,
    userId: string,
    id: string,
    dto: ConvertQuotationDto = {},
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockDocument(tx, 'quotations', id, agencyId);
        const quotation = await tx.quotation.findUniqueOrThrow({
          where: { id },
          include: {
            items: { orderBy: { position: 'asc' } },
            invoice: { select: { id: true } },
          },
        });
        if (quotation.invoice) {
          return tx.invoice.findUniqueOrThrow({
            where: { id: quotation.invoice.id },
            include: INVOICE_DETAIL_INCLUDE,
          });
        }
        if (quotation.status !== 'ACCEPTED') {
          throw new ConflictException(
            `Only ACCEPTED quotations can be converted (this one is ${quotation.status})`,
          );
        }

        const issueDate = new Date();
        const dueDate = endOfDay(
          dto.dueDate ? new Date(dto.dueDate) : addDays(issueDate, 14),
        );
        assertDateOrder(
          issueDate,
          dueDate,
          'Due date must be on or after today',
        );
        const template = await this.templates.resolve(
          tx,
          agencyId,
          'INVOICE',
          dto.templateId,
        );
        const number = await this.numbering.next(tx, agencyId, 'INV');

        const invoice = await tx.invoice.create({
          data: {
            agencyId,
            number,
            title: quotation.title,
            quotationId: quotation.id,
            reference: quotation.number,
            clientId: quotation.clientId,
            projectId: quotation.projectId,
            templateId: template.templateId,
            issueDate,
            dueDate,
            clientSnapshot: quotation.clientSnapshot as Prisma.InputJsonValue,
            agencySnapshot: quotation.agencySnapshot as Prisma.InputJsonValue,
            templateSnapshot: asJson(template.snapshot),
            subtotal: quotation.subtotal,
            discountType: quotation.discountType,
            discountValue: quotation.discountValue,
            discountAmount: quotation.discountAmount,
            taxRate: quotation.taxRate,
            taxAmount: quotation.taxAmount,
            total: quotation.total,
            paidAmount: 0,
            outstandingAmount: quotation.total,
            currency: quotation.currency,
            notes: quotation.notes,
            terms: quotation.terms,
            items: {
              create: quotation.items.map(
                ({
                  position,
                  description,
                  quantity,
                  unitPrice,
                  lineTotal,
                }) => ({
                  position,
                  description,
                  quantity,
                  unitPrice,
                  lineTotal,
                }),
              ),
            },
          },
          include: INVOICE_DETAIL_INCLUDE,
        });
        await this.audit.log(tx, {
          agencyId,
          userId,
          action: 'quotation.converted',
          entity: 'Quotation',
          entityId: quotation.id,
          details: { invoiceId: invoice.id, invoiceNumber: number },
        });
        return invoice;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const existing = await this.prisma.invoice.findFirst({
          where: { quotationId: id, agencyId },
          include: INVOICE_DETAIL_INCLUDE,
        });
        if (existing) return existing;
      }
      throw e;
    }
  }
}
