import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = String(req.body.targetUserId || "");
    const reason = String(req.body.reason || "").trim();
    const details = req.body.details ? String(req.body.details).trim() : null;

    if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });
    if (!reason) return res.status(400).json({ error: "Report reason is required" });
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot report yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.sub,
        targetId: targetUserId,
        reason,
        details,
      },
    });

    return res.status(201).json({
      id: report.id,
      targetUserId: report.targetId,
      reason: report.reason,
      details: report.details,
      createdAt: report.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});
