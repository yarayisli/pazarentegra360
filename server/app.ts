import express from "express";
import type { PgBoss } from "pg-boss";
import type { AnyDb } from "./db/seed";
import { createRequireAuth } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth";
import { createHealthRouter } from "./routes/health";
import { createWebhooksRouter } from "./routes/webhooks";
import { createOrdersRouter } from "./routes/orders";
import { createAiRouter, type AiRouterOptions } from "./routes/ai";
import { createIntegrationsRouter } from "./routes/integrations";
import { createMarketplaceAccountsRouter } from "./routes/marketplaceAccounts";
import { createJobsRouter } from "./routes/jobs";
import { createAuditRouter } from "./routes/audit";
import { createPendingActionsRouter } from "./routes/pendingActions";
import type { AdapterResolver } from "./services/pendingActions";
import { apiNotFound, errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";

// Creates the Express app; all state lives in `db`, so tests get isolated state per database.
export function createApp({
  db,
  boss,
  ai,
  resolveAdapter,
}: {
  db: AnyDb;
  boss?: PgBoss;
  ai?: AiRouterOptions;
  resolveAdapter?: AdapterResolver;
}) {
  const app = express();
  app.use(requestContext());
  app.use(express.json());

  // Public routes come first; everything mounted after requireAuth needs a session.
  app.use(createHealthRouter());
  app.use(createAuthRouter(db));
  app.use("/api", createRequireAuth(db));

  app.use(createOrdersRouter(db));
  app.use(createWebhooksRouter(db));
  app.use(createAiRouter(db, ai));
  app.use(createIntegrationsRouter());
  app.use(createMarketplaceAccountsRouter(db));
  app.use(createJobsRouter(boss));
  app.use(createPendingActionsRouter(db, resolveAdapter));
  app.use(createAuditRouter(db));

  app.use("/api", apiNotFound);
  app.use(errorHandler);

  return app;
}
