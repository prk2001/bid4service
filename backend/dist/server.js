"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Load environment variables
const social_routes_1 = __importDefault(require("./routes/social.routes"));
dotenv_1.default.config();
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const bid_routes_1 = __importDefault(require("./routes/bid.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
// Import logger
const logger_1 = __importDefault(require("./utils/logger"));
// Initialize Express app
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.set("trust proxy", 1);
// ============================================
// MIDDLEWARE
// ============================================
// Security middleware
app.use((0, helmet_1.default)());
// Enable CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://web-production-3651c.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001'
];
app.use((0, cors_1.default)({ origin: true, credentials: true }));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression middleware
app.use((0, compression_1.default)());
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => logger_1.default.info(message.trim())
        }
    }));
}
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
});
app.use('/api/', limiter);
// ============================================
// API DOCUMENTATION (Swagger)
// ============================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bid4Service API',
            version: '1.0.0',
            description: 'API documentation for Bid4Service platform',
            contact: {
                name: 'Bid4Service Support',
                email: 'support@bid4service.com'
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' ? 'https://web-production-3651c.up.railway.app' :
                    'http://localhost:${process.env.PORT || 5000}',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// ============================================
// ROUTES
// ============================================
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/jobs', job_routes_1.default);
app.use('/api/v1', bid_routes_1.default); // Mounted at /api/v1 for job bids
app.use('/api/v1/bids', bid_routes_1.default); // Also available at /api/v1/bids for general bid routes
app.use('/api/v1/projects', project_routes_1.default);
app.use('/api/v1/messages', message_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/upload', upload_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/social', social_routes_1.default);
// ============================================
// ERROR HANDLING
// ============================================
// 404 handler
app.use(notFound_1.notFound);
// Global error handler
app.use(errorHandler_1.errorHandler);
// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger_1.default.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger_1.default.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.default.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger_1.default.error('Uncaught Exception:', err);
    process.exit(1);
});
exports.default = app;
