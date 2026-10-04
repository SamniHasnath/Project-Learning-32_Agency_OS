import { createHarness, Harness, TestAgency } from './helpers';

/** Agency B must never be able to see or touch Agency A's data. */
describe('Multi-tenant isolation (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  let B: TestAgency;
  let quoteA: { id: string };
  let invoiceA: { id: string };
  let templateA: { id: string };

  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Agency A');
    B = await h.agency('Agency B');
    quoteA = await h.quotation(A, { statuses: ['SENT', 'ACCEPTED'] });
    invoiceA = await h.sentInvoice(A, 1000);
    templateA = (await h.as(A.token).get('/document-templates').expect(200)).body[0];
  });
  afterAll(() => h.close());

  it('lists only the caller agency records', async () => {
    for (const path of ['/quotations', '/invoices', '/clients', '/payments']) {
      const res = await h.as(B.token).get(path).expect(200);
      const ids = res.body.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(quoteA.id);
      expect(ids).not.toContain(invoiceA.id);
      expect(ids).not.toContain(A.clientId);
    }
  });

  it.each([
    ['GET quotation', (b: Harness['as']) => b(B.token).get(`/quotations/${quoteA.id}`)],
    ['GET quotation PDF', (b: Harness['as']) => b(B.token).get(`/quotations/${quoteA.id}/pdf`)],
    ['PATCH quotation', (b: Harness['as']) => b(B.token).patch(`/quotations/${quoteA.id}`, { title: 'hijacked' })],
    ['PATCH quotation status', (b: Harness['as']) => b(B.token).patch(`/quotations/${quoteA.id}/status`, { status: 'VOID' })],
    ['convert quotation', (b: Harness['as']) => b(B.token).post(`/quotations/${quoteA.id}/convert-to-invoice`)],
    ['GET invoice', (b: Harness['as']) => b(B.token).get(`/invoices/${invoiceA.id}`)],
    ['GET invoice PDF', (b: Harness['as']) => b(B.token).get(`/invoices/${invoiceA.id}/pdf`)],
    ['PATCH invoice status', (b: Harness['as']) => b(B.token).patch(`/invoices/${invoiceA.id}/status`, { status: 'VOID' })],
    ['pay invoice', (b: Harness['as']) => b(B.token).post('/payments', { invoiceId: invoiceA.id, amount: 1 })],
    ['GET client', (b: Harness['as']) => b(B.token).get(`/clients/${A.clientId}`)],
    ['PATCH client', (b: Harness['as']) => b(B.token).patch(`/clients/${A.clientId}`, { name: 'x' })],
    ['GET template', (b: Harness['as']) => b(B.token).get(`/document-templates/${templateA.id}`)],
    ['PATCH template', (b: Harness['as']) => b(B.token).patch(`/document-templates/${templateA.id}`, { name: 'x' })],
  ])('returns 404 for %s across tenants', async (_, call) => {
    await call(h.as).expect(404);
  });

  it("cannot create documents against another agency's client or template", async () => {
    const body = { title: 'x', expiryDate: '2099-01-01', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] };
    await h.as(B.token).post('/quotations', { ...body, clientId: A.clientId }).expect(400);
    await h.as(B.token).post('/invoices', { ...body, clientId: A.clientId }).expect(400);
    await h.as(B.token).post('/quotations', { ...body, clientId: B.clientId, templateId: templateA.id }).expect(400);
  });

  it('ignores any attempt to supply agencyId from the client', async () => {
    const body = { clientId: B.clientId, title: 'x', expiryDate: '2099-01-01', items: [{ description: 'x', quantity: 1, unitPrice: 1 }] };
    await h.as(B.token).post('/quotations', { ...body, agencyId: A.agencyId }).expect(400);
    await h.as(B.token).get(`/quotations?agencyId=${A.agencyId}`).expect(400);
  });

  it("left Agency A's data untouched", async () => {
    const q = await h.as(A.token).get(`/quotations/${quoteA.id}`).expect(200);
    expect(q.body.status).toBe('ACCEPTED');
    expect(q.body.invoice).toBeNull();
    const inv = await h.as(A.token).get(`/invoices/${invoiceA.id}`).expect(200);
    expect(inv.body.status).toBe('SENT');
    expect(inv.body.paidAmount).toBe('0');
  });
});
