import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        client: true,
        _count: { select: { quotations: true, invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        quotations: true,
        invoices: true,
      },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async create(data: any) {
    return this.prisma.project.create({
      data,
      include: { client: true },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
