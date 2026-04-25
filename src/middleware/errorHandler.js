import { errorResponse } from '../utils/response.js';

const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json(errorResponse(messages.join('. '), 400));
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(errorResponse(`Duplicate value for field: ${field}`, 409));
  }
  if (err.name === 'CastError') {
    return res.status(400).json(errorResponse(`Invalid ID: ${err.value}`, 400));
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token.', 401));
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token has expired.', 401));
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json(errorResponse(message, statusCode));
};

export default errorHandler;