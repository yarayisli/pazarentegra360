import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client.ts';
import { seedDemo } from './seed.ts';

const command = process.argv[2];
const { db, close } = createDb();

try {
  if (command === 'migrate') {
    await migrate(db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname });
    console.log('Migrations applied.');
  } else if (command === 'seed') {
    const { tenantId } = await seedDemo(db);
    console.log(`Demo tenant seeded: ${tenantId}`);
  } else {
    console.error('Usage: tsx server/db/cli.ts <migrate|seed>');
    process.exitCode = 1;
  }
} finally {
  await close();
}
