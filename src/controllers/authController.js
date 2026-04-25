import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

// POST /api/auth/register  (admin only — enforced in route)
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, policeStation, vehicle } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res
        .status(409)
        .json(errorResponse('Username or email already in use.', 409));
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      policeStation,
      vehicle,
    });

    const token = signToken(user._id, user.role);
    res.status(201).json(
      successResponse(
        {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
        'User registered successfully.'
      )
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(errorResponse('Invalid email or password.', 401));
    }
    if (!user.isActive) {
      return res.status(401).json(errorResponse('Account is deactivated.', 401));
    }

    const token = signToken(user._id, user.role);
    res.json(
      successResponse(
        {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
        'Login successful.'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('policeStation', 'name district')
    .populate('vehicle', 'registrationNumber status');
  res.json(successResponse(user, 'Current user profile.'));
};

