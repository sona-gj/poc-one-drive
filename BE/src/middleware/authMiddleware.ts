import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { authService } from '../services/authService.js';

/**
 * Middleware to protect API routes requiring authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const sessionId = auth.split(' ')[1];
    const session = authService.getSession(sessionId);

    if (!session) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
    }

    // Extend the request object with session information
    (req as AuthenticatedRequest).sessionId = sessionId;
    (req as AuthenticatedRequest).session = session;

    next();
}

/**
 * Optional auth middleware - doesn't fail if no auth provided
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;

    if (auth && auth.startsWith('Bearer ')) {
        const sessionId = auth.split(' ')[1];
        const session = authService.getSession(sessionId);

        if (session) {
            (req as AuthenticatedRequest).sessionId = sessionId;
            (req as AuthenticatedRequest).session = session;
        }
    }

    next();
} 