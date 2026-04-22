import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '@vv/shared-kernel';
import { AuthenticationError } from '@vv/shared-kernel';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      throw new AuthenticationError('Insufficient permissions');
    }

    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
