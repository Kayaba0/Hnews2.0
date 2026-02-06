import express from "express";
import "dotenv/config";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

registerRoutes(app);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`[local] API listening on http://localhost:${port}`);
});
