import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentTemplate, DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import {
  BUILTIN_TEMPLATE,
  normaliseLayout,
  type TemplateBranding,
  type TemplateLayout,
  type TemplateSnapshot,
} from './template-config';

@Injectable()
export class DocumentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(agencyId: string, type?: DocumentType) {
    return this.prisma.documentTemplate.findMany({
      where: { agencyId, ...(type ? { type } : {}) },
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(agencyId: string, id: string) {
    const template = await this.prisma.documentTemplate.findFirst({ where: { id, agencyId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  create(agencyId: string, dto: CreateTemplateDto) {
    return this.prisma.$transaction(async (tx) => {
      const hasDefault = await tx.documentTemplate.count({ where: { agencyId, type: dto.type, isDefault: true } });
      const isDefault = dto.isDefault === true || hasDefault === 0;
      if (isDefault) await this.clearDefault(tx, agencyId, dto.type);
      return tx.documentTemplate.create({
        data: {
          agencyId,
          name: dto.name.trim(),
          type: dto.type,
          isDefault,
          branding: { ...dto.branding },
          layout: this.layoutJson(dto.layout),
        },
      });
    });
  }

  async update(agencyId: string, id: string, dto: UpdateTemplateDto) {
    const existing = await this.findOne(agencyId, id);
    if (dto.type && dto.type !== existing.type) throw new BadRequestException('Template type cannot be changed');
    if (dto.isDefault === false && existing.isDefault) {
      throw new BadRequestException('Set another template as default instead of unsetting this one');
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await this.clearDefault(tx, agencyId, existing.type);
      return tx.documentTemplate.update({
        where: { id: existing.id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.isDefault ? { isDefault: true } : {}),
          ...(dto.branding ? { branding: { ...dto.branding } } : {}),
          ...(dto.layout ? { layout: this.layoutJson(dto.layout) } : {}),
          version: { increment: 1 },
        },
      });
    });
  }

  async setDefault(agencyId: string, id: string) {
    return this.update(agencyId, id, { isDefault: true });
  }

  async remove(agencyId: string, id: string) {
    const existing = await this.findOne(agencyId, id);
    if (existing.isDefault) throw new ConflictException('The default template cannot be deleted');
    // Issued documents keep their own templateSnapshot, so deleting is safe.
    await this.prisma.documentTemplate.delete({ where: { id: existing.id } });
    return { success: true };
  }

  /**
   * Resolves the template for a new document: the requested one (must belong
   * to the agency and match the type), else the agency default, else built-in.
   */
  async resolve(
    tx: Prisma.TransactionClient,
    agencyId: string,
    type: DocumentType,
    templateId?: string | null,
  ): Promise<{ templateId: string | null; snapshot: TemplateSnapshot }> {
    const template = templateId
      ? await tx.documentTemplate.findFirst({ where: { id: templateId, agencyId, type } })
      : await tx.documentTemplate.findFirst({ where: { agencyId, type, isDefault: true } });
    if (templateId && !template) throw new BadRequestException(`Template not found for ${type.toLowerCase()}s`);
    if (!template) return { templateId: null, snapshot: BUILTIN_TEMPLATE[type] };
    return { templateId: template.id, snapshot: this.toSnapshot(template) };
  }

  toSnapshot(template: DocumentTemplate): TemplateSnapshot {
    return {
      id: template.id,
      name: template.name,
      version: template.version,
      branding: template.branding as unknown as TemplateBranding,
      layout: normaliseLayout(template.layout as unknown as TemplateLayout),
    };
  }

  private clearDefault(tx: Prisma.TransactionClient, agencyId: string, type: DocumentType) {
    return tx.documentTemplate.updateMany({ where: { agencyId, type, isDefault: true }, data: { isDefault: false } });
  }

  private layoutJson(layout: TemplateLayout): Prisma.InputJsonValue {
    return normaliseLayout(layout) as unknown as Prisma.InputJsonValue;
  }
}
