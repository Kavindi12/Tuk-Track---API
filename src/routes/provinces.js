import express from 'express';
import { body } from 'express-validator';
import {
  getProvinces, getProvince, createProvince, updateProvince, deleteProvince,
} from '../controllers/provinceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Provinces
 *   description: Sri Lanka province management
 */

/**
 * @swagger
 * /provinces:
 *   get:
 *     summary: List all provinces
 *     tags: [Provinces]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by name (partial match)
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: name }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200: { description: List of provinces with pagination }
 *   post:
 *     summary: Create a province (admin only)
 *     tags: [Provinces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string, example: Western Province }
 *               code: { type: string, example: WP }
 *     responses:
 *       201: { description: Province created }
 *       409: { description: Duplicate name or code }
 */
router
  .route('/')
  .get(protect, getProvinces)
  .post(
    protect,
    authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('code').trim().notEmpty().withMessage('Code is required'),
    ],
    validate,
    createProvince
  );

/**
 * @swagger
 * /provinces/{id}:
 *   get:
 *     summary: Get a single province
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Province data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a province (admin only)
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       200: { description: Updated province }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete a province (admin only)
 *     tags: [Provinces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       409: { description: Has child districts }
 */
router
  .route('/:id')
  .get(protect, getProvince)
  .put(protect, authorize('admin'), updateProvince)
  .delete(protect, authorize('admin'), deleteProvince);

export default router;
