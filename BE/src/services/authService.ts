import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Session, Sessions, TokenResponse, OAuthError } from '../types/index.js';
import { config, OAUTH_TOKEN_URL } from '../config/index.js';

class AuthService {
    private sessions: Sessions = {};

    /**
     * Generate OAuth authorization URL
     */
    generateAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: config.oauth.clientId,
            response_type: 'code',
            redirect_uri: config.oauth.redirectUri,
            response_mode: 'query',
            scope: config.oauth.scopes,
        });

        return `https://login.microsoftonline.com/${config.oauth.tenant}/oauth2/v2.0/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<{ sessionId: string; session: Session }> {
        const params = new URLSearchParams({
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.oauth.redirectUri,
            scope: config.oauth.scopes,
        });

        try {
            const tokenRes = await axios.post<TokenResponse>(OAUTH_TOKEN_URL, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const data = tokenRes.data;
            const sessionId = uuidv4();
            const session: Session = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + data.expires_in * 1000 - 5 * 60 * 1000, // 5 min buffer
            };

            this.sessions[sessionId] = session;
            console.log(`New session ${sessionId} (expires in ${data.expires_in}s)`);

            return { sessionId, session };
        } catch (error: any) {
            const details = error.response?.data || error.message;
            console.error('Token exchange failed:', details);
            throw new Error(`Token request failed: ${JSON.stringify(details)}`);
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(sessionId: string): Promise<boolean> {
        const session = this.sessions[sessionId];
        if (!session || !session.refreshToken) return false;

        try {
            const params = new URLSearchParams({
                client_id: config.oauth.clientId,
                client_secret: config.oauth.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: session.refreshToken,
                redirect_uri: config.oauth.redirectUri,
                scope: config.oauth.scopes,
            });

            const response = await axios.post<TokenResponse>(OAUTH_TOKEN_URL, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const data = response.data;

            // Update tokens in session
            session.accessToken = data.access_token;
            if (data.refresh_token) {
                session.refreshToken = data.refresh_token; // refresh token might be rotated
            }
            session.expiresAt = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000; // 5 min buffer

            return true;
        } catch (error: any) {
            console.error('Refresh token error:', error.response?.data || error.message);
            delete this.sessions[sessionId]; // remove session if refresh failed
            return false;
        }
    }

    /**
     * Get session by session ID
     */
    getSession(sessionId: string): Session | undefined {
        return this.sessions[sessionId];
    }

    /**
     * Remove session
     */
    removeSession(sessionId: string): void {
        delete this.sessions[sessionId];
    }

    /**
     * Check if session exists and is valid
     */
    isValidSession(sessionId: string): boolean {
        const session = this.sessions[sessionId];
        return !!session && session.expiresAt > Date.now();
    }

    /**
     * Get all sessions (for debugging)
     */
    getAllSessions(): Sessions {
        return { ...this.sessions };
    }
}

export const authService = new AuthService(); 