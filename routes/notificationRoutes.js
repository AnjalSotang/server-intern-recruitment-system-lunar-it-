// routes/notifications.js
const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    getUnreadCount
} = require('../controller/notificationController');

router.get('/notification', getNotifications);
router.get('/notification/stats', getNotificationStats);
router.put('/notification/:id/read', markAsRead);
router.put('/notification/mark-all-read', markAllAsRead);
router.delete('/notification/:id', deleteNotification);
router.get('/notification/unread-count', getUnreadCount)

module.exports = router;