import { createHarness, Harness, TestAgency } from './helpers';

describe('Quotations & conversion (e2e)', () => {
  let h: Harness;
  let A: TestAgency;
  beforeAll(async () => {
    h = await createHarness();
    A = await h.agency('Quote Agency');
  });
  afterAll(() => h.close());

  const items = [
    { description: 'Design', quantity: 2, unitPrice: 1500 },
    { description: 'Build', quantity: 10, unitPrice: 95.5 },
  ];

  describe('creation & calculations', () => {
    it('recalculates every total on the server', async () => {
      const q = await h.quotation(A, {
        items,
        extra: { taxRate: 10, discountType: 'FIXED', discountValue: 155 },
      });
      expect(q.items.map((i: { lineTotal: string }) => i.lineTotal)).toEqual([
        '3000',
        '955',
      ]);
      expect(q).toMatchObject({
        subtotal: '3955',
        discountAmount: '155',
        taxAmount: '380',
        total: '4180',
        status: 'DRAFT',
      });
      expect(q.number).toMatch(/^QT-\d{4}-\d{4}$/);
    });

    it('rejects client-supplied totals, numbers and statuses', async () => {
      const base = {
        clientId: A.clientId,
        title: 'x',
        expiryDate: '2099-01-01',
        items,
      };
      for (const extra of [
        { total: 1 },
        { subtotal: 1 },
        { number: 'QT-1999-0001' },
        { status: 'ACCEPTED' },
      ]) {
        await h
          .as(A.token)
          .post('/quotations', { ...base, ...extra })
          .expect(400);
      }
      await h
        .as(A.token)
        .post('/quotations', {
          ...base,
          items: [{ ...items[0], lineTotal: 1 }],
        })
        .expect(400);
    });

    it('auto-fills client details into the snapshot', async () => {
      const q = await h.quotation(A);
      const client = (await h.as(A.token).get(`/clients/${A.clientId}`)).body;
      expect(q.clientSnapshot).toMatchObject({
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
      });
      expect(q.templateSnapshot.layout.title).toBe('QUOTATION');
    });

    it('requires at least one line item and a valid expiry date', async () => {
      await h
        .as(A.token)
        .post('/quotations', {
          clientId: A.clientId,
          title: 'x',
          expiryDate: '2099-01-01',
          items: [],
        })
        .expect(400);
      await h
        .as(A.token)
        .post('/quotations', {
          clientId: A.clientId,
          title: 'x',
          issueDate: '2026-05-10',
          expiryDate: '2026-05-01',
          items,
        })
        .expect(400);
    });
  });

  describe('editing & status workflow', () => {
    it('edits a DRAFT and recalculates', async () => {
      const q = await h.quotation(A);
      const res = await h
        .as(A.token)
        .patch(`/quotations/${q.id}`, {
          items: [{ description: 'New', quantity: 3, unitPrice: 100 }],
          taxRate: 0,
        })
        .expect(200);
      expect(res.body).toMatchObject({ subtotal: '300', total: '300' });
      expect(res.body.items).toHaveLength(1);
    });

    it('blocks edits once SENT', async () => {
      const q = await h.quotation(A, { statuses: ['SENT'] });
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}`, { title: 'changed' })
        .expect(409);
    });

    it('supports DRAFT → SENT → ACCEPTED and rejects illegal transitions', async () => {
      const q = await h.quotation(A);
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'ACCEPTED' })
        .expect(409);
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'SENT' })
        .expect(200);
      const accepted = await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'ACCEPTED' })
        .expect(200);
      expect(accepted.body.acceptedAt).toBeTruthy();
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'REJECTED' })
        .expect(409);
    });

    it('supports REJECTED, EXPIRED and VOID', async () => {
      await h.quotation(A, { statuses: ['SENT', 'REJECTED'] });
      await h.quotation(A, { statuses: ['SENT', 'EXPIRED'] });
      const v = await h.quotation(A, { statuses: ['VOID'] });
      expect(v.status).toBe('VOID');
    });

    it('refuses to accept a quotation past its expiry date', async () => {
      const q = await h.quotation(A, { statuses: ['SENT'] });
      await h.prisma.quotation.update({
        where: { id: q.id },
        data: { expiryDate: new Date(Date.now() - 86_400_000) },
      });
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'ACCEPTED' })
        .expect(409);
    });
  });

  describe('convert to invoice', () => {
    it.each(['DRAFT', 'SENT', 'REJECTED'])(
      'rejects conversion of a %s quotation',
      async (status) => {
        const path = {
          DRAFT: [],
          SENT: ['SENT'],
          REJECTED: ['SENT', 'REJECTED'],
        }[status]!;
        const q = await h.quotation(A, { statuses: path });
        const res = await h
          .as(A.token)
          .post(`/quotations/${q.id}/convert-to-invoice`)
          .expect(409);
        expect(res.body.message).toContain('Only ACCEPTED');
      },
    );

    it('copies client, items, totals, notes, terms and reference', async () => {
      const q = await h.quotation(A, {
        items,
        statuses: ['SENT', 'ACCEPTED'],
        extra: {
          taxRate: 10,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          notes: 'N',
          terms: 'T',
        },
      });
      const res = await h
        .as(A.token)
        .post(`/quotations/${q.id}/convert-to-invoice`)
        .expect(201);
      const inv = res.body;
      expect(inv.number).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(inv).toMatchObject({
        status: 'DRAFT',
        quotationId: q.id,
        reference: q.number,
        clientId: q.clientId,
        subtotal: q.subtotal,
        discountAmount: q.discountAmount,
        taxAmount: q.taxAmount,
        total: q.total,
        outstandingAmount: q.total,
        paidAmount: '0',
        notes: 'N',
        terms: 'T',
      });
      expect(inv.clientSnapshot).toEqual(q.clientSnapshot);
      expect(
        inv.items.map(
          (i: {
            description: string;
            quantity: string;
            unitPrice: string;
            lineTotal: string;
          }) => [i.description, i.quantity, i.unitPrice, i.lineTotal],
        ),
      ).toEqual(
        q.items.map(
          (i: {
            description: string;
            quantity: string;
            unitPrice: string;
            lineTotal: string;
          }) => [i.description, i.quantity, i.unitPrice, i.lineTotal],
        ),
      );
      const after = await h.as(A.token).get(`/quotations/${q.id}`).expect(200);
      expect(after.body.invoice).toMatchObject({
        id: inv.id,
        number: inv.number,
      });
    });

    it('is idempotent — converting twice returns the same invoice', async () => {
      const q = await h.quotation(A, { statuses: ['SENT', 'ACCEPTED'] });
      const first = await h
        .as(A.token)
        .post(`/quotations/${q.id}/convert-to-invoice`)
        .expect(201);
      const second = await h
        .as(A.token)
        .post(`/quotations/${q.id}/convert-to-invoice`)
        .expect(201);
      expect(second.body.id).toBe(first.body.id);
      expect(
        await h.prisma.invoice.count({ where: { quotationId: q.id } }),
      ).toBe(1);
    });

    it('creates exactly one invoice when convert is clicked many times concurrently', async () => {
      const q = await h.quotation(A, { statuses: ['SENT', 'ACCEPTED'] });
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          h.as(A.token).post(`/quotations/${q.id}/convert-to-invoice`),
        ),
      );
      expect(results.every((r) => r.status === 201)).toBe(true);
      expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
      expect(
        await h.prisma.invoice.count({ where: { quotationId: q.id } }),
      ).toBe(1);
    });

    it('cannot void a quotation that has been converted', async () => {
      const q = await h.quotation(A, { statuses: ['SENT', 'ACCEPTED'] });
      await h
        .as(A.token)
        .post(`/quotations/${q.id}/convert-to-invoice`)
        .expect(201);
      await h
        .as(A.token)
        .patch(`/quotations/${q.id}/status`, { status: 'VOID' })
        .expect(409);
    });
  });

  it('generates a real PDF', async () => {
    const q = await h.quotation(A);
    const res = await h
      .as(A.token)
      .get(`/quotations/${q.id}/pdf`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain(`${q.number}.pdf`);
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
