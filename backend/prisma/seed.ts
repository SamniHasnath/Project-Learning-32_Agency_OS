/**
 * Demo data. Runs through the real application services (not raw inserts), so
 * every seeded document gets proper numbering, snapshots, totals and status
 * history exactly as if a user had created it.
 *
 *   npm run db:seed
 *
 * Login afterwards with demo@agencyos.dev / Demo1234!
 * Safe to re-run: does nothing if the demo user already exists.
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ClientsService } from '../src/clients/clients.service';
import { InvoicesService } from '../src/invoices/invoices.service';
import { PaymentsService } from '../src/payments/payments.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProjectsService } from '../src/projects/projects.service';
import { QuotationsService } from '../src/quotations/quotations.service';
import { SettingsService } from '../src/settings/settings.service';

const DEMO_EMAIL = 'demo@agencyos.dev';
const DEMO_PASSWORD = 'Demo1234!';

const day = (offset: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const prisma = app.get(PrismaService);
    if (await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })) {
      console.log(
        `Demo data already present — log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
      );
      return;
    }

    const { user, agency } = await app.get(AuthService).register({
      agencyName: 'Northstar Creative',
      name: 'Alex Morgan',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    const a = agency.id;
    const u = user.id;

    await app.get(SettingsService).updateSettings(a, {
      email: 'billing@northstarcreative.com',
      phone: '+1 (415) 555-0184',
      website: 'northstarcreative.com',
      address: '742 Evergreen Terrace, Suite 400\nSan Francisco, CA 94107',
      taxId: 'US-948301928',
      currency: 'USD',
    });

    const clients = app.get(ClientsService);
    const acme = await clients.create(a, {
      name: 'Olivia Chen',
      company: 'Acme Studio',
      email: 'olivia@acmestudio.co',
      phone: '+1 (555) 123-4567',
      address: '100 Industrial Parkway, Oakland, CA',
      taxId: 'TX-998811',
    });
    const globex = await clients.create(a, {
      name: 'Marcus Lee',
      company: 'Globex Enterprise',
      email: 'marcus@globex.io',
      phone: '+1 (555) 987-6543',
      address: '450 Innovation Way, Austin, TX',
    });
    const fieldwork = await clients.create(a, {
      name: 'Sofia Reyes',
      company: 'Fieldwork Coffee',
      email: 'sofia@fieldwork.coffee',
      address: '12 Roastery Lane, Portland, OR',
    });

    const projects = app.get(ProjectsService);
    const website = await projects.create(a, {
      name: 'Website redesign',
      clientId: globex.id,
      budget: 24000,
      status: 'IN_PROGRESS',
    });
    const packaging = await projects.create(a, {
      name: 'Packaging system',
      clientId: fieldwork.id,
      budget: 9800,
      status: 'IN_PROGRESS',
    });

    const quotations = app.get(QuotationsService);
    const terms =
      '50% deposit on acceptance, balance on delivery. Payment due within 14 days of invoice.';

    await quotations.create(a, u, {
      clientId: acme.id,
      title: 'Brand identity package',
      expiryDate: day(30),
      taxRate: 10,
      items: [
        {
          description: 'Discovery workshop & brand strategy',
          quantity: 1,
          unitPrice: 2400,
        },
        {
          description: 'Logo suite & visual identity',
          quantity: 1,
          unitPrice: 4200,
        },
        {
          description: 'Brand guidelines (40 pages)',
          quantity: 1,
          unitPrice: 1800,
        },
      ],
      notes: 'Includes two rounds of revisions per deliverable.',
      terms,
    });

    const sent = await quotations.create(a, u, {
      clientId: globex.id,
      projectId: website.id,
      title: 'Website redesign — phase 1',
      expiryDate: day(5),
      taxRate: 8.5,
      discountType: 'PERCENTAGE',
      discountValue: 5,
      items: [
        {
          description: 'UX research & information architecture',
          quantity: 1,
          unitPrice: 3800,
        },
        {
          description: 'UI design — page templates',
          quantity: 8,
          unitPrice: 650,
        },
        {
          description: 'Next.js front-end development (days)',
          quantity: 12,
          unitPrice: 720,
        },
      ],
      terms,
    });
    await quotations.changeStatus(a, u, sent.id, { status: 'SENT' });

    const accepted = await quotations.create(a, u, {
      clientId: fieldwork.id,
      projectId: packaging.id,
      title: 'Packaging system design',
      expiryDate: day(20),
      taxRate: 10,
      discountType: 'FIXED',
      discountValue: 200,
      items: [
        {
          description: 'Packaging concept exploration',
          quantity: 1,
          unitPrice: 2200,
        },
        {
          description: 'Bag & label artwork (per SKU)',
          quantity: 6,
          unitPrice: 450,
        },
        {
          description: 'Print-ready production files',
          quantity: 1,
          unitPrice: 900,
        },
      ],
      notes: 'Printer liaison included.',
      terms,
    });
    await quotations.changeStatus(a, u, accepted.id, { status: 'SENT' });
    await quotations.changeStatus(a, u, accepted.id, { status: 'ACCEPTED' });
    const converted = await quotations.convertToInvoice(a, u, accepted.id, {
      dueDate: day(14),
    });

    const rejected = await quotations.create(a, u, {
      clientId: acme.id,
      title: 'Social campaign creative',
      expiryDate: day(15),
      items: [
        {
          description: 'Campaign concept & 12 social assets',
          quantity: 1,
          unitPrice: 3800,
        },
      ],
    });
    await quotations.changeStatus(a, u, rejected.id, { status: 'SENT' });
    await quotations.changeStatus(a, u, rejected.id, { status: 'REJECTED' });

    const invoices = app.get(InvoicesService);
    const payments = app.get(PaymentsService);

    await invoices.changeStatus(a, u, converted.id, { status: 'SENT' });
    await payments.create(a, u, {
      invoiceId: converted.id,
      amount: 3000,
      method: 'BANK_TRANSFER',
      reference: 'WIRE-55120',
    });

    const retainer = await invoices.create(a, u, {
      clientId: globex.id,
      title: 'Monthly retainer — September',
      reference: 'PO-7781',
      dueDate: day(10),
      taxRate: 8.5,
      items: [
        {
          description: 'Design & development retainer (40 h)',
          quantity: 40,
          unitPrice: 95,
        },
      ],
    });
    await invoices.changeStatus(a, u, retainer.id, { status: 'SENT' });
    await payments.create(a, u, {
      invoiceId: retainer.id,
      amount: Number(retainer.total),
      method: 'CREDIT_CARD',
      reference: 'CARD-1022',
    });

    await invoices.create(a, u, {
      clientId: acme.id,
      title: 'Photography day rate',
      taxRate: 10,
      items: [
        {
          description: 'On-location product photography (day)',
          quantity: 1,
          unitPrice: 1600,
        },
        { description: 'Retouching (per image)', quantity: 25, unitPrice: 18 },
      ],
    });

    console.log(
      `Seeded demo agency. Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
    );
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
