import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '@vv/shared-kernel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, ValidationError } from '@vv/shared-kernel';

const router = Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isLength({ min: 3, max: 50 }).isAlphanumeric(),
    body('firstName').isLength({ min: 1, max: 100 }),
    body('lastName').isLength({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data');
      }

      const { email, password, username, firstName, lastName } = req.body;

      const user = await AuthService.createUser({
        email,
        username,
        firstName,
        lastName,
        password,
      });

      const accessToken = AuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = AuthService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
          },
        },
        message: 'User registered successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Login user
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data');
      }

      const { email, password } = req.body;

      const user = await AuthService.authenticateUser(email, password);

      const accessToken = AuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = AuthService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60,
          },
        },
        message: 'Login successful',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Get current user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await AuthService.getUserById(req.user.userId);

    if (!user) {
      throw new ValidationError('User not found');
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', [body('refreshToken').exists()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Refresh token required');
    }

    const { refreshToken } = req.body;

    const decoded = AuthService.verifyToken(refreshToken);

    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 7 * 24 * 60 * 60,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
