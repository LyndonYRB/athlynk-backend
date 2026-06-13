import { prisma } from "../config/prisma.js";

export async function findConnectionBetween(userId, targetUserId) {
  return prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: userId, recipientId: targetUserId },
        { requesterId: targetUserId, recipientId: userId },
      ],
    },
    include: {
      conversation: true,
    },
  });
}

export async function getOrCreateConversation(userId, targetUserId) {
  let connection = await findConnectionBetween(userId, targetUserId);

  if (!connection) {
    connection = await prisma.connection.create({
      data: {
        requesterId: userId,
        recipientId: targetUserId,
        status: "ACCEPTED",
      },
      include: {
        conversation: true,
      },
    });
  } else if (connection.status !== "ACCEPTED") {
    connection = await prisma.connection.update({
      where: { id: connection.id },
      data: { status: "ACCEPTED" },
      include: {
        conversation: true,
      },
    });
  }

  if (connection.conversation) return connection.conversation;

  return prisma.conversation.create({
    data: {
      connectionId: connection.id,
    },
  });
}
