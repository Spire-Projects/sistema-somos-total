export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string; // ISO date string
  lastSession?: string; // ISO date string, only present in login response
}
