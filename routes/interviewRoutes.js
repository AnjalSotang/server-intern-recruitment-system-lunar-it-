const express = require('express');
const router = express.Router();
const { scheduleInterview, fetchInterview, updateInterview, deleteInterview, permanentDeleteInterview, getInterviewSummary } = require('../controller/interviewController');

// Create
router.post('/interview', scheduleInterview);

// // Read all
router.get('/interview', fetchInterview);
router.get('/interview-summary', getInterviewSummary);

// // Read one
// router.get('/member/:id', getMemberById);

// // Update
router.put('/interview/:id', updateInterview);

// // Delete
router.delete('/interview/:id', deleteInterview);

router.delete('/interview/:id/permanent', permanentDeleteInterview);


module.exports = router;
