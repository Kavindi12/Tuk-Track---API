import District from '../models/District.js';
import PoliceStation from '../models/PoliceStation.js';
import Vehicle from '../models/Vehicle.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getDistricts = async (req, res, next) => {
  try {
    const { name, province, sort = 'name', order = 'asc', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (province) filter.province = province;

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      District.find(filter).populate('province', 'name code').sort(sortObj).skip(skip).limit(parseInt(limit)),
      District.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Districts retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id).populate('province', 'name code');
    if (!district) return res.status(404).json(errorResponse('District not found.', 404));
    res.json(successResponse(district, 'District retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const createDistrict = async (req, res, next) => {
  try {
    const district = await District.create(req.body);
    await district.populate('province', 'name code');
    res.status(201).json(successResponse(district, 'District created.'));
  } catch (err) {
    next(err);
  }
};

export const updateDistrict = async (req, res, next) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('province', 'name code');
    if (!district) return res.status(404).json(errorResponse('District not found.', 404));
    res.json(successResponse(district, 'District updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteDistrict = async (req, res, next) => {
  try {
    const [hasStations, hasVehicles] = await Promise.all([
      PoliceStation.exists({ district: req.params.id }),
      Vehicle.exists({ district: req.params.id }),
    ]);
    if (hasStations || hasVehicles) {
      return res
        .status(409)
        .json(errorResponse('Cannot delete district that has police stations or vehicles.', 409));
    }
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) return res.status(404).json(errorResponse('District not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

