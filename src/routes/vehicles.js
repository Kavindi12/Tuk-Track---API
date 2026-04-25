import express from 'express';
import { body } from 'express-validator';
import {
  getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle,
  getVehicleLastLocation, getVehicleHistory,
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Three-wheeler (tuk-tuk) registration and tracking
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: List registered vehicles
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: province
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, suspended, flagged] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by registration number, owner name, or NIC
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: registrationNumber }
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
 *       200: { description: Paginated list of vehicles }
 *   post:
 *     summary: Register a vehicle (admin only)
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationNumber, ownerName, province, district]
 *             properties:
 *               registrationNumber: { type: string, example: TK-045 }
 *               ownerName: { type: string }
 *               ownerContact: { type: string }
 *               ownerNIC: { type: string }
 *               driver: { type: string, description: Driver ObjectId }
 *               province: { type: string }
 *               district: { type: string }
 *               status: { type: string, enum: [active, suspended, flagged] }
 *               deviceUser: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Vehicle registered }
 *       409: { description: Duplicate registration number }
 */
router
  .route('/')
  .get(protect, getVehicles)
  .post(
    protect,
    authorize('admin'),
    [
      body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
      body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
      body('province').notEmpty().withMessage('Province is required'),
      body('district').notEmpty().withMessage('District is required'),
    ],
    validate,
    createVehicle
  );

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a single vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vehicle data with populated driver and device user }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a vehicle (admin only)
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated vehicle }
 *   delete:
 *     summary: Delete a vehicle (admin only)
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
router
  .route('/:id')
  .get(protect, getVehicle)
  .put(protect, authorize('admin'), updateVehicle)
  .delete(protect, authorize('admin'), deleteVehicle);

/**
 * @swagger
 * /vehicles/{id}/location:
 *   get:
 *     summary: Get last known location of a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Last GPS ping for the vehicle }
 *       404: { description: Vehicle not found or no location data }
 */
router.get('/:id/location', protect, getVehicleLastLocation);

/**
 * @swagger
 * /vehicles/{id}/history:
 *   get:
 *     summary: Get movement history for a vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *         description: Filter pings from this date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200: { description: Paginated list of location pings }
 *       404: { description: Vehicle not found }
 */
router.get('/:id/history', protect, getVehicleHistory);

export default router;
