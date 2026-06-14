import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getBlockedUserIdsForUser } from "../utils/blocks.js";
import { parseList, toPublicUserCard } from "../utils/users.js";

export const discoverRouter = Router();

function matchesFilters(user, filters) {
  const profile = user.profile;
  if (!profile) return false;

  if (filters.activities.length) {
    const hasActivity = profile.interests.some((item) => filters.activities.includes(item));
    if (!hasActivity) return false;
  }

  if (filters.skill && filters.skill !== "any" && profile.skill !== filters.skill) return false;
  if (filters.gender && filters.gender !== "any" && profile.gender !== filters.gender) return false;
  if (filters.ageMin !== null && (profile.age ?? 0) < filters.ageMin) return false;
  if (filters.ageMax !== null && (profile.age ?? 999) > filters.ageMax) return false;

  if (filters.availability.length) {
    const hasAvailability = profile.availability.some((item) =>
      filters.availability.includes(item)
    );
    if (!hasAvailability) return false;
  }

  return true;
}

discoverRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const excludedIds = await getBlockedUserIdsForUser(req.user.sub);
    excludedIds.add(req.user.sub);

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(excludedIds),
        },
      },
      include: {
        profile: true,
        photos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const filters = {
      activities: parseList(req.query.activities),
      skill: req.query.skill ? String(req.query.skill) : null,
      ageMin: req.query.ageMin ? Number(req.query.ageMin) : null,
      ageMax: req.query.ageMax ? Number(req.query.ageMax) : null,
      gender: req.query.gender ? String(req.query.gender) : null,
      availability: parseList(req.query.availability),
    };

    const cards = users
      .filter((user) => matchesFilters(user, filters))
      .map((user, index) => toPublicUserCard(req, user, index + 1));

    return res.json(cards);
  } catch (error) {
    return next(error);
  }
});
