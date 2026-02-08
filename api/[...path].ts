import express from "express";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { registerRoutes } from "../build/server/routes.js";

const app = express();

// body limits: your app uploads images as base64 / multipart via backend endpoints
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// --- Debug / health (helps verify the deployed commit & route registration) ---
app.get("/api/__health", (_req, res) => {
  res.json({
    ok: true,
    from: "catchall",
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_REF ||
      process.env.GIT_COMMIT ||
      "unknown",
    deployment: process.env.VERCEL_URL || "unknown",
    nodeEnv: process.env.NODE_ENV || "unknown",
  });
});

app.get("/api/__debug/routes", (_req, res) => {
  const stack = (app as any)?._router?.stack ?? [];
  const routes: Array<{ method: string; path: string }> = [];
  for (const layer of stack) {
    if (!layer?.route) continue;
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods || {});
    for (const m of methods) routes.push({ method: m.toUpperCase(), path });
  }
  res.json({ ok: true, count: routes.length, routes });
});

// --- Admin auth endpoints are defined HERE to avoid any build/rewire edge cases ---
function setAdminCookie(res: express.Response, token: string) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("hnews_admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }),
  );
}

app.post("/api/admin/login", (req, res) => {
  const pwd = (req.body?.password ?? "").toString();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) return res.status(500).json({ error: "ADMIN_PASSWORD not set" });
  if (pwd !== expected) return res.status(401).json({ error: "Invalid credentials" });

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "ADMIN_JWT_SECRET not set" });

  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "7d" });
  setAdminCookie(res, token);
  return res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.json({ isAdmin: false });

  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.hnews_admin;
  if (!token) return res.json({ isAdmin: false });

  try {
    jwt.verify(token, secret);
    return res.json({ isAdmin: true });
  } catch {
    return res.json({ isAdmin: false });
  }
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("hnews_admin", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    }),
  );
  return res.json({ ok: true });
});

// Register the rest of the API routes (animes, upload, etc.)
registerRoutes(app);

export default app;
