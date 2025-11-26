"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const errors_1 = require("../utils/errors");
const notFound = (req, res, next) => {
    next(new errors_1.NotFoundError(`Route ${req.originalUrl} not found`));
};
exports.notFound = notFound;
