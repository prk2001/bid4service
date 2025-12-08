"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get current user profile (requires auth)
router.get('/profile', auth_1.authenticate, user_controller_1.getProfile);
// Update profile (requires auth)
router.put('/profile', auth_1.authenticate, user_controller_1.updateProfile);
// Get user statistics (requires auth)
router.get('/stats', auth_1.authenticate, user_controller_1.getUserStats);
// Upload verification documents (requires auth)
router.post('/verification/documents', auth_1.authenticate, user_controller_1.uploadVerificationDocs);
// Get public profile (public)
router.get('/:userId', user_controller_1.getPublicProfile);
exports.default = router;
