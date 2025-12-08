"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Upload single file
router.post('/', upload_controller_1.upload.single('file'), upload_controller_1.uploadFile);
// Upload multiple files (max 10)
router.post('/multiple', upload_controller_1.upload.array('files', 10), upload_controller_1.uploadMultipleFiles);
// Get file info
router.get('/:filename', upload_controller_1.getFileInfo);
// Delete file
router.delete('/:filename', upload_controller_1.deleteFile);
exports.default = router;
