import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { AuthUser, User } from '../models/user.model.js';

// Encriptar contraseña
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verificar contraseña
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generar JWT
export const generateToken = (user: AuthUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  } as jwt.SignOptions);
};

// Verificar JWT
export const verifyToken = (token: string): AuthUser => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
      active: true // Se asume que si el token es válido, el usuario está activo
    };
  } catch (error) {
    throw new Error('Token inválido');
  }
};

// Extraer token del header Authorization
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};
