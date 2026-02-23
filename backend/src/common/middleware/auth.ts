import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

// Admin email - only this email has admin access
const ADMIN_EMAIL = 'jcsabbagh02@gmail.com';

export interface JWTPayload {
  userId: string;
  role: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Main authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Token invalid but continue anyway for optional auth
    next();
  }
};

// Generic role checker
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Coach only middleware
export const coachOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'COACH') {
    return res.status(403).json({ error: 'Coach access required' });
  }

  next();
};

// Parent only middleware
export const parentOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'PARENT') {
    return res.status(403).json({ error: 'Parent access required' });
  }

  next();
};

// Coach or Parent middleware
export const coachOrParent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'COACH' && req.user.role !== 'PARENT') {
    return res.status(403).json({ error: 'Coach or Parent access required' });
  }

  next();
};

// Admin only middleware
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user email is the admin email
  const prisma = (await import('../../database/prisma')).default;
  
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { email: true },
  });

  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};