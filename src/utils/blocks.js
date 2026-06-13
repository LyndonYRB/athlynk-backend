import { prisma } from "../config/prisma.js";

export function blockBetweenWhere(userId, targetUserId) {
  return {
    OR: [
      { blockerId: userId, blockedId: targetUserId },
      { blockerId: targetUserId, blockedId: userId },
    ],
  };
}

export async function findBlockBetween(userId, targetUserId) {
  return prisma.block.findFirst({
    where: blockBetweenWhere(userId, targetUserId),
  });
}

export async function hasBlockBetween(userId, targetUserId) {
  const block = await findBlockBetween(userId, targetUserId);
  return Boolean(block);
}

export async function getBlockedUserIdsForUser(userId) {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  return new Set(
    blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId
    )
  );
}
