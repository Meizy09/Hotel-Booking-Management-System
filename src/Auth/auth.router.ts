import { Router } from "express";
import {
  createUserController,
  verifyUserController,
  loginUserController
} from "../Auth/auth.controller";

const router = Router();

router.post("/register", createUserController);
router.post("/verify", verifyUserController);
router.post("/login", loginUserController)

export default router;

