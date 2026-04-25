import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getDrivers = async (req, res, next) => {
  try {
    const {
      province, district, isActive, search,
      sort = 'fullName', order = 'asc', page = 1, limit = 25,
    } = req.query;

    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { nicNumber: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Driver.find(filter)
        .populate('province', 'name code')
        .populate('district', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Driver.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Drivers retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name');
    if (!driver) return res.status(404).json(errorResponse('Driver not found.', 404));
    res.json(successResponse(driver, 'Driver retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    await driver.populate([
      { path: 'province', select: 'name code' },
      { path: 'district', select: 'name' },
    ]);
    res.status(201).json(successResponse(driver, 'Driver registered.'));
  } catch (err) {
    next(err);
  }
};

export const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('province', 'name code')
      .populate('district', 'name');
    if (!driver) return res.status(404).json(errorResponse('Driver not found.', 404));
    res.json(successResponse(driver, 'Driver updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteDriver = async (req, res, next) => {
  try {
    const hasVehicle = await Vehicle.exists({ driver: req.params.id });
    if (hasVehicle) {
      return res
        .status(409)
        .json(errorResponse('Cannot delete driver assigned to a vehicle.', 409));
    }
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json(errorResponse('Driver not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

