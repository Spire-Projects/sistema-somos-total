import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
// Encriptar contraseña
export const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};
// Verificar contraseña
export const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
// Generar JWT
export const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
    };
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
};
// Verificar JWT
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            fullName: decoded.fullName,
            active: true // Se asume que si el token es válido, el usuario está activo
        };
    }
    catch (error) {
        throw new Error('Token inválido');
    }
};
// Extraer token del header Authorization
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
