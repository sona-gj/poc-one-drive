import { Request } from 'express';

// Session management
export interface Session {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface Sessions {
    [sessionId: string]: Session;
}

// OAuth and Microsoft Graph types
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface OAuthError {
    error: string;
    error_description?: string;
}

// OneDrive item types
export interface OneDriveItem {
    id: string;
    name: string;
    size?: number;
    lastModifiedDateTime: string;
    createdDateTime: string;
    webUrl: string;
    '@microsoft.graph.downloadUrl'?: string;
    folder?: {
        childCount: number;
    };
    file?: {
        mimeType: string;
    };
    parentReference?: {
        id: string;
        driveId: string;
    };
}

export interface OneDriveItemsResponse {
    value: OneDriveItem[];
    '@odata.nextLink'?: string;
}

// Request/Response DTOs
export interface CreateFolderRequest {
    name: string;
    parentId?: string;
}

export interface RenameItemRequest {
    name: string;
}

export interface ShareItemRequest {
    itemId: string;
    emails: string[];
    role?: 'view' | 'edit';
    message?: string;
}

export interface UploadFileRequest {
    parentId?: string;
    path?: string;
}

export interface FilesQueryParams {
    id?: string;
    path?: string;
    remoteDriveId?: string;
    remoteItemId?: string;
}

export interface SharedItemQueryParams {
    remoteDriveId?: string;
    remoteItemId?: string;
}

// Extended Express Request with session
export interface AuthenticatedRequest extends Request {
    sessionId: string;
    session: Session;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ErrorResponse {
    error: string;
    details?: any;
}

// Configuration types
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    tenant: string;
    scopes: string;
}

export interface AppConfig {
    port: number;
    corsOrigin: string;
    oauth: OAuthConfig;
} 