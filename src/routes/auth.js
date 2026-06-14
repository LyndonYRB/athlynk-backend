import { Router } from "express";

import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { comparePassword, hashPassword, signAccessToken } from "../utils/auth.js";

export const authRouter = Router();

export const DEFAULT_PREFERENCES = {
  preferredActivities: [],
  genderPref: "any",
  ageMin: 18,
  ageMax: 60,
  radius: 25,
  availabilityFilterOn: false,
  availabilityPref: [],
  skillPref: "any",
};

const userInclude = {
  profile: true,
};

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    profile: user.profile || null,
  };
}

export function getCurrentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email);
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const password = String(req.body.password || "");

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        preference: {
          create: DEFAULT_PREFERENCES,
        },
      },
      include: userInclude,
    });

    return res.status(201).json({
      user: serializeUser(user),
      accessToken: signAccessToken(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email or phone is already registered" });
    }

    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await prisma.user.findUnique({
      where: { email },
      include: userInclude,
    });

    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const passwordOk = await comparePassword(password, user.passwordHash);
    if (!passwordOk) return res.status(401).json({ error: "Invalid email or password" });

    return res.json({
      user: serializeUser(user),
      accessToken: signAccessToken(user),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});
