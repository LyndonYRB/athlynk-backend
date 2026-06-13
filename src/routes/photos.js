import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { formatPhotoUrl } from "../utils/users.js";

export const photosRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "..", "..", "uploads");

function serializePhoto(req, photo) {
  return {
    id: photo.id,
    url: formatPhotoUrl(req, photo.url),
    position: photo.sortOrder,
  };
}

photosRouter.post("/", requireAuth, upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Photo file is required" });

    const count = await prisma.photo.count({
      where: { userId: req.user.sub },
    });

    const photo = await prisma.photo.create({
      data: {
        userId: req.user.sub,
        url: `/uploads/${req.file.filename}`,
        sortOrder: count,
      },
    });

    return res.status(201).json(serializePhoto(req, photo));
  } catch (error) {
    return next(error);
  }
});

photosRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const photo = await prisma.photo.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.sub,
      },
    });

    if (!photo) return res.status(404).json({ error: "Photo not found" });

    await prisma.photo.delete({
      where: { id: photo.id },
    });

    const filename = path.basename(photo.url);
    await fs.rm(path.join(uploadDir, filename), { force: true });

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});
