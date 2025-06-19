import type { User, UserRole } from './User';
import type { AuthUser } from '../db/models/user.model';

// Register
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterResponse {
  user: AuthUser;
  token: string;
}

// Login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}
