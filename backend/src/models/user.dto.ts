// User models and DTOs
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastSession?: string;
}

export class RegisterUserDTO {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;

  constructor({ fullName, email, password, role }: { 
    fullName: string; 
    email: string; 
    password: string; 
    role?: UserRole 
  }) {
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.role = role || UserRole.USER;
  }
}

export class LoginUserDTO {
  email: string;
  password: string;

  constructor({ email, password }: { email: string; password: string }) {
    this.email = email;
    this.password = password;
  }
}

export class UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastSession?: string;

  constructor(user: User) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.lastSession = user.lastSession;
  }
}
