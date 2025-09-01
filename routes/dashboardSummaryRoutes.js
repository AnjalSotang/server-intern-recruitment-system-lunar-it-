// routes/application.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary, applicationStatusCount } = require("../controller/dashboardController");


router.get("/dashboard-summary", getDashboardSummary);
router.get("/dashboard-status", applicationStatusCount);


module.exports = router;
