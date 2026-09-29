import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Agency OS database with initial operational data...');

  // 1. Settings
  await prisma.agencySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Agency OS Digital Services',
      email: 'billing@agencyos.com',
      phone: '+1 (555) 019-2831',
      website: 'https://agencyos.io',
      taxId: 'US948301928',
      currency: 'USD',
      address: '742 Evergreen Terrace, Suite 400, San Francisco, CA 94107',
    },
  });

  // 2. Clients
  const client1 = await prisma.client.upsert({
    where: { email: 'contact@acmecorp.com' },
    update: {},
    create: {
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      address: '100 Industrial Parkway, Tech District, CA',
      taxId: 'TX-998811',
      status: 'ACTIVE',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'hello@globex.io' },
    update: {},
    create: {
      name: 'Globex Enterprise',
      email: 'hello@globex.io',
      phone: '+1 (555) 987-6543',
      company: 'Globex Inc.',
      address: '450 Innovation Way, Austin, TX',
      taxId: 'TX-774422',
      status: 'ACTIVE',
    },
  });

  const client3 = await prisma.client.upsert({
    where: { email: 'info@starkmedia.com' },
    update: {},
    create: {
      name: 'Stark Media Group',
      email: 'info@starkmedia.com',
      phone: '+1 (555) 456-7890',
      company: 'Stark Media',
      address: '1 Stark Tower, New York, NY',
      status: 'ACTIVE',
    },
  });

  // 3. Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform Redesign',
      description: 'Next.js & Tailwind responsive store architecture with Stripe checkout',
      status: 'IN_PROGRESS',
      budget: 18500,
      clientId: client1.id,
      startDate: new Date(),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Brand Identity & Design System',
      description: 'Complete UI component library, design tokens, and branding guidelines',
      status: 'COMPLETED',
      budget: 9200,
      clientId: client2.id,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Quotations
  const quote1 = await prisma.quotation.create({
    data: {
      quoteNumber: 'QT-2026-0001',
      title: 'Enterprise Web Application Suite',
      clientId: client1.id,
      projectId: project1.id,
      status: 'SENT',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 15000,
      taxRate: 10,
      taxAmount: 1500,
      totalAmount: 16500,
      notes: 'Includes 1 year maintenance & API documentation',
      terms: 'Net 30 payment terms upon completion of milestones',
      items: {
        create: [
          { description: 'Frontend Architecture & Next.js Setup', quantity: 1, unitPrice: 7000, amount: 7000 },
          { description: 'Backend Microservices & Prisma Database Integration', quantity: 1, unitPrice: 8000, amount: 8000 },
        ],
      },
    },
  });

  // 5. Invoices & Payments
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      title: 'Brand Identity Design Milestone 1',
      clientId: client2.id,
      projectId: project2.id,
      status: 'PAID',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      subtotal: 9200,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 9200,
      paidAmount: 9200,
      balance: 0,
      notes: 'Paid via Bank Wire',
      items: {
        create: [
          { description: 'Brand Strategy & UI Token Guidelines', quantity: 1, unitPrice: 4200, amount: 4200 },
          { description: 'Component Library & Figma Design Tokens', quantity: 1, unitPrice: 5000, amount: 5000 },
        ],
      },
      payments: {
        create: [
          {
            paymentNumber: 'PAY-2026-0001',
            amount: 9200,
            paymentMethod: 'BANK_TRANSFER',
            reference: 'WIRE-9938472',
            notes: 'Full payment received',
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      title: 'E-Commerce Initial Deposit (50%)',
      clientId: client1.id,
      projectId: project1.id,
      status: 'SENT',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: 8250,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 8250,
      paidAmount: 0,
      balance: 8250,
      items: {
        create: [
          { description: 'Milestone 1 - E-Commerce Sprint 1 Deposit', quantity: 1, unitPrice: 8250, amount: 8250 },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
