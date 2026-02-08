import express from "express";
import type { Request, Response } from "express";
import { registerRoutes } from "../build/server/routes.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Debug + health endpoints (safe to keep; no secrets returned)
app.get("/api/__health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    from: "catchall",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null,
    deployment: process.env.VERCEL_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
  });
});

app.get("/api/__debug/routes", (_req: Request, res: Response) => {
  const stack = (app as any)?._router?.stack ?? [];
  const routes: Array<{ method: string; path: string }> = [];

  for (const layer of stack) {
    if (!layer) continue;
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {});
      for (const m of methods) routes.push({ method: m.toUpperCase(), path });
    }
  }

  routes.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));
  res.json({ ok: true, count: routes.length, routes });
});

// Register all API routes (animes, admin, upload, etc.)
registerRoutes(app);

export default app;
