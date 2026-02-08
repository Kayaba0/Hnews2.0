import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import cookie from "cookie";

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets httpOnly cookie "hnews_admin".
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const pwd = (req.body as any)?.password?.toString?.() ?? "";
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: "ADMIN_PASSWORD not set" });
  if (pwd !== expected) return res.status(401).json({ error: "Invalid credentials" });

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "ADMIN_JWT_SECRET not set" });

  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "7d" });

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("hnews_admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );

  return res.status(200).json({ ok: true });
}
