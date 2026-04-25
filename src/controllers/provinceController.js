import Province from '../models/Province.js';
import District from '../models/District.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getProvinces = async (req, res, next) => {
  try {
    const { name, sort = 'name', order = 'asc', page = 1, limit = 25 } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Province.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
      Province.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Provinces retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getProvince = async (req, res, next) => {
  try {
    const province = await Province.findById(req.params.id);
    if (!province) return res.status(404).json(errorResponse('Province not found.', 404));
    res.json(successResponse(province, 'Province retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const createProvince = async (req, res, next) => {
  try {
    const province = await Province.create(req.body);
    res.status(201).json(successResponse(province, 'Province created.'));
  } catch (err) {
    next(err);
  }
};

export const updateProvince = async (req, res, next) => {
  try {
    const province = await Province.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!province) return res.status(404).json(errorResponse('Province not found.', 404));
    res.json(successResponse(province, 'Province updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteProvince = async (req, res, next) => {
  try {
    const hasDistricts = await District.exists({ province: req.params.id });
    if (hasDistricts) {
      return res
        .status(409)
        .json(errorResponse('Cannot delete province that has districts.', 409));
    }
    const province = await Province.findByIdAndDelete(req.params.id);
    if (!province) return res.status(404).json(errorResponse('Province not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

