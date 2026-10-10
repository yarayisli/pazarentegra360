import express from "express";
import type { PgBoss } from "pg-boss";
import type { AnyDb } from "./db/seed";
import { createRequireAuth } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";
import { createHealthRouter } from "./routes/health";
import { createWebhooksRouter } from "./routes/webhooks";
import { createOrdersRouter } from "./routes/orders";
import { createAiRouter } from "./routes/ai";
import { createIntegrationsRouter } from "./routes/integrations";
import { createMarketplaceAccountsRouter } from "./routes/marketplaceAccounts";
import { createJobsRouter } from "./routes/jobs";
import { apiNotFound, errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";

// Creates the Express app; all state lives in `db`, so tests get isolated state per database.
export function createApp({ db, boss }: { db: AnyDb; boss?: PgBoss }) {
  const app = express();
  app.use(requestContext());
  app.use(express.json());

  // Public routes come first; everything mounted after requireAuth needs a session.
  app.use(createHealthRouter());
  app.use(createAuthRouter(db));
  app.use("/api", createRequireAuth(db));

  app.use(createOrdersRouter(db));
  app.use(createWebhooksRouter(db));
  app.use(createAiRouter());
  app.use(createIntegrationsRouter());
  app.use(createMarketplaceAccountsRouter(db));
  app.use(createJobsRouter(boss));

  app.use("/api", apiNotFound);
  app.use(errorHandler);

  return app;
}
