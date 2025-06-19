import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth.utils.js';
import { AuthUser, UserRole } from '../models/user.model.js';
import { dbHelpers } from '../db/database.js';

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware para verificar JWT
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ message: 'Token de acceso requerido' });
      return;
    }

    const user = verifyToken(token);
    
    // Verificar que el usuario aún existe y está activo
    const dbUser = await dbHelpers.users.getById(user.id);
    if (!dbUser || !dbUser.active) {
      res.status(401).json({ message: 'Usuario no válido o desactivado' });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
      return;
    }

    next();
  };
};

// Middleware para verificar que el usuario sea admin
export const requireAdmin = requireRole(['admin']);

// Middleware para verificar que el usuario sea admin o sea el mismo usuario
export const requireAdminOrSelf = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: 'Usuario no autenticado' });
    return;
  }

  const userId = req.params.id;
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === userId;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    return;
  }

  next();
};
