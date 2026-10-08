import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { createApp } from "./app";
import * as schema from "./db/schema";

const migrationsFolder = new URL("./db/migrations", import.meta.url).pathname;

// Test helper: app backed by a fresh embedded Postgres, so tests never share state.
export async function createTestApp() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  const app = createApp({ db });

  // Registers a new tenant and returns a supertest agent that carries its session cookie.
  async function signUp(email = "owner@example.com", password = "correct-horse-battery") {
    const agent = request.agent(app);
    const res = await agent.post("/api/auth/register").send({ email, password, tenantName: `Tenant of ${email}` });
    if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    return agent;
  }

  return { app, db, client, signUp, close: () => client.close() };
}
