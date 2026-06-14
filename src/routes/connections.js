import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { findConnectionBetween } from "../utils/conversations.js";
import { getBlockedUserIdsForUser, hasBlockBetween } from "../utils/blocks.js";
import { getOtherUserId, toPublicUserCard } from "../utils/users.js";

export const connectionsRouter = Router();

connectionsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = String(req.body.targetUserId || "");

    if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot connect with yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });
    if (await hasBlockBetween(req.user.sub, targetUserId)) {
      return res.status(403).json({ error: "You cannot connect with this user." });
    }

    const existing = await findConnectionBetween(req.user.sub, targetUserId);
    const connection = existing
      ? await prisma.connection.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        })
      : await prisma.connection.create({
          data: {
            requesterId: req.user.sub,
            recipientId: targetUserId,
            status: "ACCEPTED",
          },
        });

    await prisma.conversation.upsert({
      where: { connectionId: connection.id },
      create: { connectionId: connection.id },
      update: {},
    });

    return res.status(201).json({
      id: connection.id,
      targetUserId,
      status: connection.status.toLowerCase(),
      createdAt: connection.createdAt,
    });
  } catch (error) {
    return next(error);
  }
});

connectionsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const blockedUserIds = await getBlockedUserIdsForUser(req.user.sub);
    const connections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: req.user.sub }, { recipientId: req.user.sub }],
      },
      include: {
        requester: {
          include: {
            profile: true,
            photos: true,
          },
        },
        recipient: {
          include: {
            profile: true,
            photos: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const users = connections
      .filter((connection) => {
        const otherUserId = getOtherUserId(connection, req.user.sub);
        return !blockedUserIds.has(otherUserId);
      })
      .map((connection) => {
        const otherUserId = getOtherUserId(connection, req.user.sub);
        const otherUser =
          connection.requesterId === otherUserId ? connection.requester : connection.recipient;

        return {
          connectionId: connection.id,
          status: connection.status.toLowerCase(),
          user: toPublicUserCard(req, otherUser),
        };
      });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
});
