import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  googleAuth,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleAuth);
router.post("/auth/refresh-token", refreshToken);
router.post("/auth/logout", logout);
router.get("/auth/user", authenticate, getCurrentUser);

export default router;
