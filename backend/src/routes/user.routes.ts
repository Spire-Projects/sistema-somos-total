// User routes - protected endpoints for user management
import { Router } from 'express';
import { getUsers, deleteUser, getUserProfile } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Get current user profile
router.get('/profile', getUserProfile);

// Admin-only routes
router.get('/', requireAdmin, getUsers);
router.delete('/:id', requireAdmin, deleteUser);

export default router;
