import { errorResponse } from '../utils/response.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(`Role '${req.user.role}' is not authorized to access this resource.`)
      );
    }
    next();
  };
};