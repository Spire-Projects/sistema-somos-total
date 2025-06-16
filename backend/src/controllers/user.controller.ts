// User controller - handles user management endpoints
import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const userService = new UserService();

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters' });
      return;
    }

    const result = await userService.getUsers(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Prevent self-deletion
    if (req.user?.userId === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const deleted = await userService.deleteUser(id);

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastSession: user.lastSession?.toISOString(),
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
