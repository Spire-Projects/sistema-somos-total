import { RequestHandler, Router } from "express";
import {
  registerUser,
  loginUser
} from "../controllers/user.controller.js";

const router = Router();

// Rutas para usuarios
router.post("/login", loginUser as RequestHandler);
router.post("/register", registerUser as RequestHandler);

export const userRoutes = router;
