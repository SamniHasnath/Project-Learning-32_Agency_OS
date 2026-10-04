import 'dotenv/config';
import { execSync } from 'node:child_process';

/** Applies migrations to the dedicated test database once before the e2e run. */
export default function globalSetup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('TEST_DATABASE_URL must be set to run e2e tests');
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL — e2e tests wipe the test database');
  }
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: testUrl } });
}
