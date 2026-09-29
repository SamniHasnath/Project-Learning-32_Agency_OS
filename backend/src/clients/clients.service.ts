import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  private memoryClients = [
    {
      id: 'c1',
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      address: '100 Industrial Parkway, CA',
      taxId: 'TX-998811',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      _count: { projects: 2, quotations: 1, invoices: 3 },
    },
    {
      id: 'c2',
      name: 'Globex Enterprise',
      email: 'hello@globex.io',
      phone: '+1 (555) 987-6543',
      company: 'Globex Inc.',
      address: '450 Innovation Way, Austin, TX',
      taxId: 'TX-774422',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      _count: { projects: 1, quotations: 2, invoices: 1 },
    },
    {
      id: 'c3',
      name: 'Stark Media Group',
      email: 'info@starkmedia.com',
      phone: '+1 (555) 456-7890',
      company: 'Stark Media',
      address: '1 Stark Tower, New York, NY',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      _count: { projects: 3, quotations: 0, invoices: 2 },
    },
  ];

  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.client.findMany({
          include: {
            _count: { select: { projects: true, quotations: true, invoices: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    return this.memoryClients;
  }

  async findOne(id: string) {
    if (this.prisma.isConnected) {
      try {
        const client = await this.prisma.client.findUnique({
          where: { id },
          include: { projects: true, quotations: true, invoices: true },
        });
        if (client) return client;
      } catch (e) {
        console.warn('DB error, using memory fallback:', e?.message);
      }
    }
    const client = this.memoryClients.find((c) => c.id === id);
    if (!client) throw new NotFoundException(`Client with ID ${id} not found`);
    return client;
  }

  async create(data: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.client.create({ data });
      } catch (e) {
        console.warn('DB error, saving to memory:', e?.message);
      }
    }
    const newClient = {
      id: `client-${Date.now()}`,
      name: data.name || 'New Client',
      email: data.email || 'client@example.com',
      phone: data.phone,
      company: data.company,
      address: data.address,
      taxId: data.taxId,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      _count: { projects: 0, quotations: 0, invoices: 0 },
    };
    this.memoryClients.unshift(newClient);
    return newClient;
  }

  async update(id: string, data: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.client.update({ where: { id }, data });
      } catch (e) {
        console.warn('DB error, updating memory:', e?.message);
      }
    }
    const index = this.memoryClients.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Client with ID ${id} not found`);
    this.memoryClients[index] = { ...this.memoryClients[index], ...data };
    return this.memoryClients[index];
  }

  async remove(id: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.client.delete({ where: { id } });
      } catch (e) {
        console.warn('DB error, deleting from memory:', e?.message);
      }
    }
    this.memoryClients = this.memoryClients.filter((c) => c.id !== id);
    return { success: true };
  }
}
