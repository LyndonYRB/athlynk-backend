import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { blocksRouter } from "./routes/blocks.js";
import { connectionsRouter } from "./routes/connections.js";
import { conversationsRouter } from "./routes/conversations.js";
import { discoverRouter } from "./routes/discover.js";
import { meRouter } from "./routes/me.js";
import { photosRouter } from "./routes/photos.js";
import { preferencesRouter } from "./routes/preferences.js";
import { profileRouter } from "./routes/profile.js";
import { reportsRouter } from "./routes/reports.js";
import { swipesRouter } from "./routes/swipes.js";
import { usersRouter } from "./routes/users.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "..", "uploads");

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsPath));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Athlynk backend is running" });
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/profile", profileRouter);
app.use("/preferences", preferencesRouter);
app.use("/photos", photosRouter);
app.use("/discover", discoverRouter);
app.use("/users", usersRouter);
app.use("/swipes", swipesRouter);
app.use("/connections", connectionsRouter);
app.use("/conversations", conversationsRouter);
app.use("/blocks", blocksRouter);
app.use("/reports", reportsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
