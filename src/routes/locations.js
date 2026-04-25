import express from 'express';
import { body } from 'express-validator';
import { submitPing, getLocations, getActiveVehicles } from '../controllers/locationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: GPS location pings from tuk-tuk devices
 */

/**
 * @swagger
 * /locations/active:
 *   get:
 *     summary: Get vehicles active in the last 30 minutes
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of active vehicles with their last known GPS ping
 */
// NOTE: /active must be declared before /:id-style routes
router.get('/active', protect, authorize('admin', 'officer'), getActiveVehicles);

/**
 * @swagger
 * /locations/ping:
 *   post:
 *     summary: Submit a GPS ping (device accounts only)
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number, example: 6.9271 }
 *               longitude: { type: number, example: 79.8612 }
 *               speed: { type: number, example: 25.5, description: Speed in km/h }
 *               heading: { type: number, example: 180, description: Bearing 0-360 }
 *               timestamp: { type: string, format: date-time, description: Device-reported time (defaults to now) }
 *     responses:
 *       201: { description: Ping recorded }
 *       400: { description: Device not linked to vehicle }
 *       403: { description: Vehicle is suspended }
 */
router.post(
  '/ping',
  protect,
  authorize('device'),
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be non-negative'),
    body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be 0-360'),
  ],
  validate,
  submitPing
);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: List all location pings with filters
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: vehicle
 *         schema: { type: string }
 *         description: Filter by vehicle ObjectId
 *       - in: query
 *         name: province
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: timestamp }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Paginated list of location pings }
 */
router.get('/', protect, authorize('admin', 'officer'), getLocations);

export default router;
