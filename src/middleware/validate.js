import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json(errorResponse(messages.join('. '), 400));
  }
  next();
};

export default validate;
