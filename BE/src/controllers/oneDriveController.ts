import { Request, Response } from 'express';
import { AuthenticatedRequest, FilesQueryParams, SharedItemQueryParams, CreateFolderRequest, RenameItemRequest, ShareItemRequest } from '../types/index.js';
import { oneDriveService } from '../services/oneDriveService.js';

class OneDriveController {
    /**
     * Get files and folders from OneDrive
     */
    async getFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const params: FilesQueryParams = {
                id: req.query.id as string,
                path: req.query.path as string,
                remoteDriveId: req.query.remoteDriveId as string,
                remoteItemId: req.query.remoteItemId as string,
            };

            const result = await oneDriveService.getFiles(req.sessionId, params);
            res.json(result);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Unknown error' });
        }
    }

    /**
     * Get shared files
     */
    async getSharedFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const result = await oneDriveService.getSharedFiles(req.sessionId);
            res.json(result);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Unknown error' });
        }
    }

    /**
     * Get parent folder of a shared item
     */
    async getSharedItemParent(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { itemId } = req.params;
            const params: SharedItemQueryParams = {
                remoteDriveId: req.query.remoteDriveId as string,
                remoteItemId: req.query.remoteItemId as string,
            };

            const result = await oneDriveService.getSharedItemParent(req.sessionId, itemId, params);
            res.json(result);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Unknown error' });
        }
    }

    /**
     * Create a new folder
     */
    async createFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { name, parentId }: CreateFolderRequest = req.body;

            if (!name) {
                res.status(400).json({ error: 'Folder name is required' });
                return;
            }

            const newFolder = await oneDriveService.createFolder(req.sessionId, name, parentId);
            res.status(201).json(newFolder);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Folder creation failed' });
        }
    }

    /**
     * Upload a file
     */
    async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const fileName = req.file.originalname;
            const fileBuffer = req.file.buffer;
            const mimeType = req.file.mimetype || 'application/octet-stream';
            const parentId = req.body.parentId;
            const path = req.body.path;

            const uploadedFile = await oneDriveService.uploadFile(
                req.sessionId,
                fileName,
                fileBuffer,
                mimeType,
                parentId,
                path
            );

            res.status(201).json(uploadedFile);
        } catch (error: any) {
            console.error('Upload error:', error.response?.data || error.message);
            res.status(error.status || 500).json(error.data || { error: 'Upload failed' });
        }
    }

    /**
     * Rename a file or folder
     */
    async renameItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const itemId = req.params.id;
            const { name }: RenameItemRequest = req.body;

            if (!name) {
                res.status(400).json({ error: 'New name is required' });
                return;
            }

            const updated = await oneDriveService.renameItem(req.sessionId, itemId, name);
            res.json(updated);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Rename failed' });
        }
    }

    /**
     * Delete a file or folder
     */
    async deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const itemId = req.params.id;
            await oneDriveService.deleteItem(req.sessionId, itemId);
            res.status(204).send();
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Delete failed' });
        }
    }

    /**
     * Share a file/folder with specified emails
     */
    async shareItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { itemId, emails, role = 'view', message = '' }: ShareItemRequest = req.body;

            if (!itemId || !emails || emails.length === 0) {
                res.status(400).json({ error: 'itemId and emails are required' });
                return;
            }

            const inviteResponse = await oneDriveService.shareItem(
                req.sessionId,
                itemId,
                emails,
                role,
                message
            );

            res.json(inviteResponse);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Share failed' });
        }
    }

    /**
     * Alternative share endpoint (invite)
     */
    async inviteUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { itemId, emails, role = 'view', message = '' }: ShareItemRequest = req.body;

            if (!itemId || !Array.isArray(emails) || emails.length === 0) {
                res.status(400).json({ error: 'itemId and emails[] are required' });
                return;
            }

            const result = await oneDriveService.shareItem(
                req.sessionId,
                itemId,
                emails,
                role,
                message
            );

            res.status(200).json(result);
        } catch (error: any) {
            res.status(error.status || 500).json(error.data || { error: 'Invite failed' });
        }
    }
}

export const oneDriveController = new OneDriveController(); 