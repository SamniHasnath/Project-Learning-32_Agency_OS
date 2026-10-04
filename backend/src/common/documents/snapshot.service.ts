import { BadRequestException, Injectable } from '@nestjs/common';
import { Agency, Client, Prisma } from '@prisma/client';

export interface ClientSnapshot {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxId: string | null;
}

export interface AgencySnapshot {
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  currency: string;
  logoUrl: string | null;
}

/**
 * Builds the frozen copies stored on quotations and invoices. Documents render
 * from these copies only, so editing a client or the agency profile later never
 * rewrites what was sent to a customer.
 */
@Injectable()
export class SnapshotService {
  /** Loads a client that must belong to the agency and returns it with its snapshot. */
  async loadClient(tx: Prisma.TransactionClient, agencyId: string, clientId: string) {
    const client = await tx.client.findFirst({ where: { id: clientId, agencyId } });
    if (!client) throw new BadRequestException('Client not found');
    return { client, snapshot: this.client(client) };
  }

  async loadAgency(tx: Prisma.TransactionClient, agencyId: string) {
    const agency = await tx.agency.findUniqueOrThrow({ where: { id: agencyId } });
    return { agency, snapshot: this.agency(agency) };
  }

  /** Optional project must belong to the agency and to the same client. */
  async assertProject(tx: Prisma.TransactionClient, agencyId: string, clientId: string, projectId?: string | null) {
    if (!projectId) return;
    const project = await tx.project.findFirst({ where: { id: projectId, agencyId } });
    if (!project) throw new BadRequestException('Project not found');
    if (project.clientId !== clientId) throw new BadRequestException('Project belongs to a different client');
  }

  client(c: Client): ClientSnapshot {
    return { id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company, address: c.address, taxId: c.taxId };
  }

  agency(a: Agency): AgencySnapshot {
    return {
      name: a.name,
      email: a.email,
      phone: a.phone,
      website: a.website,
      address: a.address,
      taxId: a.taxId,
      currency: a.currency,
      logoUrl: a.logoUrl,
    };
  }
}

export const asJson = (value: unknown) => value as Prisma.InputJsonValue;
