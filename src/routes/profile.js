import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const profileRouter = Router();

function toIntOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function buildProfileData(body, existingProfile) {
  const name = body.name === undefined ? existingProfile?.name : String(body.name).trim();

  if (!name) return { error: "Name is required" };

  return {
    data: {
      name,
      age: body.age === undefined ? existingProfile?.age ?? null : toIntOrNull(body.age),
      gender: body.gender === undefined ? existingProfile?.gender ?? null : String(body.gender),
      location:
        body.location === undefined ? existingProfile?.location ?? null : String(body.location),
      skill: body.skill === undefined ? existingProfile?.skill ?? null : String(body.skill),
      availability:
        body.availability === undefined
          ? existingProfile?.availability ?? []
          : toStringArray(body.availability),
      bio: body.bio === undefined ? existingProfile?.bio ?? null : String(body.bio),
      interests:
        body.interests === undefined
          ? existingProfile?.interests ?? []
          : toStringArray(body.interests),
    },
  };
}

profileRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.sub },
    });

    return res.json({ profile: profile || null });
  } catch (error) {
    return next(error);
  }
});

profileRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: req.user.sub },
    });

    const payload = buildProfileData(req.body, existingProfile);
    if (payload.error) return res.status(400).json({ error: payload.error });

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.sub },
      create: {
        userId: req.user.sub,
        ...payload.data,
      },
      update: payload.data,
    });

    return res.json({ profile });
  } catch (error) {
    return next(error);
  }
});

profileRouter.patch("/me/photos", requireAuth, async (req, res, next) => {
  try {
    const photoIds = Array.isArray(req.body.photoIds) ? req.body.photoIds : null;
    if (!photoIds) return res.status(400).json({ error: "photoIds array is required" });

    const uniqueIds = Array.from(new Set(photoIds.map((id) => String(id))));
    if (uniqueIds.length !== photoIds.length) {
      return res.status(400).json({ error: "photoIds must not contain duplicates" });
    }

    const ownedPhotos = await prisma.photo.findMany({
      where: {
        userId: req.user.sub,
        id: { in: uniqueIds },
      },
    });

    if (ownedPhotos.length !== uniqueIds.length) {
      return res.status(400).json({ error: "All photos must belong to the current user" });
    }

    await prisma.$transaction(
      uniqueIds.map((id, index) =>
        prisma.photo.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const photos = await prisma.photo.findMany({
      where: { userId: req.user.sub },
      orderBy: { sortOrder: "asc" },
    });

    return res.json({
      photos: photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        position: photo.sortOrder,
      })),
    });
  } catch (error) {
    return next(error);
  }
});
