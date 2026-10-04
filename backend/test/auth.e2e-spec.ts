import { createHarness, Harness } from './helpers';

describe('Auth (e2e)', () => {
  let h: Harness;
  beforeAll(async () => (h = await createHarness()));
  afterAll(() => h.close());

  const creds = {
    agencyName: 'Auth Agency',
    name: 'Owner',
    email: 'owner@auth.test',
    password: 'Password123!',
  };

  it('registers an agency with its owner and starter templates', async () => {
    const res = await h
      .http()
      .post('/api/auth/register')
      .send(creds)
      .expect(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'owner@auth.test',
      role: 'OWNER',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    const templates = await h
      .as(res.body.accessToken)
      .get('/document-templates')
      .expect(200);
    expect(
      templates.body.filter((t: { isDefault: boolean }) => t.isDefault),
    ).toHaveLength(2);
  });

  it('rejects a duplicate email', async () => {
    await h.http().post('/api/auth/register').send(creds).expect(409);
  });

  it('logs in case-insensitively and returns the profile from /me', async () => {
    const login = await h
      .http()
      .post('/api/auth/login')
      .send({ email: 'OWNER@auth.test', password: creds.password })
      .expect(200);
    const me = await h.as(login.body.accessToken).get('/auth/me').expect(200);
    expect(me.body.agency.name).toBe('Auth Agency');
  });

  it('rejects wrong passwords and unknown users with the same message', async () => {
    const a = await h
      .http()
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrong-password' })
      .expect(401);
    const b = await h
      .http()
      .post('/api/auth/login')
      .send({ email: 'nobody@auth.test', password: 'wrong-password' })
      .expect(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it.each([
    '/quotations',
    '/invoices',
    '/payments',
    '/clients',
    '/document-templates',
    '/dashboard/metrics',
    '/settings',
  ])('blocks %s without a token', async (path) => {
    await h.http().get(`/api${path}`).expect(401);
  });

  it('rejects a forged token', async () => {
    await h
      .as('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4IiwiYWdlbmN5SWQiOiJ4In0.invalid')
      .get('/quotations')
      .expect(401);
  });

  it('validates registration input', async () => {
    const res = await h
      .http()
      .post('/api/auth/register')
      .send({ agencyName: '', name: 'x', email: 'bad', password: 'short' })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('email')]),
    );
  });
});
