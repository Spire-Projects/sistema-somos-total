import axios from 'axios';
import type { User } from '../types/User';

const API_URL = 'http://localhost:3001/api/users';

export const UserService = {
  async getProfile(token: string): Promise<User | null> {
    try {
      const response = await axios.get<User>(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async getAllUsers(token: string): Promise<User[] | null> {
    try {
      const response = await axios.get<User[]>(`${API_URL}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async updateProfile(token: string, userData: Partial<User>): Promise<User | null> {
    try {
      const response = await axios.put<User>(`${API_URL}/profile`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }
};