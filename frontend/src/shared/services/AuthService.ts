import axios from 'axios';
import { API_URLS } from '../config/config';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from '../types/Auth';

export const AuthService = {
  async register(data: RegisterRequest): Promise<RegisterResponse | null> {
    try {
      const response = await axios.post<RegisterResponse>(`${API_URLS.AUTH}/register`, data);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse | null> {
    try {
      const response = await axios.post<LoginResponse>(`${API_URLS.AUTH}/login`, data);
      return response.data;
    } catch (error) {
      return null;
    }
  },
};
