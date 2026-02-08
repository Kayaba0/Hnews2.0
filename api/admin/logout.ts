import type { VercelRequest, VercelResponse } from "@vercel/node";
import cookie from "cookie";

/**
 * POST /api/admin/logout
 * Clears cookie.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("hnews_admin", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    })
  );

  return res.status(200).json({ ok: true });
}
