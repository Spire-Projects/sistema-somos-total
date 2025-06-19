import { UserService } from './UserService';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from '../types/Auth';
import type { CreateUserData, LoginCredentials } from '../db/models/user.model';

export const AuthService = {
  async register(data: RegisterRequest): Promise<RegisterResponse | null> {
    try {
      const createUserData: CreateUserData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role || 'cashier' // rol por defecto
      };

      const result = await UserService.register(createUserData);
      
      if (result.success && result.user && result.token) {
        return {
          user: result.user,
          token: result.token
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en registro:', error);
      return null;
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse | null> {
    try {
      const loginCredentials: LoginCredentials = {
        email: data.email,
        password: data.password
      };

      const result = await UserService.login(loginCredentials);
      
      if (result.success && result.user && result.token) {
        return {
          user: result.user,
          token: result.token
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en login:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    await UserService.logout();
  }
};
