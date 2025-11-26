"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.logout = exports.getCurrentUser = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role, phone, } = req.body;
        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role) {
            throw new errors_1.BadRequestError('All fields are required');
        }
        // Validate role
        if (!['CUSTOMER', 'PROVIDER'].includes(role)) {
            throw new errors_1.BadRequestError('Invalid role. Must be CUSTOMER or PROVIDER');
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                phone,
                role,
                emailVerified: false,
                phoneVerified: false,
                // Create profile based on role
                ...(role === 'CUSTOMER' && {
                    customerProfile: {
                        create: {},
                    },
                }),
                ...(role === 'PROVIDER' && {
                    providerProfile: {
                        create: {},
                    },
                }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        logger_1.default.info(`New user registered: ${user.email} (${user.role})`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            throw new errors_1.BadRequestError('Email and password are required');
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                customerProfile: true,
                providerProfile: true,
            },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throw new errors_1.UnauthorizedError('Account is not active. Please contact support.');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        logger_1.default.info(`User logged in: ${user.email}`);
        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * Get current user
 * GET /api/v1/auth/me
 */
const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                customerProfile: true,
                providerProfile: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                phoneVerified: true,
                emailVerified: true,
                profileImage: true,
                role: true,
                status: true,
                verificationStatus: true,
                customerProfile: true,
                providerProfile: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        res.status(200).json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Logout user (client-side token removal)
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
    try {
        // In JWT-based auth, logout is typically handled client-side by removing the token
        // Here we can just log the event
        if (req.user) {
            logger_1.default.info(`User logged out: ${req.user.email}`);
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
/**
 * Change password
 * PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new errors_1.BadRequestError('Current password and new password are required');
        }
        if (newPassword.length < 8) {
            throw new errors_1.BadRequestError('New password must be at least 8 characters long');
        }
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Verify current password
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Current password is incorrect');
        }
        // Hash new password
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash },
        });
        logger_1.default.info(`Password changed for user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
