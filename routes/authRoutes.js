// routes/auth.js
const express = require('express');
const router = express.Router();
const { 
    updateUser,
    login,
    deleteAdmin,
    viewUser,
    resetPassword,
    changePassword,
    forgotPassword,
    // NEW 2FA imports
    enable2FA,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
    get2FAStatus
} = require("../controller/authController");
const { upload } = require('../middleware/mullterConfiguration');
const { checkTokenAndRole } = require('../middleware/checkTokenAndRole');

// Public routes
router.post('/login', login);

// NEW: 2FA Login verification (public route - called after initial login)
router.post('/verify-2fa-login', verify2FALogin);

// Password reset routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes - require authentication
router.put(
    "/admin/change-password",
    checkTokenAndRole('admin'),
    changePassword
);

// NEW: 2FA Management Routes (protected - require authentication)
router.get(
    "/2fa/status",
    checkTokenAndRole('admin'), // or checkTokenAndRole(['admin', 'user']) if you have multiple roles
    get2FAStatus
);

router.post(
    "/2fa/enable",
    checkTokenAndRole('admin'),
    enable2FA
);

router.post(
    "/2fa/verify-setup",
    checkTokenAndRole('admin'),
    verify2FASetup
);

router.post(
    "/2fa/disable",
    checkTokenAndRole('admin'),
    disable2FA
);

// User management routes
router.put(
    "/admin/:id",
    checkTokenAndRole('admin'),
    upload.single('image'),
    updateUser
);

router.delete(
    "/admin/:role", 
    deleteAdmin
);

router.get(
    "/admin", 
    checkTokenAndRole('admin'),
    viewUser
);

module.exports = router;