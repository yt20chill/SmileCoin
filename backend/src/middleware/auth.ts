import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { sessionService } from '../services/sessionService';
import { JwtPayload } from '../types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    // Check if session exists in Redis
    const sessionExists = await sessionService.isSessionValid(decoded.userId);
    
    if (!sessionExists) {
      res.status(401).json({ 
        success: false,
        error: 'Session expired',
        message: 'Please login again'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false,
        error: 'Token expired',
        message: 'Please login again'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ 
        success: false,
        error: 'Invalid token',
        message: 'Please provide a valid authentication token'
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      
      // Check if session exists in Redis
      const sessionExists = await sessionService.isSessionValid(decoded.userId);
      
      if (sessionExists) {
        req.user = decoded;
      }
    } catch (error) {
      // Token is invalid, but we continue without user context
      req.user = undefined;
    }
  }

  next();
};

/**
 * Middleware to check if user is authenticated and has valid session
 */
export const requireAuth = authenticateToken;

/**
 * Middleware to extract user info if token is provided (optional)
 */
export const extractUser = optionalAuth;