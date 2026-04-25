import express from 'express';
import { body } from 'express-validator';
import {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver,
} from '../controllers/driverController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Tuk-tuk driver / operator identity management
 */

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: List drivers
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: province
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, NIC, or license number
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200: { description: Paginated list of drivers }
 *   post:
 *     summary: Register a driver (admin only)
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, nicNumber, licenseNumber, province, district]
 *             properties:
 *               fullName: { type: string }
 *               nicNumber: { type: string }
 *               licenseNumber: { type: string }
 *               contactPhone: { type: string }
 *               address: { type: string }
 *               province: { type: string }
 *               district: { type: string }
 *     responses:
 *       201: { description: Driver registered }
 *       409: { description: Duplicate NIC or license }
 */
router
  .route('/')
  .get(protect, getDrivers)
  .post(
    protect,
    authorize('admin'),
    [
      body('fullName').trim().notEmpty().withMessage('Full name is required'),
      body('nicNumber').trim().notEmpty().withMessage('NIC number is required'),
      body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
      body('province').notEmpty().withMessage('Province is required'),
      body('district').notEmpty().withMessage('District is required'),
    ],
    validate,
    createDriver
  );

/**
 * @swagger
 * /drivers/{id}:
 *   get:
 *     summary: Get a single driver
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Driver data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a driver (admin only)
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated driver }
 *   delete:
 *     summary: Delete a driver (admin only)
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       409: { description: Driver is assigned to a vehicle }
 */
router
  .route('/:id')
  .get(protect, getDriver)
  .put(protect, authorize('admin'), updateDriver)
  .delete(protect, authorize('admin'), deleteDriver);

export default router;
