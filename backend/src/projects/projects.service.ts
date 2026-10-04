import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(agencyId: string, clientId?: string) {
    return this.prisma.project.findMany({
      where: { agencyId, ...(clientId ? { clientId } : {}) },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { quotations: true, invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(agencyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, agencyId },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        quotations: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        _count: { select: { quotations: true, invoices: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(agencyId: string, dto: CreateProjectDto) {
    await this.assertClient(agencyId, dto.clientId);
    return this.prisma.project.create({
      data: {
        agencyId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        clientId: dto.clientId,
        status: dto.status,
        budget: dto.budget ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
  }

  async update(agencyId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(agencyId, id);
    if (dto.clientId) await this.assertClient(agencyId, dto.clientId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.clientId ? { clientId: dto.clientId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
  }

  async remove(agencyId: string, id: string) {
    const project = await this.findOne(agencyId, id);
    if (project._count.quotations || project._count.invoices) {
      throw new ConflictException(
        'This project has documents. Mark it CANCELLED or COMPLETED instead.',
      );
    }
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  private async assertClient(agencyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, agencyId },
      select: { id: true },
    });
    if (!client) throw new BadRequestException('Client not found');
  }
}
