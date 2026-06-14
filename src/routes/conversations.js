import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getBlockedUserIdsForUser, hasBlockBetween } from "../utils/blocks.js";
import { getOrCreateConversation } from "../utils/conversations.js";
import { getOtherUserId, toPublicUserCard } from "../utils/users.js";

export const conversationsRouter = Router();

function serializeMessage(message, toUserId) {
  return {
    id: message.id,
    fromUserId: message.senderId,
    toUserId: message.receiverId || toUserId,
    text: message.text,
    createdAt: message.createdAt,
  };
}

conversationsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const blockedUserIds = await getBlockedUserIdsForUser(req.user.sub);
    const conversations = await prisma.conversation.findMany({
      where: {
        connection: {
          status: "ACCEPTED",
          OR: [{ requesterId: req.user.sub }, { recipientId: req.user.sub }],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        connection: {
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
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const list = conversations
      .filter((conversation) => {
        const otherUserId = getOtherUserId(conversation.connection, req.user.sub);
        return !blockedUserIds.has(otherUserId);
      })
      .map((conversation) => {
        const otherUserId = getOtherUserId(conversation.connection, req.user.sub);
        const otherUser =
          conversation.connection.requesterId === otherUserId
            ? conversation.connection.requester
            : conversation.connection.recipient;
        const lastMessage = conversation.messages[0] || null;

        return {
          id: conversation.id,
          userId: otherUserId,
          user: toPublicUserCard(req, otherUser),
          lastMessage: lastMessage ? serializeMessage(lastMessage, otherUserId) : null,
          updatedAt: conversation.updatedAt,
        };
      });

    return res.json(list);
  } catch (error) {
    return next(error);
  }
});

conversationsRouter.get("/:userId/messages", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot open a conversation with yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });
    if (await hasBlockBetween(req.user.sub, targetUserId)) {
      return res.status(403).json({ error: "You cannot open this conversation." });
    }

    const conversation = await getOrCreateConversation(req.user.sub, targetUserId);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });

    return res.json(messages.map((message) => serializeMessage(message, targetUserId)));
  } catch (error) {
    return next(error);
  }
});

conversationsRouter.post("/:userId/messages", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const text = String(req.body.text || "").trim();

    if (!text) return res.status(400).json({ error: "Message text is required" });
    if (targetUserId === req.user.sub) {
      return res.status(400).json({ error: "You cannot message yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: "Target user not found" });
    if (await hasBlockBetween(req.user.sub, targetUserId)) {
      return res.status(403).json({ error: "You cannot message this user." });
    }

    const conversation = await getOrCreateConversation(req.user.sub, targetUserId);

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.sub,
        receiverId: targetUserId,
        text,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json(serializeMessage(message, targetUserId));
  } catch (error) {
    return next(error);
  }
});
