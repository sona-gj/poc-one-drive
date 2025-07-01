import { Router } from 'express';
import authRoutes from './authRoutes.js';
import oneDriveRoutes from './oneDriveRoutes.js';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/api', oneDriveRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'OneDrive POC Backend'
    });
});

export default router; 