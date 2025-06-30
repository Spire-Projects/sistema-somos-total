import type { AuthUser, UserRole } from './User';

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
