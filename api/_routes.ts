import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer from "multer";
import { 
  insertAnimeSchema, 
  insertAnimeEpisodeSchema, 
  insertGenreSchema, 
  insertStudioSchema 
} from "@shared/schema";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import cookie from "cookie";

// Config Cloudinary
if (!process.env.CLOUDINARY_URL) {
  console.warn("Warning: CLOUDINARY_URL not set. Image uploads will not work.");
}
cloudinary.config({ secure: true });

// ================= AUTH (cookie JWT OR Bearer token) =================
// For the /admin UI we authenticate via an HttpOnly cookie (JWT).
// For manual tools (Postman/curl) we also allow: Authorization: Bearer <ADMIN_TOKEN>
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // 1) Cookie JWT (preferred for the website)
  const secret = process.env.ADMIN_JWT_SECRET;
  if (secret) {
    try {
      const cookies = cookie.parse(req.headers.cookie || "");
      const jwtToken = cookies.hnews_admin;
      if (jwtToken) {
        jwt.verify(jwtToken, secret);
        return next();
      }
    } catch {
      // fall through to bearer token
    }
  }

  // 2) Bearer token (fallback for tooling)
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (process.env.ADMIN_TOKEN && bearer === process.env.ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}



export function registerRoutes(app: Express): void {
  // ================= ADMIN AUTH =================
  // Login with JSON body: { "password": "..." } (optionally also "username")
  app.post("/api/admin/login", (req, res) => {
    const pwd = (req.body?.password ?? "").toString();
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }),
    );

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

  // ================= ANIMES =================
  app.get("/api/animes", async (_req, res) => {
    try {
      const animes = await storage.getAllAnimes();
      res.json(animes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch animes" });
    }
  });

  app.get("/api/animes/:id", async (req, res) => {
    try {
      const anime = await storage.getAnime(req.params.id);
      if (!anime) return res.status(404).json({ error: "Anime not found" });
      res.json(anime);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch anime" });
    }
  });

  app.post("/api/animes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertAnimeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.errors);

      const anime = await storage.createAnime(parsed.data);
      res.status(201).json(anime);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create anime" });
    }
  });

  app.patch("/api/animes/:id", requireAdmin, async (req, res) => {
    try {
      const anime = await storage.updateAnime(req.params.id, req.body);
      if (!anime) return res.status(404).json({ error: "Anime not found" });
      res.json(anime);
    } catch (err) {
      res.status(500).json({ error: "Failed to update anime" });
    }
  });

  app.delete("/api/animes/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteAnime(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Anime not found" });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete anime" });
    }
  });

  // ================= EPISODES =================
  app.get("/api/episodes", async (_req, res) => {
    try {
      const episodes = await storage.getAllEpisodes();
      res.json(episodes);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const episode = await storage.getEpisode(req.params.id);
      if (!episode) return res.status(404).json({ error: "Episode not found" });
      res.json(episode);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch episode" });
    }
  });

  app.get("/api/animes/:animeId/episodes", async (req, res) => {
    try {
      const episodes = await storage.getEpisodesByAnimeId(req.params.animeId);
      res.json(episodes);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  app.post("/api/episodes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertAnimeEpisodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.errors);

      const episode = await storage.createEpisode(parsed.data);
      res.status(201).json(episode);
    } catch (err) {
      res.status(500).json({ error: "Failed to create episode" });
    }
  });

  app.patch("/api/episodes/:id", requireAdmin, async (req, res) => {
    try {
      const episode = await storage.updateEpisode(req.params.id, req.body);
      if (!episode) return res.status(404).json({ error: "Episode not found" });
      res.json(episode);
    } catch (err) {
      res.status(500).json({ error: "Failed to update episode" });
    }
  });

  app.delete("/api/episodes/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEpisode(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Episode not found" });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete episode" });
    }
  });

  // ================= GENRES =================
  app.get("/api/genres", async (_req, res) => {
    try {
      const genresList = await storage.getAllGenres();
      res.json(genresList);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });

  app.post("/api/genres", requireAdmin, async (req, res) => {
    try {
      const parsed = insertGenreSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.errors);

      const genre = await storage.createGenre(parsed.data);
      res.status(201).json(genre);
    } catch (err) {
      res.status(500).json({ error: "Failed to create genre" });
    }
  });

  app.patch("/api/genres/:id", requireAdmin, async (req, res) => {
    try {
      const genre = await storage.updateGenre(req.params.id, req.body);
      if (!genre) return res.status(404).json({ error: "Genre not found" });
      res.json(genre);
    } catch (err) {
      res.status(500).json({ error: "Failed to update genre" });
    }
  });

  app.delete("/api/genres/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteGenre(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Genre not found" });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete genre" });
    }
  });

  // ================= STUDIOS =================
  app.get("/api/studios", async (_req, res) => {
    try {
      const studiosList = await storage.getAllStudios();
      res.json(studiosList);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch studios" });
    }
  });

  app.post("/api/studios", requireAdmin, async (req, res) => {
    try {
      const parsed = insertStudioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.errors);

      const studio = await storage.createStudio(parsed.data);
      res.status(201).json(studio);
    } catch (err) {
      res.status(500).json({ error: "Failed to create studio" });
    }
  });

  app.patch("/api/studios/:id", requireAdmin, async (req, res) => {
    try {
      const studio = await storage.updateStudio(req.params.id, req.body);
      if (!studio) return res.status(404).json({ error: "Studio not found" });
      res.json(studio);
    } catch (err) {
      res.status(500).json({ error: "Failed to update studio" });
    }
  });

  app.delete("/api/studios/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteStudio(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Studio not found" });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete studio" });
    }
  });

// ================= CLOUDINARY UPLOAD (IMAGE + VIDEO) =================


const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    // ✅ Caso 1: multipart/form-data (video o immagine)
    if (req.file) {
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "anirelease",
            resource_type: "auto", // ✅ importante per i video (e audio)
          },
          (err, uploadResult) => {
            if (err) return reject(err);
            resolve(uploadResult);
          }
        );

        stream.end(req.file!.buffer);
      });

      return res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // ✅ Caso 2: fallback vecchio (base64 JSON)
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No file or image provided" });

    const result = await cloudinary.uploader.upload(image, {
      folder: "anirelease",
      resource_type: "image",
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});
}
