import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const animes = pgTable("animes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  releaseDate: text("release_date").notNull(),
  studio: text("studio").notNull(),
  genre: text("genre").array().notNull().default(sql`'{}'::text[]`),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  gallery: text("gallery").array().notNull().default(sql`'{}'::text[]`),
  episodes: integer("episodes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const animeEpisodes = pgTable("anime_episodes", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const genres = pgTable("genres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const studios = pgTable("studios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnimeSchema = createInsertSchema(animes).omit({
  id: true,
  createdAt: true,
});

export const insertAnimeEpisodeSchema = createInsertSchema(animeEpisodes).omit({
  id: true,
  createdAt: true,
});

export const insertGenreSchema = createInsertSchema(genres).omit({
  id: true,
});

export const insertStudioSchema = createInsertSchema(studios).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Anime = typeof animes.$inferSelect;

export type InsertAnimeEpisode = z.infer<typeof insertAnimeEpisodeSchema>;
export type AnimeEpisode = typeof animeEpisodes.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertStudio = z.infer<typeof insertStudioSchema>;
export type Studio = typeof studios.$inferSelect;
