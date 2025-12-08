"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bid_controller_1 = require("../controllers/bid.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Provider routes
router.post('/jobs/:jobId/bids', auth_1.authenticate, (0, auth_1.authorize)('PROVIDER'), bid_controller_1.submitBid);
router.get('/my-bids', auth_1.authenticate, (0, auth_1.authorize)('PROVIDER'), bid_controller_1.getMyBids);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('PROVIDER'), bid_controller_1.updateBid);
router.post('/:id/withdraw', auth_1.authenticate, (0, auth_1.authorize)('PROVIDER'), bid_controller_1.withdrawBid);
// Customer routes
router.get('/jobs/:jobId/bids', auth_1.authenticate, bid_controller_1.getJobBids);
router.post('/:id/accept', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), bid_controller_1.acceptBid);
router.post('/:id/reject', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), bid_controller_1.rejectBid);
// Shared routes
router.get('/:id', auth_1.authenticate, bid_controller_1.getBidById);
exports.default = router;
