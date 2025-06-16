// User service - handles user CRUD operations
import prisma from '../prismaClient';
import bcrypt from 'bcryptjs';
import { UserRole, RegisterUserDTO, UserResponseDTO } from '../models/user.dto';

export class UserService {
  
  async createUser(userData: RegisterUserDTO): Promise<UserResponseDTO> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        fullName: userData.fullName,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role || UserRole.USER,
      },
    });

    return new UserResponseDTO({
      ...user,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
      lastSession: user.lastSession?.toISOString(),
    });
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastSession(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSession: new Date() },
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<{
    users: UserResponseDTO[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const userResponses = users.map(user => new UserResponseDTO({
      ...user,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
      lastSession: user.lastSession?.toISOString(),
    }));

    return {
      users: userResponses,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
}
