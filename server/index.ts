import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createApp } from "./app";
import { getPort } from "./config";
import { createDb, getDatabaseUrl } from "./db/client";
import { createBoss } from "./jobs/queue";

dotenv.config();

const { db } = createDb();
const boss = createBoss(getDatabaseUrl(), "api");
const app = createApp({ db, boss });
const PORT = getPort();

async function startServer() {
  boss.on("error", (err) => console.error("[job] pg-boss error", err));
  await boss.start().catch((err) => console.error("[job] queue unavailable; /api/jobs will fail", err));
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
