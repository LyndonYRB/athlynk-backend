import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { getCurrentUser, serializeUser } from "./auth.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});
