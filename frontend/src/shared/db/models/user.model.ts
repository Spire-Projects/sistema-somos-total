import type { RxJsonSchema } from 'rxdb';
import type { UserRole } from '../../types/User';

// Esquema para RxDB
export const userSchema: RxJsonSchema<UserDocument> = {
  title: 'user schema',
  description: 'describes a user',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    fullName: {
      type: 'string',
      maxLength: 200
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 100
    },
    passwordHash: {
      type: 'string',
      maxLength: 500
    },
    role: {
      type: 'string',
      enum: ['admin', 'cashier'],
      maxLength: 20
    },
    active: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    lastSession: {
      type: 'string',
      format: 'date-time',
      maxLength: 50
    },
    isDeleted: {
      type: 'boolean',
      default: false
    }
  },
  required: ['id', 'fullName', 'email', 'passwordHash', 'role', 'active', 'createdAt', 'isDeleted'],
  indexes: ['email', 'role', 'isDeleted']
};

export const userMigrationStrategies = {
  1: (oldDoc: any) => {
    if(oldDoc.isDeleted === undefined) {
      oldDoc.isDeleted = false;
    }
    return oldDoc;
  },
 
};

// Tipo del documento como se almacena en RxDB
export interface UserDocument {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  lastSession?: string;
  isDeleted: boolean; 
}

// Datos para crear un usuario
export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

// Datos para actualizar un usuario
export interface UpdateUserData {
  fullName?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

// Credenciales de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Usuario autenticado (sin datos sensibles)
