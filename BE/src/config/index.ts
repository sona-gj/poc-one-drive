import dotenv from 'dotenv';
import { AppConfig, OAuthConfig } from '../types/index.js';

dotenv.config();

const oauthConfig: OAuthConfig = {
    clientId: process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
    clientSecret: process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
    redirectUri: process.env.REDIRECT_URI || '',
    tenant: process.env.AUTH_TENANT || 'common',
    scopes: 'Files.ReadWrite.All offline_access'
};

export const config: AppConfig = {
    port: parseInt(process.env.PORT || '5001'),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    oauth: oauthConfig
};

export const OAUTH_AUTHORIZE_URL = `https://login.microsoftonline.com/${config.oauth.tenant}/oauth2/v2.0/authorize`;
export const OAUTH_TOKEN_URL = `https://login.microsoftonline.com/${config.oauth.tenant}/oauth2/v2.0/token`; 