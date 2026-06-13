import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const blocksRouter = Router();

blocksRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = String(req.body.targetUserId || "");

    if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot block yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });

    const block = await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.sub,
          blockedId: targetUserId,
        },
      },
      create: {
        blockerId: req.user.sub,
        blockedId: targetUserId,
      },
      update: {},
    });

    return res.status(201).json({
      id: block.id,
      targetUserId: block.blockedId,
      createdAt: block.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});
