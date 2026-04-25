import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user identity
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username: { type: string, example: officer_jayasuriya }
 *               email: { type: string, example: officer@police.lk }
 *               password: { type: string, example: Secret123 }
 *               role: { type: string, enum: [admin, officer, device] }
 *               policeStation: { type: string, description: ObjectId (for officer role) }
 *               vehicle: { type: string, description: ObjectId (for device role) }
 *     responses:
 *       201: { description: User registered }
 *       409: { description: Username or email already exists }
 */
router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username min 3 chars'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').isIn(['admin', 'officer', 'device']).withMessage('Invalid role'),
  ],
  validate,
  register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@police.lk }
 *               password: { type: string, example: admin123 }
 *     responses:
 *       200: { description: Login successful, returns JWT token }
 *       401: { description: Invalid credentials }
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user data }
 *       401: { description: Not authenticated }
 */
router.get('/me', protect, getMe);

export default router;
