// Auth controller - handles authentication endpoints
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { LoginUserDTO, RegisterUserDTO } from '../models/user.dto';

const authService = new AuthService();
const userService = new UserService();

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Full name, email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const registerData = new RegisterUserDTO({ fullName, email, password, role });
    const user = await userService.createUser(registerData);

    res.status(201).json({ 
      message: 'User registered successfully', 
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const loginData = new LoginUserDTO({ email, password });
    const result = await authService.login(loginData);

    if (!result) {
      res.status(401).json({ error: 'Invalid credentials or inactive user' });
      return;
    }

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  // For JWT, logout is typically handled on the client side
  // by removing the token from storage
  res.json({ message: 'Logout successful' });
};
