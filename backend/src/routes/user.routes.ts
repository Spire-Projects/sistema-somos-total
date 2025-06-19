import { RequestHandler, Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserById,
  getAllUsers,
  updateUser,
  deactivateUser,
  deleteUser
} from "../controllers/user.controller.js";
import {
  authenticateToken,
  requireAdmin,
  requireAdminOrSelf
} from "../middleware/auth.middleware.js";
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateUserId,
  validatePagination
} from "../middleware/validation.middleware.js";

const router = Router();

// Rutas públicas (sin autenticación)
router.post("/register", validateUserRegistration, registerUser as RequestHandler);
router.post("/login", validateUserLogin, loginUser as RequestHandler);

// Rutas protegidas (requieren autenticación)
router.get("/me", authenticateToken, getCurrentUser as RequestHandler);

// Rutas que requieren autenticación y validación de permisos
router.get("/", authenticateToken, requireAdmin, validatePagination, getAllUsers as RequestHandler);
router.get("/:id", authenticateToken, requireAdminOrSelf, validateUserId, getUserById as RequestHandler);
router.put("/:id", authenticateToken, requireAdminOrSelf, validateUserId, validateUserUpdate, updateUser as RequestHandler);
router.patch("/:id/deactivate", authenticateToken, requireAdmin, validateUserId, deactivateUser as RequestHandler);
router.delete("/:id", authenticateToken, requireAdmin, validateUserId, deleteUser as RequestHandler);

export const userRoutes = router;
