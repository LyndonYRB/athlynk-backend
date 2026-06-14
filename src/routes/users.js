import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { hasBlockBetween } from "../utils/blocks.js";
import { toPublicUserCard } from "../utils/users.js";

export const usersRouter = Router();

usersRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.sub && (await hasBlockBetween(req.user.sub, req.params.id))) {
      return res.status(403).json({ error: "You cannot view this profile." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        photos: true,
      },
    });

    if (!user || !user.profile) return res.status(404).json({ error: "User not found" });

    return res.json(toPublicUserCard(req, user));
  } catch (error) {
    return next(error);
  }
});
