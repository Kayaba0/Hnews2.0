import express from "express";
// @ts-ignore - generated at install/build time by tsup
import { registerRoutes } from "../build/server/routes.js";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

registerRoutes(app);

export default app;
