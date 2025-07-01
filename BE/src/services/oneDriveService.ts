import axios, { AxiosResponse } from 'axios';
import { Session, OneDriveItemsResponse, OneDriveItem, FilesQueryParams, SharedItemQueryParams } from '../types/index.js';
import { authService } from './authService.js';

class OneDriveService {
    private readonly baseUrl = 'https://graph.microsoft.com/v1.0';

    /**
     * Perform Graph API request with automatic token refresh
     */
    private async graphRequest<T = any>(
        sessionId: string,
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        url: string,
        data?: any
    ): Promise<T> {
        const session = authService.getSession(sessionId);
        if (!session) {
            throw { status: 401, data: { error: 'Session not found' } };
        }

        // Refresh if token expired
        if (session.expiresAt && Date.now() > session.expiresAt) {
            await authService.refreshAccessToken(sessionId);
        }

        try {
            const res = await axios({
                method,
                url,
                headers: { Authorization: `Bearer ${session.accessToken}` },
                data,
            });
            return res.data;
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                // Token might have expired or revoked – try one refresh
                const ok = await authService.refreshAccessToken(sessionId);
                if (ok) {
                    const res2 = await axios({
                        method,
                        url,
                        headers: { Authorization: `Bearer ${session.accessToken}` },
                        data,
                    });
                    return res2.data;
                }
                throw {
                    status: 401,
                    data: { error: 'Access token expired or invalid. Please log in again.' },
                };
            }

            // Propagate other errors
            if (error.response) {
                throw { status: error.response.status, data: error.response.data };
            } else {
                throw { status: 500, data: { error: error.message } };
            }
        }
    }

    /**
     * Get files and folders from OneDrive
     */
    async getFiles(sessionId: string, params: FilesQueryParams): Promise<OneDriveItemsResponse> {
        let apiUrl: string;

        // Support remote (shared-with-me) folders
        if (params.remoteDriveId && params.remoteItemId) {
            // Check if the item is a file or folder
            const itemUrl = `${this.baseUrl}/drives/${params.remoteDriveId}/items/${params.remoteItemId}`;
            try {
                const itemInfo = await this.graphRequest<OneDriveItem>(sessionId, 'GET', itemUrl);

                if (itemInfo.folder) {
                    // It's a folder, get its children
                    apiUrl = `${this.baseUrl}/drives/${params.remoteDriveId}/items/${params.remoteItemId}/children`;
                    return await this.graphRequest<OneDriveItemsResponse>(sessionId, 'GET', apiUrl);
                } else {
                    // It's a file, return the file info wrapped in a value array
                    return { value: [itemInfo] };
                }
            } catch (err: any) {
                throw { status: err.status || 500, data: err.data || { error: 'Unknown error' } };
            }
        } else if (params.id) {
            apiUrl = `${this.baseUrl}/me/drive/items/${params.id}/children`;
        } else if (params.path) {
            apiUrl = `${this.baseUrl}/me/drive/root:/${encodeURIComponent(params.path)}:/children`;
        } else {
            apiUrl = `${this.baseUrl}/me/drive/root/children`;
        }

        return await this.graphRequest<OneDriveItemsResponse>(sessionId, 'GET', apiUrl);
    }

    /**
     * Get shared files
     */
    async getSharedFiles(sessionId: string): Promise<OneDriveItemsResponse> {
        const apiUrl = `${this.baseUrl}/me/drive/sharedWithMe?allowexternal=true`;
        return await this.graphRequest<OneDriveItemsResponse>(sessionId, 'GET', apiUrl);
    }

    /**
     * Get parent folder of a shared item
     */
    async getSharedItemParent(sessionId: string, itemId: string, params: SharedItemQueryParams): Promise<OneDriveItem> {
        let apiUrl: string;

        if (params.remoteDriveId && params.remoteItemId) {
            apiUrl = `${this.baseUrl}/drives/${params.remoteDriveId}/items/${params.remoteItemId}/parent`;
        } else {
            apiUrl = `${this.baseUrl}/me/drive/items/${itemId}/parent`;
        }

        return await this.graphRequest<OneDriveItem>(sessionId, 'GET', apiUrl);
    }

    /**
     * Create a new folder
     */
    async createFolder(sessionId: string, name: string, parentId?: string): Promise<OneDriveItem> {
        if (!name) {
            throw { status: 400, data: { error: 'Folder name is required' } };
        }

        const apiUrl = parentId
            ? `${this.baseUrl}/me/drive/items/${parentId}/children`
            : `${this.baseUrl}/me/drive/root/children`;

        const body = {
            name: name,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
        };

        return await this.graphRequest<OneDriveItem>(sessionId, 'POST', apiUrl, body);
    }

    /**
     * Upload a file
     */
    async uploadFile(
        sessionId: string,
        fileName: string,
        fileBuffer: Buffer,
        mimeType: string,
        parentId?: string,
        path?: string
    ): Promise<OneDriveItem> {
        const session = authService.getSession(sessionId);
        if (!session) {
            throw { status: 401, data: { error: 'Session not found' } };
        }

        let apiUrl: string;

        if (parentId) {
            apiUrl = `${this.baseUrl}/me/drive/items/${parentId}:/${encodeURIComponent(fileName)}:/content`;
        } else if (path) {
            let fullPath = path;
            if (!fullPath.endsWith(fileName)) {
                if (!fullPath.endsWith('/')) fullPath += '/';
                fullPath += fileName;
            }
            apiUrl = `${this.baseUrl}/me/drive/root:/${encodeURIComponent(fullPath)}:/content`;
        } else {
            apiUrl = `${this.baseUrl}/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
        }

        try {
            const response = await axios.put<OneDriveItem>(apiUrl, fileBuffer, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    'Content-Type': mimeType || 'application/octet-stream',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Upload error:', error.response?.data || error.message);
            throw {
                status: error.response?.status || 500,
                data: error.response?.data || { error: 'Upload failed' },
            };
        }
    }

    /**
     * Rename a file or folder
     */
    async renameItem(sessionId: string, itemId: string, newName: string): Promise<OneDriveItem> {
        if (!newName) {
            throw { status: 400, data: { error: 'New name is required' } };
        }

        const apiUrl = `${this.baseUrl}/me/drive/items/${itemId}`;
        return await this.graphRequest<OneDriveItem>(sessionId, 'PATCH', apiUrl, { name: newName });
    }

    /**
     * Delete a file or folder
     */
    async deleteItem(sessionId: string, itemId: string): Promise<void> {
        const apiUrl = `${this.baseUrl}/me/drive/items/${itemId}`;
        await this.graphRequest(sessionId, 'DELETE', apiUrl);
    }

    /**
     * Share a file/folder with specified emails
     */
    async shareItem(
        sessionId: string,
        itemId: string,
        emails: string[],
        role: 'view' | 'edit' = 'view',
        message: string = ''
    ): Promise<any> {
        if (!itemId || !emails || emails.length === 0) {
            throw { status: 400, data: { error: 'itemId and emails are required' } };
        }

        const recipients = emails.map((email) => ({ email }));
        const permRole = role.toLowerCase() === 'edit' || role.toLowerCase() === 'write' ? 'write' : 'read';

        const apiUrl = `${this.baseUrl}/me/drive/items/${itemId}/invite`;
        const body = {
            recipients: recipients,
            requireSignIn: true,
            sendInvitation: true,
            roles: [permRole],
            message: message,
        };

        return await this.graphRequest(sessionId, 'POST', apiUrl, body);
    }
}

export const oneDriveService = new OneDriveService(); 