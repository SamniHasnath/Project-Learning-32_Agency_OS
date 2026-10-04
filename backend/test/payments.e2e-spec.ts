import { createHarness, Harness, TestAgency } from './helpers';

describe('Payments (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Pay Agency');
  });
  afterAll(() => h.close());

  const pay = (invoiceId: string, amount: number) => h.as(A.token).post('/payments', { invoiceId, amount });
  const invoice = async (id: string) => (await h.as(A.token).get(`/invoices/${id}`).expect(200)).body;

  it('Invoice 1000, paid 800, new payment 500 → rejected', async () => {
    const inv = await h.sentInvoice(A, 1000);
    await pay(inv.id, 800).expect(201);
    const res = await pay(inv.id, 500).expect(400);
    expect(res.body.message).toContain('exceeds the outstanding amount of 200.00');
    expect(await invoice(inv.id)).toMatchObject({ paidAmount: '800', outstandingAmount: '200', status: 'PARTIALLY_PAID' });
  });

  it('tracks partial payments then marks PAID on the exact remainder', async () => {
    const inv = await h.sentInvoice(A, 1000);
    await pay(inv.id, 250.25).expect(201);
    expect(await invoice(inv.id)).toMatchObject({ paidAmount: '250.25', outstandingAmount: '749.75', status: 'PARTIALLY_PAID' });
    await pay(inv.id, 749.75).expect(201);
    const paid = await invoice(inv.id);
    expect(paid).toMatchObject({ paidAmount: '1000', outstandingAmount: '0', status: 'PAID' });
    expect(paid.paidAt).toBeTruthy();
    await pay(inv.id, 0.01).expect(409);
  });

  it('keeps a payment history per invoice', async () => {
    const inv = await h.sentInvoice(A, 300);
    await pay(inv.id, 100).expect(201);
    await pay(inv.id, 50).expect(201);
    const history = await h.as(A.token).get(`/invoices/${inv.id}/payments`).expect(200);
    expect(history.body.map((p: { amount: string }) => p.amount).sort()).toEqual(['100', '50']);
    expect(history.body[0].number).toMatch(/^PAY-\d{4}-\d{4}$/);
  });

  it('rejects zero, negative and sub-cent amounts', async () => {
    const inv = await h.sentInvoice(A, 100);
    await pay(inv.id, 0).expect(400);
    await pay(inv.id, -10).expect(400);
    await pay(inv.id, 1.001).expect(400);
  });

  it('rejects payments on DRAFT and VOID invoices', async () => {
    const draft = await h.as(A.token).post('/invoices', { clientId: A.clientId, title: 'd', items: [{ description: 'x', quantity: 1, unitPrice: 100 }] }).expect(201);
    await pay(draft.body.id, 10).expect(409);
    await h.as(A.token).patch(`/invoices/${draft.body.id}/status`, { status: 'VOID' }).expect(200);
    await pay(draft.body.id, 10).expect(409);
  });

  it('cannot void an invoice that has payments', async () => {
    const inv = await h.sentInvoice(A, 100);
    await pay(inv.id, 10).expect(201);
    await h.as(A.token).patch(`/invoices/${inv.id}/status`, { status: 'VOID' }).expect(409);
  });

  it('prevents overpayment under concurrency (row lock)', async () => {
    const inv = await h.sentInvoice(A, 1000);
    // Each payment alone fits; together they would overpay.
    const results = await Promise.all(Array.from({ length: 5 }, () => pay(inv.id, 400)));
    const ok = results.filter((r) => r.status === 201).length;
    expect(ok).toBe(2);
    expect(results.filter((r) => r.status === 400)).toHaveLength(3);
    expect(await invoice(inv.id)).toMatchObject({ paidAmount: '800', outstandingAmount: '200' });
  });

  it('never trusts paidAmount from the client', async () => {
    await h.as(A.token)
      .post('/invoices', { clientId: A.clientId, title: 'x', paidAmount: 999, items: [{ description: 'x', quantity: 1, unitPrice: 100 }] })
      .expect(400);
  });
});
