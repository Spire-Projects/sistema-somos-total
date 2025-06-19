import CryptoJS from 'crypto-js';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser, UserDocument } from '../db/models/user.model';

// Clave secreta para JWT (convertir a Uint8Array)
const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production'
);

// Hash de contraseña usando crypto-js
export async function hashPassword(password: string): Promise<string> {
  return CryptoJS.SHA256(password + 'salt').toString();
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = CryptoJS.SHA256(password + 'salt').toString();
  return hashedPassword === hash;
}

// Generar JWT token usando jose
export async function generateToken(user: AuthUser): Promise<string> {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
    
  return jwt;
}

// Verificar JWT token usando jose
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as any,
      fullName: '', // Se completará al obtener datos del usuario
      active: true
    };
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

// Convertir UserDocument a AuthUser (sin datos sensibles)
export function userToAuthUser(user: UserDocument): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    lastSession: user.lastSession
  };
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar contraseña
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  if (password.length > 50) {
    return { valid: false, message: 'La contraseña no puede tener más de 50 caracteres' };
  }
  
  return { valid: true };
}

// Almacenar token en localStorage
export function storeToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Obtener token del localStorage
export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Remover token del localStorage
export function removeStoredToken(): void {
  localStorage.removeItem('auth_token');
}
