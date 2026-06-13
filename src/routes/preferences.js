import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_PREFERENCES } from "./auth.js";

export const preferencesRouter = Router();

function toIntOrDefault(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function toStringArray(value, fallback = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

async function getOrCreatePreferences(userId) {
  return prisma.preference.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
    },
    update: {},
  });
}

preferencesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const preferences = await getOrCreatePreferences(req.user.sub);
    return res.json({ preferences });
  } catch (error) {
    return next(error);
  }
});

preferencesRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const current = await getOrCreatePreferences(req.user.sub);

    const preferences = await prisma.preference.update({
      where: { userId: req.user.sub },
      data: {
        preferredActivities: toStringArray(
          req.body.preferredActivities,
          current.preferredActivities
        ),
        genderPref:
          req.body.genderPref === undefined ? current.genderPref : String(req.body.genderPref),
        ageMin: toIntOrDefault(req.body.ageMin, current.ageMin),
        ageMax: toIntOrDefault(req.body.ageMax, current.ageMax),
        radius: toIntOrDefault(req.body.radius, current.radius),
        availabilityFilterOn:
          req.body.availabilityFilterOn === undefined
            ? current.availabilityFilterOn
            : Boolean(req.body.availabilityFilterOn),
        availabilityPref: toStringArray(req.body.availabilityPref, current.availabilityPref),
        skillPref:
          req.body.skillPref === undefined ? current.skillPref : String(req.body.skillPref),
      },
    });

    return res.json({ preferences });
  } catch (error) {
    return next(error);
  }
});
