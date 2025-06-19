import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
const router = Router();
// Rutas para usuarios
router.post("/login", loginUser);
router.post("/register", registerUser);
export const userRoutes = router;
