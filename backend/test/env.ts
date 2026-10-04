// Loaded by Jest before each e2e test file: point the app at the TEST database.
import 'dotenv/config';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('TEST_DATABASE_URL must be set to run e2e tests');
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_PER_MINUTE = '100000';
