// routes/application.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary, applicationStatusCount, getDepartmentChart } = require("../controller/dashboardController");


router.get("/dashboard-summary", getDashboardSummary);
router.get("/dashboard-status", applicationStatusCount);
router.get("/department-chart", getDepartmentChart);


module.exports = router;
