import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../db/database.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.utils.js';
import { CreateUserData, LoginCredentials, UpdateUserData, User } from '../models/user.model.js';

// Registrar un nuevo usuario
export const registerUser = async (req: Request, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Verificar si el email ya existe
    const existingUser = await dbHelpers.users.getByEmail(userData.email);
    if (existingUser) {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }

    // Encriptar la contraseña
    const passwordHash = await hashPassword(userData.password);

    // Crear el nuevo usuario
    const newUser: User = {
      id: uuidv4(),
      fullName: userData.fullName,
      email: userData.email,
      passwordHash,
      role: userData.role,
      active: true,
      createdAt: new Date().toISOString()
    };

    await dbHelpers.users.create(newUser);

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = newUser;
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      message: 'Error al registrar usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Login de usuario
export const loginUser = async (req: Request, res: Response) => {
  try {
    const credentials: LoginCredentials = req.body;

    // Buscar el usuario por email
    const user = await dbHelpers.users.getByEmail(credentials.email);
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Verificar si el usuario está activo
    if (!user.active) {
      res.status(401).json({ message: 'Usuario desactivado' });
      return;
    }

    // Verificar la contraseña
    const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Actualizar última sesión
    await dbHelpers.users.update(user.id, {
      lastSession: new Date().toISOString()
    });

    // Generar token JWT
    const authUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active
    };

    const token = generateToken(authUser);

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = user;

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({
      message: 'Error al hacer login',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Obtener perfil del usuario actual
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const user = await dbHelpers.users.getById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = user;
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({
      message: 'Error al obtener usuario actual',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await dbHelpers.users.getById(id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = user;
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      message: 'Error al obtener usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Obtener todos los usuarios con paginación
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const size = req.query.size ? parseInt(req.query.size as string) : 10;

    const result = await dbHelpers.users.getAllPaginated(page, size);
    
    // Remover las contraseñas de la respuesta
    const usersWithoutPasswords = result.users.map(user => {
      const { passwordHash: _, ...userResponse } = user;
      return userResponse;
    });

    res.status(200).json({
      users: usersWithoutPasswords,
      pagination: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      message: 'Error al obtener usuarios',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserData = req.body;

    // Verificar que el usuario existe
    const existingUser = await dbHelpers.users.getById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await dbHelpers.users.getByEmail(updateData.email);
      if (emailExists) {
        res.status(409).json({ message: 'El email ya está en uso' });
        return;
      }
    }

    const updatedUser = await dbHelpers.users.update(id, updateData);
    
    // Remover la contraseña de la respuesta
    const { passwordHash: _, ...userResponse } = updatedUser;
    
    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      message: 'Error al actualizar usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Desactivar usuario
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await dbHelpers.users.getById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // No permitir desactivar al propio usuario si es admin
    if (req.user?.id === id && req.user.role === 'admin') {
      res.status(400).json({ message: 'No puedes desactivar tu propia cuenta de administrador' });
      return;
    }

    await dbHelpers.users.update(id, { active: false });
    
    res.status(200).json({
      message: 'Usuario desactivado exitosamente',
      id
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      message: 'Error al desactivar usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Eliminar usuario (hard delete)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await dbHelpers.users.getById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // No permitir eliminar al propio usuario si es admin
    if (req.user?.id === id && req.user.role === 'admin') {
      res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador' });
      return;
    }

    await dbHelpers.users.delete(id);
    
    res.status(200).json({
      message: 'Usuario eliminado exitosamente',
      id
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      message: 'Error al eliminar usuario',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
