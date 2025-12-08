"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = [];
    // Log error
    logger_1.default.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });
    // Handle known operational errors
    if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        if (err instanceof errors_1.ValidationError) {
            errors = err.errors;
        }
    }
    // Handle Prisma errors
    else if (err.name === 'PrismaClientKnownRequestError') {
        statusCode = 400;
        message = 'Database error occurred';
        // Handle specific Prisma error codes
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            message = 'A record with this value already exists';
        }
        else if (prismaError.code === 'P2025') {
            message = 'Record not found';
            statusCode = 404;
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Handle validation errors from express-validator
    else if (err.name === 'ValidationError') {
        statusCode = 422;
        message = 'Validation failed';
    }
    // Build error response
    const response = {
        success: false,
        message,
    };
    if (errors.length > 0) {
        response.errors = errors;
    }
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
