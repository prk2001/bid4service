"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create review (requires auth)
router.post('/', auth_1.authenticate, review_controller_1.createReview);
// Get my reviews
router.get('/my-reviews', auth_1.authenticate, review_controller_1.getMyReviews);
// Get reviews for a user (public)
router.get('/user/:userId', review_controller_1.getUserReviews);
// Get single review (public)
router.get('/:id', review_controller_1.getReview);
// Update review (requires auth)
router.put('/:id', auth_1.authenticate, review_controller_1.updateReview);
// Respond to review (requires auth)
router.post('/:id/respond', auth_1.authenticate, review_controller_1.respondToReview);
// Mark as helpful (requires auth)
router.post('/:id/helpful', auth_1.authenticate, review_controller_1.markHelpful);
exports.default = router;
