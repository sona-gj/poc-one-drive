import { createError } from './errorHandler.js';

export class ValidationError extends Error {
    public status: number = 400;
    public code: string = 'VALIDATION_ERROR';
    public details: any;

    constructor(message: string, details?: any) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

export function validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
        throw new ValidationError(`${fieldName} is required`);
    }
}

export function validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): void {
    validateRequired(value, fieldName);

    if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`);
    }

    if (minLength !== undefined && value.length < minLength) {
        throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
    }

    if (maxLength !== undefined && value.length > maxLength) {
        throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters long`);
    }
}

export function validateEmail(email: string): void {
    validateString(email, 'Email');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
}

export function validateArray(value: any, fieldName: string, minLength?: number): void {
    validateRequired(value, fieldName);

    if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`);
    }

    if (minLength !== undefined && value.length < minLength) {
        throw new ValidationError(`${fieldName} must have at least ${minLength} items`);
    }
}

export function validateEnum(value: any, fieldName: string, allowedValues: any[]): void {
    validateRequired(value, fieldName);

    if (!allowedValues.includes(value)) {
        throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
}

export function validateFile(file: any, fieldName: string, maxSize?: number, allowedTypes?: string[]): void {
    validateRequired(file, fieldName);

    if (!file.buffer || !file.originalname) {
        throw new ValidationError(`${fieldName} must be a valid file`);
    }

    if (maxSize !== undefined && file.size > maxSize) {
        throw new ValidationError(`${fieldName} size must be less than ${maxSize} bytes`);
    }

    if (allowedTypes !== undefined && !allowedTypes.includes(file.mimetype)) {
        throw new ValidationError(`${fieldName} type must be one of: ${allowedTypes.join(', ')}`);
    }
} 