import { createHarness, Harness, TestAgency } from './helpers';

describe('Document numbering (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  let B: TestAgency;
  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Num A');
    B = await h.agency('Num B');
  });
  afterAll(() => h.close());

  const year = new Date().getUTCFullYear();

  it('issues sequential numbers per agency, starting at 0001', async () => {
    const a1 = await h.quotation(A);
    const a2 = await h.quotation(A);
    const b1 = await h.quotation(B);
    expect(a1.number).toBe(`QT-${year}-0001`);
    expect(a2.number).toBe(`QT-${year}-0002`);
    expect(b1.number).toBe(`QT-${year}-0001`); // agency scoped
    const inv = await h.sentInvoice(A, 10);
    expect(inv.number).toBe(`INV-${year}-0001`);
  });

  it('stays unique and gap-free under 20 concurrent creates', async () => {
    const before = await h.prisma.quotation.count({ where: { agencyId: A.agencyId } });
    const created = await Promise.all(Array.from({ length: 20 }, () => h.quotation(A)));
    const numbers = created.map((q) => q.number).sort();
    expect(new Set(numbers).size).toBe(20);
    const expected = Array.from({ length: 20 }, (_, i) => `QT-${year}-${String(before + i + 1).padStart(4, '0')}`);
    expect(numbers).toEqual(expected);
  });

  it('does not consume a number when creation fails', async () => {
    const before = await h.quotation(A);
    await h.as(A.token).post('/quotations', { clientId: '00000000-0000-4000-8000-000000000000', title: 'x', expiryDate: '2099-01-01', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] }).expect(400);
    const after = await h.quotation(A);
    const n = (s: string) => Number(s.split('-')[2]);
    expect(n(after.number)).toBe(n(before.number) + 1);
  });
});

describe('Historical snapshot protection (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Snap Agency');
  });
  afterAll(() => h.close());

  it('later client, agency and template edits do not change issued documents', async () => {
    const q = await h.quotation(A, { statuses: ['SENT', 'ACCEPTED'] });
    const inv = (await h.as(A.token).post(`/quotations/${q.id}/convert-to-invoice`).expect(201)).body;
    const templates = (await h.as(A.token).get('/document-templates?type=QUOTATION').expect(200)).body;
    const qt = templates.find((t: { id: string }) => t.id === q.templateId);

    await h.as(A.token).patch(`/clients/${A.clientId}`, { name: 'Renamed Client', company: 'New Co', address: 'Elsewhere' }).expect(200);
    await h.as(A.token).patch('/settings', { name: 'Rebranded Agency', currency: 'EUR' }).expect(200);
    await h.as(A.token).patch(`/document-templates/${qt.id}`, { layout: { ...qt.layout, title: 'ESTIMATE' } }).expect(200);

    const q2 = (await h.as(A.token).get(`/quotations/${q.id}`).expect(200)).body;
    const inv2 = (await h.as(A.token).get(`/invoices/${inv.id}`).expect(200)).body;
    expect(q2.clientSnapshot).toEqual(q.clientSnapshot);
    expect(q2.agencySnapshot).toEqual(q.agencySnapshot);
    expect(q2.templateSnapshot).toEqual(q.templateSnapshot);
    expect(q2.total).toBe(q.total);
    expect(q2.currency).toBe('USD');
    expect(q2.items).toEqual(q.items);
    expect(inv2.clientSnapshot).toEqual(inv.clientSnapshot);
    expect(inv2.agencySnapshot.name).not.toBe('Rebranded Agency');

    // New documents pick up the changes.
    const fresh = await h.quotation(A);
    expect(fresh.clientSnapshot.name).toBe('Renamed Client');
    expect(fresh.agencySnapshot.name).toBe('Rebranded Agency');
    expect(fresh.templateSnapshot.layout.title).toBe('ESTIMATE');
    expect(fresh.currency).toBe('EUR');
  });

  it('refuses to delete a client that has documents', async () => {
    await h.as(A.token).del(`/clients/${A.clientId}`).expect(409);
  });
});

describe('Document templates (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Tpl Agency');
  });
  afterAll(() => h.close());

  const body = {
    name: 'Studio invoice',
    type: 'INVOICE',
    branding: { primaryColor: '#ff6600', accentColor: '#222222', fontFamily: 'Times-Roman', showLogo: false },
    layout: { title: 'BILL', sections: [{ key: 'items', visible: false }, { key: 'header', visible: true }], footerText: 'Thanks' },
  };

  it('creates, normalises and applies a template to new documents', async () => {
    const created = (await h.as(A.token).post('/document-templates', body).expect(201)).body;
    expect(created.layout.sections).toHaveLength(7);
    expect(created.layout.sections[0]).toEqual({ key: 'items', visible: true }); // items can't be hidden
    const inv = await h.as(A.token)
      .post('/invoices', { clientId: A.clientId, title: 'x', templateId: created.id, items: [{ description: 'x', quantity: 1, unitPrice: 5 }] })
      .expect(201);
    expect(inv.body.templateSnapshot).toMatchObject({ id: created.id, layout: { title: 'BILL' }, branding: { primaryColor: '#ff6600' } });
  });

  it('switches the default template and keeps exactly one default per type', async () => {
    const created = (await h.as(A.token).post('/document-templates', { ...body, name: 'Second', isDefault: true }).expect(201)).body;
    const list = (await h.as(A.token).get('/document-templates?type=INVOICE').expect(200)).body;
    expect(list.filter((t: { isDefault: boolean }) => t.isDefault).map((t: { id: string }) => t.id)).toEqual([created.id]);
    const inv = await h.as(A.token).post('/invoices', { clientId: A.clientId, title: 'x', items: [{ description: 'x', quantity: 1, unitPrice: 5 }] }).expect(201);
    expect(inv.body.templateId).toBe(created.id);
    await h.as(A.token).del(`/document-templates/${created.id}`).expect(409);
  });

  it('rejects quotation templates for invoices and invalid colours', async () => {
    const qt = (await h.as(A.token).get('/document-templates?type=QUOTATION').expect(200)).body[0];
    await h.as(A.token).post('/invoices', { clientId: A.clientId, title: 'x', templateId: qt.id, items: [{ description: 'x', quantity: 1, unitPrice: 5 }] }).expect(400);
    await h.as(A.token).post('/document-templates', { ...body, branding: { ...body.branding, primaryColor: 'red; drop' } }).expect(400);
  });
});
