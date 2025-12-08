"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get user's projects
router.get('/', project_controller_1.getUserProjects);
// Get single project
router.get('/:id', project_controller_1.getProject);
// Create milestone
router.post('/:projectId/milestones', project_controller_1.createMilestone);
// Update milestone
router.put('/milestones/:id', project_controller_1.updateMilestone);
// Provider: Mark milestone complete
router.post('/milestones/:id/complete', (0, auth_1.authorize)('PROVIDER'), project_controller_1.completeMilestone);
// Customer: Approve milestone
router.post('/milestones/:id/approve', (0, auth_1.authorize)('CUSTOMER'), project_controller_1.approveMilestone);
// Customer: Reject milestone
router.post('/milestones/:id/reject', (0, auth_1.authorize)('CUSTOMER'), project_controller_1.rejectMilestone);
// Update project status
router.put('/:id/status', project_controller_1.updateProjectStatus);
// Cancel project
router.post('/:id/cancel', project_controller_1.cancelProject);
exports.default = router;
