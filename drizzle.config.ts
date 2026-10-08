import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://pazarentegra:pazarentegra@localhost:5432/pazarentegra',
  },
});
