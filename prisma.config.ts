import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// `prisma generate` does not connect to the DB — a placeholder is enough on Vercel install
// when DATABASE_URL is not configured yet. Runtime uses the real URL from Vercel env.
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
