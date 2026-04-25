import Vehicle from '../models/Vehicle.js';
import LocationPing from '../models/LocationPing.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getVehicles = async (req, res, next) => {
  try {
    const {
      province, district, status, search,
      sort = 'registrationNumber', order = 'asc', page = 1, limit = 25,
    } = req.query;

    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { ownerNIC: { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('province', 'name code')
        .populate('district', 'name')
        .populate('driver', 'fullName nicNumber licenseNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Vehicle.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Vehicles retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name')
      .populate('driver', 'fullName nicNumber licenseNumber contactPhone')
      .populate('deviceUser', 'username email');
    if (!vehicle) return res.status(404).json(errorResponse('Vehicle not found.', 404));
    res.json(successResponse(vehicle, 'Vehicle retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    await vehicle.populate([
      { path: 'province', select: 'name code' },
      { path: 'district', select: 'name' },
      { path: 'driver', select: 'fullName nicNumber' },
    ]);
    res.status(201).json(successResponse(vehicle, 'Vehicle registered.'));
  } catch (err) {
    next(err);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('province', 'name code')
      .populate('district', 'name')
      .populate('driver', 'fullName nicNumber');
    if (!vehicle) return res.status(404).json(errorResponse('Vehicle not found.', 404));
    res.json(successResponse(vehicle, 'Vehicle updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json(errorResponse('Vehicle not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getVehicleLastLocation = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).select('registrationNumber status');
    if (!vehicle) return res.status(404).json(errorResponse('Vehicle not found.', 404));

    const lastPing = await LocationPing.findOne({ vehicle: req.params.id })
      .sort({ timestamp: -1 })
      .select('latitude longitude speed heading timestamp receivedAt');

    if (!lastPing) {
      return res.status(404).json(errorResponse('No location data found for this vehicle.', 404));
    }

    res.json(
      successResponse(
        { vehicle: { id: vehicle._id, registrationNumber: vehicle.registrationNumber, status: vehicle.status }, location: lastPing },
        'Last known location retrieved.'
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getVehicleHistory = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).select('registrationNumber');
    if (!vehicle) return res.status(404).json(errorResponse('Vehicle not found.', 404));

    const { startDate, endDate, sort = 'timestamp', order = 'asc', page = 1, limit = 100 } = req.query;
    const filter = { vehicle: req.params.id };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      LocationPing.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
      LocationPing.countDocuments(filter),
    ]);

    res.json(
      successResponse(
        { vehicle: { id: vehicle._id, registrationNumber: vehicle.registrationNumber }, pings: data },
        'Movement history retrieved.',
        getPagination(page, limit, total)
      )
    );
  } catch (err) {
    next(err);
  }
};


