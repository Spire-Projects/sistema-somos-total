export type UserRole = "cashier" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  lastSession?: string;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
}
