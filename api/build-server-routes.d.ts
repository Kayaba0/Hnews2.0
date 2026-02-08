declare module "../build/server/routes.js" {
  import type { Express } from "express";
  export function registerRoutes(app: Express): void;
}
