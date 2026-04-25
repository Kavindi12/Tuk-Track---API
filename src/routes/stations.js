import express from 'express';
import { body } from 'express-validator';
import {
  getStations, getStation, createStation, updateStation, deleteStation,
} from '../controllers/stationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Police Stations
 *   description: Police station management
 */

/**
 * @swagger
 * /stations:
 *   get:
 *     summary: List police stations
 *     tags: [Police Stations]
 *     parameters:
 *       - in: query
 *         name: province
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200: { description: List of stations }
 *   post:
 *     summary: Create a police station (admin only)
 *     tags: [Police Stations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, province, district]
 *             properties:
 *               name: { type: string }
 *               province: { type: string }
 *               district: { type: string }
 *               contact: { type: string }
 *               address: { type: string }
 *     responses:
 *       201: { description: Station created }
 */
router
  .route('/')
  .get(protect, getStations)
  .post(
    protect,
    authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('province').notEmpty().withMessage('Province is required'),
      body('district').notEmpty().withMessage('District is required'),
    ],
    validate,
    createStation
  );

/**
 * @swagger
 * /stations/{id}:
 *   get:
 *     summary: Get a single police station
 *     tags: [Police Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Station data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a police station (admin only)
 *     tags: [Police Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated station }
 *   delete:
 *     summary: Delete a police station (admin only)
 *     tags: [Police Stations]
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
  .get(protect, getStation)
  .put(protect, authorize('admin'), updateStation)
  .delete(protect, authorize('admin'), deleteStation);

export default router;
