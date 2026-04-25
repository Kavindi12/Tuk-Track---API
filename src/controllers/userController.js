import User from '../models/User.js';
import { successResponse, errorResponse, getPagination } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, sort = 'username', order = 'asc', page = 1, limit = 25 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      User.find(filter)
        .populate('policeStation', 'name')
        .populate('vehicle', 'registrationNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json(successResponse(data, 'Users retrieved.', getPagination(page, limit, total)));
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('policeStation', 'name')
      .populate('vehicle', 'registrationNumber');
    if (!user) return res.status(404).json(errorResponse('User not found.', 404));
    res.json(successResponse(user, 'User retrieved.'));
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Prevent password update through this endpoint
    delete req.body.password;
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json(errorResponse('User not found.', 404));
    res.json(successResponse(user, 'User updated.'));
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json(errorResponse('User not found.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

