import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestAgency {
  token: string;
  agencyId: string;
  userId: string;
  clientId: string;
}

export interface Harness {
  app: INestApplication<App>;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
  /** Registers a fresh agency + one client and returns its credentials. */
  agency: (name: string) => Promise<TestAgency>;
  as: (token: string) => {
    get: (url: string) => request.Test;
    post: (url: string, body?: object) => request.Test;
    patch: (url: string, body?: object) => request.Test;
    del: (url: string) => request.Test;
  };
  /** Creates a quotation and walks it through the given statuses. */
  quotation: (a: TestAgency, opts?: { items?: object[]; statuses?: string[]; extra?: object }) => Promise<any>;
  /** Creates a SENT invoice with the given total. */
  sentInvoice: (a: TestAgency, total: number) => Promise<any>;
  close: () => Promise<void>;
}

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
let counter = 0;

export async function createHarness(): Promise<Harness> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);

  // Clean slate for every test file.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE payments, invoice_items, invoices, quotation_items, quotations, projects, clients, document_templates, audit_logs, users, agencies, document_sequences CASCADE',
  );

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({
    get: (url: string) => http().get(`/api${url}`).set('Authorization', `Bearer ${token}`),
    post: (url: string, body: object = {}) => http().post(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
    patch: (url: string, body: object = {}) => http().patch(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
    del: (url: string) => http().delete(`/api${url}`).set('Authorization', `Bearer ${token}`),
  });

  const agency = async (name: string): Promise<TestAgency> => {
    const email = `${name.toLowerCase().replace(/\W+/g, '')}-${++counter}-${Date.now()}@test.dev`;
    const reg = await http()
      .post('/api/auth/register')
      .send({ agencyName: name, name: `${name} Owner`, email, password: 'Password123!' })
      .expect(201);
    const token = reg.body.accessToken as string;
    const client = await as(token)
      .post('/clients', { name: `${name} Client`, email: `client-${counter}@${name.toLowerCase().replace(/\W+/g, '')}.test`, company: `${name} Customer Ltd` })
      .expect(201);
    return { token, agencyId: reg.body.agency.id, userId: reg.body.user.id, clientId: client.body.id };
  };

  const quotation: Harness['quotation'] = async (a, opts = {}) => {
    const res = await as(a.token)
      .post('/quotations', {
        clientId: a.clientId,
        title: 'Test quotation',
        expiryDate: day(30),
        taxRate: 10,
        items: opts.items ?? [{ description: 'Work', quantity: 1, unitPrice: 1000 }],
        ...(opts.extra ?? {}),
      })
      .expect(201);
    let q = res.body;
    for (const status of opts.statuses ?? []) {
      q = (await as(a.token).patch(`/quotations/${q.id}/status`, { status }).expect(200)).body;
    }
    return q;
  };

  const sentInvoice: Harness['sentInvoice'] = async (a, total) => {
    const inv = await as(a.token)
      .post('/invoices', { clientId: a.clientId, title: 'Test invoice', items: [{ description: 'Work', quantity: 1, unitPrice: total }] })
      .expect(201);
    return (await as(a.token).patch(`/invoices/${inv.body.id}/status`, { status: 'SENT' }).expect(200)).body;
  };

  return { app, prisma, http, agency, as, quotation, sentInvoice, close: () => app.close() };
}
