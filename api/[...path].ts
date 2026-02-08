import express from "express";
import { registerRoutes } from "../build/server/routes.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.get("/api/__health", (_req, res) => {
  res.json({ ok: true, from: "catchall" });
});

registerRoutes(app);

app.get("/api/__routes", (_req, res) => {
  res.json({ ok: true });
});

export default app;
