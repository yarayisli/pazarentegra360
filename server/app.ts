import express from "express";
import { createEventStore } from "./services/eventStore";
import { createHealthRouter } from "./routes/health";
import { createWebhooksRouter } from "./routes/webhooks";
import { createOrdersRouter } from "./routes/orders";
import { createAiRouter } from "./routes/ai";
import { createIntegrationsRouter } from "./routes/integrations";

// Creates the Express app with its own in-memory stores, so tests get isolated state.
export function createApp() {
  const app = express();
  app.use(express.json());

  const store = createEventStore();

  app.use(createHealthRouter());
  app.use(createOrdersRouter(store));
  app.use(createWebhooksRouter(store));
  app.use(createAiRouter());
  app.use(createIntegrationsRouter());

  return app;
}
