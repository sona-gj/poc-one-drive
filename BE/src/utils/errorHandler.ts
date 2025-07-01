import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    status?: number;
    code?: string;
    details?: any;
}

export class CustomError extends Error implements AppError {
    public status: number;
    public code: string;
    public details?: any;

    constructor(message: string, status: number = 500, code?: string, details?: any) {
        super(message);
        this.name = 'CustomError';
        this.status = status;
        this.code = code || 'INTERNAL_ERROR';
        this.details = details;
    }
}

export function createError(message: string, status: number = 500, code?: string, details?: any): CustomError {
    return new CustomError(message, status, code, details);
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
    console.error('Error:', {
        message: err.message,
        status: err.status,
        code: err.code,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    const status = err.status || 500;
    const response: any = {
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR'
    };

    if (process.env.NODE_ENV === 'development' && err.details) {
        response.details = err.details;
    }

    res.status(status).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND',
        path: req.originalUrl
    });
} 