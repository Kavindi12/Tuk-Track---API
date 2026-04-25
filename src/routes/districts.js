import express from 'express';
import { body } from 'express-validator';
import {
  getDistricts, getDistrict, createDistrict, updateDistrict, deleteDistrict,
} from '../controllers/districtController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Districts
 *   description: District management
 */

/**
 * @swagger
 * /districts:
 *   get:
 *     summary: List all districts
 *     tags: [Districts]
 *     parameters:
 *       - in: query
 *         name: province
 *         schema: { type: string }
 *         description: Filter by province ObjectId
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: List of districts }
 *   post:
 *     summary: Create a district (admin only)
 *     tags: [Districts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, province]
 *             properties:
 *               name: { type: string, example: Colombo }
 *               province: { type: string, description: Province ObjectId }
 *     responses:
 *       201: { description: District created }
 */
router
  .route('/')
  .get(protect, getDistricts)
  .post(
    protect,
    authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('province').notEmpty().withMessage('Province is required'),
    ],
    validate,
    createDistrict
  );

/**
 * @swagger
 * /districts/{id}:
 *   get:
 *     summary: Get a single district
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: District data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a district (admin only)
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated district }
 *   delete:
 *     summary: Delete a district (admin only)
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       409: { description: Has child stations or vehicles }
 */
router
  .route('/:id')
  .get(protect, getDistrict)
  .put(protect, authorize('admin'), updateDistrict)
  .delete(protect, authorize('admin'), deleteDistrict);

export default router;
