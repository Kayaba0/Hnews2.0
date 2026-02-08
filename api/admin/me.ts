import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import cookie from "cookie";

/**
 * GET /api/admin/me
 * Returns { isAdmin: boolean }
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.status(200).json({ isAdmin: false });

  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.hnews_admin;
  if (!token) return res.status(200).json({ isAdmin: false });

  try {
    const payload = jwt.verify(token, secret) as any;
    return res.status(200).json({ isAdmin: payload?.role === "admin" });
  } catch {
    return res.status(200).json({ isAdmin: false });
  }
}
