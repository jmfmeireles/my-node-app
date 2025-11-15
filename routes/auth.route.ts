import { Router } from "express";
import {
  register,
  login,
  logout,
  protectedRoute,
  authenticateGoogle,
  googleCallback,
  protectedGoogle,
} from "../controllers/auth.controller.ts";
import { authenticationSession } from "../middlewares/session.middleware.ts";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/protected", authenticationSession, protectedRoute);

// Google OAuth
router.get("/authenticate", authenticateGoogle);
router.get("/callback", googleCallback);
router.get("/protected-google", authenticationSession, protectedGoogle);

export default router;
