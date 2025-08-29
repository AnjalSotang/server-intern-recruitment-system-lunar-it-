// routes/application.js
const express = require('express');
const router = express.Router();
const { 
    postApplication,
    getApplication,
    updateApplicationStatus,
    getApplications,
    downloadResume,
    deleteApplication,
    sendApplicationMessage,
    getApplicationSummary
} = require("../controller/applicationController");
const { upload } = require('../middleware/mullterConfiguration');
const { checkTokenAndRole } = require('../middleware/checkTokenAndRole');

router.post("/application/:id", upload.single('resume'), postApplication);

router.get("/application", checkTokenAndRole(['admin']), getApplications);
router.get("/application/:id", getApplication);
router.get("/applicationSummary", getApplicationSummary);
router.put("/application/:id/status", updateApplicationStatus);
router.get('/application/:applicationId/resume', downloadResume);
router.delete('/application/:id', deleteApplication);
router.post("/application/:id/message", sendApplicationMessage);

module.exports = router;
