import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Per compatibilità ESM, ricaviamo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // Qui puntiamo alla cartella della build frontend
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to run "npm run build" first.`,
    );
  }

  // Serve file statici dal dist
  app.use(express.static(distPath));

  // Fall back a index.html per SPA (React, Vue, ecc.)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
