import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const swipesRouter = Router();

const ACTIONS = {
  pass: "PASS",
  like: "LIKE",
  super_like: "SUPER_LIKE",
};

swipesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = String(req.body.targetUserId || "");
    const action = ACTIONS[String(req.body.action || "")];

    if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });
    if (!action) return res.status(400).json({ error: "Invalid swipe action" });
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot swipe on yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });

    const swipe = await prisma.swipe.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: req.user.sub,
          toUserId: targetUserId,
        },
      },
      create: {
        fromUserId: req.user.sub,
        toUserId: targetUserId,
        action,
      },
      update: {
        action,
      },
    });

    return res.status(201).json({
      id: swipe.id,
      targetUserId: swipe.toUserId,
      action: req.body.action,
      createdAt: swipe.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});
