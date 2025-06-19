import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Errores de validación',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Validaciones para registro de usuario
export const validateUserRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre completo debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  body('role')
    .isIn(['cashier', 'admin'])
    .withMessage('El rol debe ser "cashier" o "admin"'),
  
  handleValidationErrors
];

// Validaciones para login
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  
  handleValidationErrors
];

// Validaciones para actualización de usuario
export const validateUserUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre completo debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('role')
    .optional()
    .isIn(['cashier', 'admin'])
    .withMessage('El rol debe ser "cashier" o "admin"'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active debe ser un valor booleano'),
  
  handleValidationErrors
];

// Validaciones para parámetros de ID
export const validateUserId = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
  
  handleValidationErrors
];

// Validaciones para paginación
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  
  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El tamaño debe ser un número entero entre 1 y 100'),
  
  handleValidationErrors
];
