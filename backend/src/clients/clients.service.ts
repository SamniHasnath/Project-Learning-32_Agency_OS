import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

/** Empty strings from forms are stored as NULL. */
const clean = <T extends object>(dto: T) =>
  Object.fromEntries(
    Object.entries(dto).map(([k, v]) => [
      k,
      typeof v === 'string' ? v.trim() || null : v,
    ]),
  ) as T;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(agencyId: string, search?: string) {
    const q = search?.trim();
    return this.prisma.client.findMany({
      where: {
        agencyId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { company: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { projects: true, quotations: true, invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(agencyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, agencyId },
      include: {
        projects: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: {
          select: { projects: true, quotations: true, invoices: true },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(agencyId: string, dto: CreateClientDto) {
    try {
      return await this.prisma.client.create({
        data: {
          ...clean(dto),
          name: dto.name.trim(),
          email: dto.email,
          agencyId,
        },
      });
    } catch (e) {
      throw this.duplicate(e);
    }
  }

  async update(agencyId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(agencyId, id);
    try {
      // Issued quotations/invoices keep their own clientSnapshot, so this edit never changes them.
      return await this.prisma.client.update({
        where: { id },
        data: clean(dto),
      });
    } catch (e) {
      throw this.duplicate(e);
    }
  }

  async remove(agencyId: string, id: string) {
    const client = await this.findOne(agencyId, id);
    const { quotations, invoices, projects } = client._count;
    if (quotations || invoices || projects) {
      throw new ConflictException(
        'This client has projects or documents. Mark it INACTIVE instead of deleting it.',
      );
    }
    await this.prisma.client.delete({ where: { id } });
    return { success: true };
  }

  private duplicate(e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new ConflictException('A client with this email already exists');
    }
    return e;
  }
}
