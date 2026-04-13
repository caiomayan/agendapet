import { Router } from "express";
import * as authController from "../controllers/authController.js";
import * as authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", authMiddleware.loginLimiter, authController.login);
router.post(
  "/verify-2fa",
  authMiddleware.loginLimiter,
  authController.verifyOtp,
);

export default router;
