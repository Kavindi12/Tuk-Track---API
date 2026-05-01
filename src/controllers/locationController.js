import LocationPing from '../models/LocationPing.js';
import Vehicle from '../models/Vehicle.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

// POST /api/locations/ping  — device submits its GPS coordinates
export const submitPing = async (req, res, next) => {
  try {
    const { latitude, longitude, speed, heading, timestamp } = req.body;

    // Device users are linked to exactly one vehicle
    const vehicleId = req.user.vehicle;
    if (!vehicleId) {
      return res.status(400).json(errorResponse('Device account is not linked to any vehicle.', 400));
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json(errorResponse('Linked vehicle not found.', 404));
    if (vehicle.status === 'suspended') {
      return res.status(403).json(errorResponse('Vehicle is suspended. Pings rejected.', 403));
    }

    const ping = await LocationPing.create({
      vehicle: vehicleId,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    res.status(201).json(successResponse(ping, 'Location ping recorded.'));
  } catch (err) {
    next(err);
  }
};

// GET /api/locations  — list all pings with filters
export const getLocations = async (req, res, next) => {
  try {
    const {
      vehicle, province, district, startDate, endDate,
      sort = 'timestamp', order = 'desc', page = 1, limit = 50,
    } = req.query;

    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Province/district filter requires joining through Vehicle
    let vehicleIds = null;
    if (province || district) {
      const vehicleFilter = {};
      if (province) vehicleFilter.province = province;
      if (district) vehicleFilter.district = district;
      const vehicles = await Vehicle.find(vehicleFilter).select('_id');
      vehicleIds = vehicles.map((v) => v._id);
      filter.vehicle = { $in: vehicleIds };
    }

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      LocationPing.find(filter)
        .populate('vehicle', 'registrationNumber status province district')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      LocationPing.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Location pings retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

// GET /api/locations/active  — vehicles with a ping in the last 30 minutes
export const getActiveVehicles = async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    const activePings = await LocationPing.aggregate([
      { $match: { timestamp: { $gte: cutoff } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$vehicle',
          lastPing: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'provinces',
          localField: 'vehicle.province',
          foreignField: '_id',
          as: 'vehicle.province',
        },
      },
      { $unwind: { path: '$vehicle.province', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'districts',
          localField: 'vehicle.district',
          foreignField: '_id',
          as: 'vehicle.district',
        },
      },
      { $unwind: { path: '$vehicle.district', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vehicle: {
            _id: 1,
            registrationNumber: 1,
            status: 1,
            'province.name': 1,
            'province.code': 1,
            'district.name': 1,
          },
          lastPing: {
            latitude: 1,
            longitude: 1,
            speed: 1,
            heading: 1,
            timestamp: 1,
          },
        },
      },
    ]);

    res.json(
      successResponse(
        { count: activePings.length, vehicles: activePings },
        `${activePings.length} vehicle(s) active in the last 30 minutes.`
      )
    );
  } catch (err) {
    next(err);
  }
};

