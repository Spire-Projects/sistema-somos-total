export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  lastSession?: string;
}
