var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  animeEpisodes: () => animeEpisodes,
  animes: () => animes,
  genres: () => genres,
  insertAnimeEpisodeSchema: () => insertAnimeEpisodeSchema,
  insertAnimeSchema: () => insertAnimeSchema,
  insertGenreSchema: () => insertGenreSchema,
  insertStudioSchema: () => insertStudioSchema,
  insertUserSchema: () => insertUserSchema,
  studios: () => studios,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var animes = pgTable("animes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  releaseDate: text("release_date").notNull(),
  studio: text("studio").notNull(),
  genre: text("genre").array().notNull().default(sql`'{}'::text[]`),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  gallery: text("gallery").array().notNull().default(sql`'{}'::text[]`),
  episodes: integer("episodes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var animeEpisodes = pgTable("anime_episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  animeId: varchar("anime_id").notNull(),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  releaseDate: text("release_date").notNull(),
  coverImage: text("cover_image").notNull(),
  description: text("description"),
  gallery: text("gallery").array().default(sql`'{}'::text[]`),
  trailerUrl: text("trailer_url"),
  genre: text("genre").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var genres = pgTable("genres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique()
});
var studios = pgTable("studios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertAnimeSchema = createInsertSchema(animes).omit({
  id: true,
  createdAt: true
});
var insertAnimeEpisodeSchema = createInsertSchema(animeEpisodes).omit({
  id: true,
  createdAt: true
});
var insertGenreSchema = createInsertSchema(genres).omit({
  id: true
});
var insertStudioSchema = createInsertSchema(studios).omit({
  id: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";
neonConfig.webSocketConstructor = ws;
var databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?");
}
var pool = new Pool({ connectionString: databaseUrl });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Animes
  async getAllAnimes() {
    return await db.select().from(animes);
  }
  async getAnime(id) {
    const [anime] = await db.select().from(animes).where(eq(animes.id, id));
    return anime;
  }
  async createAnime(anime) {
    const [created] = await db.insert(animes).values(anime).returning();
    return created;
  }
  async updateAnime(id, anime) {
    const [updated] = await db.update(animes).set(anime).where(eq(animes.id, id)).returning();
    return updated;
  }
  async deleteAnime(id) {
    const result = await db.delete(animes).where(eq(animes.id, id)).returning();
    return result.length > 0;
  }
  // Episodes
  async getAllEpisodes() {
    return await db.select().from(animeEpisodes);
  }
  async getEpisode(id) {
    const [episode] = await db.select().from(animeEpisodes).where(eq(animeEpisodes.id, id));
    return episode;
  }
  async getEpisodesByAnimeId(animeId) {
    return await db.select().from(animeEpisodes).where(eq(animeEpisodes.animeId, animeId));
  }
  async createEpisode(episode) {
    const [created] = await db.insert(animeEpisodes).values(episode).returning();
    return created;
  }
  async updateEpisode(id, episode) {
    const [updated] = await db.update(animeEpisodes).set(episode).where(eq(animeEpisodes.id, id)).returning();
    return updated;
  }
  async deleteEpisode(id) {
    const result = await db.delete(animeEpisodes).where(eq(animeEpisodes.id, id)).returning();
    return result.length > 0;
  }
  // Genres
  async getAllGenres() {
    return await db.select().from(genres);
  }
  async createGenre(genre) {
    const [created] = await db.insert(genres).values(genre).returning();
    return created;
  }
  async updateGenre(id, genre) {
    const [updated] = await db.update(genres).set(genre).where(eq(genres.id, id)).returning();
    return updated;
  }
  async deleteGenre(id) {
    const result = await db.delete(genres).where(eq(genres.id, id)).returning();
    return result.length > 0;
  }
  // Studios
  async getAllStudios() {
    return await db.select().from(studios);
  }
  async createStudio(studio) {
    const [created] = await db.insert(studios).values(studio).returning();
    return created;
  }
  async updateStudio(id, studio) {
    const [updated] = await db.update(studios).set(studio).where(eq(studios.id, id)).returning();
    return updated;
  }
  async deleteStudio(id) {
    const result = await db.delete(studios).where(eq(studios.id, id)).returning();
    return result.length > 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import cookie from "cookie";
if (!process.env.CLOUDINARY_URL) {
  console.warn("Warning: CLOUDINARY_URL not set. Image uploads will not work.");
}
cloudinary.config({ secure: true });
function requireAdmin(req, res, next) {
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
    }
  }
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (process.env.ADMIN_TOKEN && bearer === process.env.ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}
function registerRoutes(app) {
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
        maxAge: 60 * 60 * 24 * 7
        // 7 days
      })
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
        expires: /* @__PURE__ */ new Date(0)
      })
    );
    return res.json({ ok: true });
  });
  app.get("/api/animes", async (_req, res) => {
    try {
      const animes2 = await storage.getAllAnimes();
      res.json(animes2);
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
  const upload = multer({ storage: multer.memoryStorage() });
  app.post("/api/upload", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (req.file) {
        const result2 = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "anirelease",
              resource_type: "auto"
              // ✅ importante per i video (e audio)
            },
            (err, uploadResult) => {
              if (err) return reject(err);
              resolve(uploadResult);
            }
          );
          stream.end(req.file.buffer);
        });
        return res.json({
          url: result2.secure_url,
          publicId: result2.public_id
        });
      }
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "No file or image provided" });
      const result = await cloudinary.uploader.upload(image, {
        folder: "anirelease",
        resource_type: "image"
      });
      return res.json({
        url: result.secure_url,
        publicId: result.public_id
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  });
}
export {
  registerRoutes
};
