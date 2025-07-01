import { Router, Request, Response } from 'express';
import multer from 'multer';
import { oneDriveController } from '../controllers/oneDriveController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const upload = multer(); // middleware for file uploads

// Apply authentication middleware to all routes
router.use(requireAuth);

// File and folder operations
router.get('/files', (req: Request, res: Response) => oneDriveController.getFiles(req as AuthenticatedRequest, res));
router.get('/shared', (req: Request, res: Response) => oneDriveController.getSharedFiles(req as AuthenticatedRequest, res));
router.get('/shared/:itemId/parent', (req: Request, res: Response) => oneDriveController.getSharedItemParent(req as AuthenticatedRequest, res));

// Create operations
router.post('/create-folder', (req: Request, res: Response) => oneDriveController.createFolder(req as AuthenticatedRequest, res));
router.put('/upload', upload.single('file'), (req: Request, res: Response) => oneDriveController.uploadFile(req as AuthenticatedRequest, res));

// Update operations
router.patch('/items/:id', (req: Request, res: Response) => oneDriveController.renameItem(req as AuthenticatedRequest, res));

// Delete operations
router.delete('/items/:id', (req: Request, res: Response) => oneDriveController.deleteItem(req as AuthenticatedRequest, res));

// Share operations
router.post('/share', (req: Request, res: Response) => oneDriveController.shareItem(req as AuthenticatedRequest, res));
router.post('/invite', (req: Request, res: Response) => oneDriveController.inviteUsers(req as AuthenticatedRequest, res));

export default router; 