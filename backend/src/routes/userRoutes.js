import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("", userController.listUsers);

router.get("/:username", userController.listUserUsername);

router.get("/id/:id", authenticateToken, userController.listUserID);

router.post("", authenticateToken, userController.createUser);

router.patch("/id/:id", authenticateToken, userController.updateUser);

router.delete("/id/:id", authenticateToken, userController.deleteUser);

export default router;
