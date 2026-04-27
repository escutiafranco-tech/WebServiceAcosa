/**
 * MIDDLEWARE: Validación de entrada
 * 
 * Centraliza validaciones para prevenir:
 * - Inyección SQL
 * - XSS
 * - Inyección de datos
 * - Entrada inválida
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware: Manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validación fallida',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * VALIDACIONES: LOGIN
 */
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Contraseña debe tener entre 6 y 100 caracteres')
    .notEmpty()
    .withMessage('Contraseña es requerida'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: CREAR USUARIO
 */
const validateCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Contraseña debe tener mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),
  
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Nombre solo puede contener letras, espacios, guiones y apóstrofes'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('role')
    .trim()
    .isIn(['Administrador', 'Supervisor', 'Usuario'])
    .withMessage('Rol inválido'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: ACTUALIZAR USUARIO
 */
const validateUpdateUser = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID de usuario inválido'),
  
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .trim()
    .isIn(['Administrador', 'Supervisor', 'Usuario'])
    .withMessage('Rol inválido'),
  
  body('activo')
    .optional()
    .isIn([0, 1, '0', '1'])
    .withMessage('Activo debe ser 0 o 1'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: CREAR PROVEEDOR
 */
const validateCreateProveedor = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre debe tener entre 2 y 255 caracteres'),
  
  body('rfc')
    .optional()
    .trim()
    .matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)
    .withMessage('RFC inválido'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido'),
  
  body('telefono')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage('Teléfono inválido'),
  
  body('tipo_proveedor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tipo de proveedor inválido'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: QUERY PARAMETERS
 */
const validateQueryParams = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit debe ser entre 1 y 1000'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser un número no negativo'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Búsqueda muy larga'),
  
  handleValidationErrors
];

/**
 * VALIDACIONES: PARÁMETROS DE RUTA
 */
const validateIdParam = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('ID inválido'),
  
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateCreateUser,
  validateUpdateUser,
  validateCreateProveedor,
  validateQueryParams,
  validateIdParam,
  handleValidationErrors
};
