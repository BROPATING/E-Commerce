import { body, validationResult } from 'express-validator';

/**
 * Validation rules for registration.
 * These run as middleware before the controller function.
 */
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 3 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

/**
 * Validation rules for login.
 * These run as middleware before the controller function.
 */
export const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage("Valid Email Required")
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage("Password is required")
]