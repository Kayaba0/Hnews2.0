import express from "express";
import { registerRoutes } from "../build/server/routes.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Health check to confirm which deployment you're hitting
app.get("/api/__health", (_req, res) => {
  res.json({
    ok: true,
    from: "catchall",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    deployment: process.env.VERCEL_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
  });
});

registerRoutes(app);

// Dump registered routes (useful to debug 404s in production)
app.get("/api/__debug/routes", (_req, res) => {
  // Express keeps routes in app._router.stack
  const stack = (app as any)?._router?.stack ?? [];
  const routes: Array<{ method: string; path: string }> = [];

  for (const layer of stack) {
    if (layer?.route?.path && layer?.route?.methods) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]);
      for (const method of methods) routes.push({ method: method.toUpperCase(), path });
    }
  }

  routes.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));
  res.json({ ok: true, count: routes.length, routes });
});

export default app;
