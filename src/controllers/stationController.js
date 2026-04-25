import PoliceStation from '../models/PoliceStation.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getStations = async (req, res, next) => {
  try {
    const { name, province, district, sort = 'name', order = 'asc', page = 1, limit = 25 } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (province) filter.province = province;
    if (district) filter.district = district;

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      PoliceStation.find(filter)
        .populate('province', 'name code')
        .populate('district', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      PoliceStation.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Police stations retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name');
    if (!station) return res.status(404).json(errorResponse('Police station not found.', 404));
    res.json(successResponse(station, 'Police station retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const createStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.create(req.body);
    await station.populate([
      { path: 'province', select: 'name code' },
      { path: 'district', select: 'name' },
    ]);
    res.status(201).json(successResponse(station, 'Police station created.'));
  } catch (err) {
    next(err);
  }
};

export const updateStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('province', 'name code')
      .populate('district', 'name');
    if (!station) return res.status(404).json(errorResponse('Police station not found.', 404));
    res.json(successResponse(station, 'Police station updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteStation = async (req, res, next) => {
  try {
    const station = await PoliceStation.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json(errorResponse('Police station not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

