import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { config } from '../config/index.js';

class AuthController {
    /**
     * Redirect user to Microsoft OAuth 2.0 authorization endpoint
     */
    login(req: Request, res: Response): void {
        const authUrl = authService.generateAuthUrl();
        res.redirect(authUrl);
    }

    /**
     * OAuth callback – exchange code for tokens
     */
    async callback(req: Request, res: Response): Promise<void> {
        const { code, error, error_description } = req.query;

        if (error) {
            console.error('OAuth error:', error, error_description);
            res.status(500).send(`Authentication error: ${error}`);
            return;
        }

        if (!code || typeof code !== 'string') {
            res.status(400).send('No auth code received');
            return;
        }

        try {
            const { sessionId } = await authService.exchangeCodeForTokens(code);

            // Redirect to frontend with session ID
            res.redirect(`${config.corsOrigin}?sessionId=${sessionId}`);
        } catch (error: any) {
            console.error('Token exchange failed:', error.message);
            res.status(500).json({
                error: 'Token request failed',
                details: error.message
            });
        }
    }

    /**
     * Get session status
     */
    getSessionStatus(req: Request, res: Response): void {
        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No session provided' });
            return;
        }

        const sessionId = auth.split(' ')[1];
        const session = authService.getSession(sessionId);

        if (!session) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }

        const isValid = authService.isValidSession(sessionId);

        res.json({
            valid: isValid,
            expiresAt: session.expiresAt,
            expiresIn: Math.max(0, session.expiresAt - Date.now())
        });
    }

    /**
     * Logout (remove session)
     */
    logout(req: Request, res: Response): void {
        const auth = req.headers.authorization;

        if (auth && auth.startsWith('Bearer ')) {
            const sessionId = auth.split(' ')[1];
            authService.removeSession(sessionId);
        }

        res.json({ message: 'Logged out successfully' });
    }
}

export const authController = new AuthController(); 