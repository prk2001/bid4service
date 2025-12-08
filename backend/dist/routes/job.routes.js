"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create new job (customers only)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), job_controller_1.createJob);
// Get all jobs (public with optional auth)
router.get('/', auth_1.optionalAuthenticate, job_controller_1.getAllJobs);
// Get current user's jobs (customers only)
router.get('/my-jobs', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), job_controller_1.getMyJobs);
// Get job by ID (public with optional auth)
router.get('/:id', auth_1.optionalAuthenticate, job_controller_1.getJobById);
// Update job (customers only, own jobs)
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), job_controller_1.updateJob);
// Delete job (customers only, own jobs)
router.delete('/:id', auth_1.authenticate, job_controller_1.deleteJob);
// Close job to bidding (customers only)
router.post('/:id/close', auth_1.authenticate, (0, auth_1.authorize)('CUSTOMER'), job_controller_1.closeJob);
exports.default = router;
