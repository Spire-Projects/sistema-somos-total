// Auth service - handles authentication logic
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { LoginUserDTO, UserResponseDTO, UserRole } from '../models/user.dto';

export class AuthService {
  private userService: UserService;
  private jwtSecret: string;

  constructor() {
    this.userService = new UserService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key';
  }

  async login(loginData: LoginUserDTO): Promise<{ user: UserResponseDTO; token: string } | null> {
    const user = await this.userService.getUserByEmail(loginData.email);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    // Update last session
    await this.userService.updateLastSession(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    const userResponse = new UserResponseDTO({
      ...user,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
      lastSession: new Date().toISOString(),
    });

    return { user: userResponse, token };
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch {
      return null;
    }
  }
}
