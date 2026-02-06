import { 
  type User, type InsertUser,
  type Anime, type InsertAnime,
  type AnimeEpisode, type InsertAnimeEpisode,
  type Genre, type InsertGenre,
  type Studio, type InsertStudio,
  users, animes, animeEpisodes, genres, studios
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Animes
  getAllAnimes(): Promise<Anime[]>;
  getAnime(id: string): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: string, anime: Partial<InsertAnime>): Promise<Anime | undefined>;
  deleteAnime(id: string): Promise<boolean>;

  // Episodes
  getAllEpisodes(): Promise<AnimeEpisode[]>;
  getEpisode(id: string): Promise<AnimeEpisode | undefined>;
  getEpisodesByAnimeId(animeId: string): Promise<AnimeEpisode[]>;
  createEpisode(episode: InsertAnimeEpisode): Promise<AnimeEpisode>;
  updateEpisode(id: string, episode: Partial<InsertAnimeEpisode>): Promise<AnimeEpisode | undefined>;
  deleteEpisode(id: string): Promise<boolean>;

  // Genres
  getAllGenres(): Promise<Genre[]>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  updateGenre(id: string, genre: Partial<InsertGenre>): Promise<Genre | undefined>;
  deleteGenre(id: string): Promise<boolean>;

  // Studios
  getAllStudios(): Promise<Studio[]>;
  createStudio(studio: InsertStudio): Promise<Studio>;
  updateStudio(id: string, studio: Partial<InsertStudio>): Promise<Studio | undefined>;
  deleteStudio(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Animes
  async getAllAnimes(): Promise<Anime[]> {
    return await db.select().from(animes);
  }

  async getAnime(id: string): Promise<Anime | undefined> {
    const [anime] = await db.select().from(animes).where(eq(animes.id, id));
    return anime;
  }

  async createAnime(anime: InsertAnime): Promise<Anime> {
    const [created] = await db.insert(animes).values(anime).returning();
    return created;
  }

  async updateAnime(id: string, anime: Partial<InsertAnime>): Promise<Anime | undefined> {
    const [updated] = await db.update(animes).set(anime).where(eq(animes.id, id)).returning();
    return updated;
  }

  async deleteAnime(id: string): Promise<boolean> {
    const result = await db.delete(animes).where(eq(animes.id, id)).returning();
    return result.length > 0;
  }

  // Episodes
  async getAllEpisodes(): Promise<AnimeEpisode[]> {
    return await db.select().from(animeEpisodes);
  }

  async getEpisode(id: string): Promise<AnimeEpisode | undefined> {
    const [episode] = await db.select().from(animeEpisodes).where(eq(animeEpisodes.id, id));
    return episode;
  }

  async getEpisodesByAnimeId(animeId: string): Promise<AnimeEpisode[]> {
    return await db.select().from(animeEpisodes).where(eq(animeEpisodes.animeId, animeId));
  }

  async createEpisode(episode: InsertAnimeEpisode): Promise<AnimeEpisode> {
    const [created] = await db.insert(animeEpisodes).values(episode).returning();
    return created;
  }

  async updateEpisode(id: string, episode: Partial<InsertAnimeEpisode>): Promise<AnimeEpisode | undefined> {
    const [updated] = await db.update(animeEpisodes).set(episode).where(eq(animeEpisodes.id, id)).returning();
    return updated;
  }

  async deleteEpisode(id: string): Promise<boolean> {
    const result = await db.delete(animeEpisodes).where(eq(animeEpisodes.id, id)).returning();
    return result.length > 0;
  }

  // Genres
  async getAllGenres(): Promise<Genre[]> {
    return await db.select().from(genres);
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    const [created] = await db.insert(genres).values(genre).returning();
    return created;
  }

  async updateGenre(id: string, genre: Partial<InsertGenre>): Promise<Genre | undefined> {
    const [updated] = await db.update(genres).set(genre).where(eq(genres.id, id)).returning();
    return updated;
  }

  async deleteGenre(id: string): Promise<boolean> {
    const result = await db.delete(genres).where(eq(genres.id, id)).returning();
    return result.length > 0;
  }

  // Studios
  async getAllStudios(): Promise<Studio[]> {
    return await db.select().from(studios);
  }

  async createStudio(studio: InsertStudio): Promise<Studio> {
    const [created] = await db.insert(studios).values(studio).returning();
    return created;
  }

  async updateStudio(id: string, studio: Partial<InsertStudio>): Promise<Studio | undefined> {
    const [updated] = await db.update(studios).set(studio).where(eq(studios.id, id)).returning();
    return updated;
  }

  async deleteStudio(id: string): Promise<boolean> {
    const result = await db.delete(studios).where(eq(studios.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
