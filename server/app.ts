import express from "express";
import type { AnyDb } from "./db/seed";
import { createRequireAuth } from "./middleware/auth";
import { createTenantStores } from "./services/eventStore";
import { createAuthRouter } from "./routes/auth";
import { createHealthRouter } from "./routes/health";
import { createWebhooksRouter } from "./routes/webhooks";
import { createOrdersRouter } from "./routes/orders";
import { createAiRouter } from "./routes/ai";
import { createIntegrationsRouter } from "./routes/integrations";
import { createMarketplaceAccountsRouter } from "./routes/marketplaceAccounts";

// Creates the Express app with its own in-memory stores, so tests get isolated state.
export function createApp({ db }: { db: AnyDb }) {
  const app = express();
  app.use(express.json());

  const stores = createTenantStores();

  // Public routes come first; everything mounted after requireAuth needs a session.
  app.use(createHealthRouter());
  app.use(createAuthRouter(db));
  app.use("/api", createRequireAuth(db));

  app.use(createOrdersRouter(stores));
  app.use(createWebhooksRouter(stores));
  app.use(createAiRouter());
  app.use(createIntegrationsRouter());
  app.use(createMarketplaceAccountsRouter(db));

  return app;
}
