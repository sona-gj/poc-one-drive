import { Router, Request, Response } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// OAuth flow routes
router.get('/login', (req: Request, res: Response) => authController.login(req, res));
router.get('/callback', (req: Request, res: Response) => authController.callback(req, res));

// Session management routes
router.get('/session', requireAuth, (req: Request, res: Response) => authController.getSessionStatus(req, res));
router.post('/logout', requireAuth, (req: Request, res: Response) => authController.logout(req, res));

export default router; 