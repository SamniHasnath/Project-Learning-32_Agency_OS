import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  private memoryProjects = [
    {
      id: 'p1',
      name: 'E-Commerce Platform Redesign',
      description: 'Next.js & Tailwind responsive store architecture with Stripe checkout',
      status: 'IN_PROGRESS',
      budget: 18500,
      clientId: 'c1',
      client: { id: 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p2',
      name: 'Brand Identity & Design System',
      description: 'Complete UI component library, design tokens, and branding guidelines',
      status: 'COMPLETED',
      budget: 9200,
      clientId: 'c2',
      client: { id: 'c2', name: 'Globex Enterprise', email: 'hello@globex.io' },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.project.findMany({
          include: { client: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    return this.memoryProjects;
  }

  async findOne(id: string) {
    if (this.prisma.isConnected) {
      try {
        const project = await this.prisma.project.findUnique({
          where: { id },
          include: { client: true, quotations: true, invoices: true },
        });
        if (project) return project;
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    const project = this.memoryProjects.find((p) => p.id === id);
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async create(data: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.project.create({ data, include: { client: true } });
      } catch (e) {
        console.warn('DB error, creating in memory:', e?.message);
      }
    }
    const newProject = {
      id: `proj-${Date.now()}`,
      name: data.name || 'New Project',
      description: data.description,
      status: data.status || 'IN_PROGRESS',
      budget: Number(data.budget || 0),
      clientId: data.clientId || 'c1',
      client: { id: data.clientId || 'c1', name: 'Acme Corporation', email: 'contact@acmecorp.com' },
      createdAt: new Date().toISOString(),
    };
    this.memoryProjects.unshift(newProject);
    return newProject;
  }

  async update(id: string, data: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.project.update({ where: { id }, data, include: { client: true } });
      } catch (e) {
        console.warn('DB error, updating memory:', e?.message);
      }
    }
    const index = this.memoryProjects.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Project with ID ${id} not found`);
    this.memoryProjects[index] = { ...this.memoryProjects[index], ...data };
    return this.memoryProjects[index];
  }

  async remove(id: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.project.delete({ where: { id } });
      } catch (e) {
        console.warn('DB error, deleting from memory:', e?.message);
      }
    }
    this.memoryProjects = this.memoryProjects.filter((p) => p.id !== id);
    return { success: true };
  }
}
