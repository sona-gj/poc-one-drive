import express, { json } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';

class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Body parsing middleware
        this.app.use(json());

        // CORS middleware
        this.app.use(cors({
            origin: config.corsOrigin,
            credentials: true
        }));
    }

    private initializeRoutes(): void {
        // Mount all routes
        this.app.use('/', routes);
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use('*', notFoundHandler);

        // Global error handler (must be last)
        this.app.use(errorHandler);
    }

    public listen(): void {
        this.app.listen(config.port, () => {
            console.log(`🚀 Backend running on http://localhost:${config.port}/`);
            console.log(`📁 Health check: http://localhost:${config.port}/health`);
            console.log(`🔐 Auth endpoint: http://localhost:${config.port}/auth/login`);
        });
    }
}

export default App; 