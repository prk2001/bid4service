"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Setup payment method
router.post('/setup-intent', payment_controller_1.createSetupIntent);
// Customer only - fund escrow
router.post('/escrow', (0, auth_1.authorize)('CUSTOMER'), payment_controller_1.fundEscrow);
// Customer only - release payments
router.post('/release-milestone', (0, auth_1.authorize)('CUSTOMER'), payment_controller_1.releaseMilestone);
router.post('/release-final', (0, auth_1.authorize)('CUSTOMER'), payment_controller_1.releaseFinalPayment);
// Request refund
router.post('/refund', payment_controller_1.requestRefund);
// Get payment history
router.get('/history', payment_controller_1.getPaymentHistory);
// Get project payments
router.get('/project/:projectId', payment_controller_1.getProjectPayments);
exports.default = router;
