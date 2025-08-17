const express = require('express');
const router = express.Router();
const {
    addMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember,
    getAdmin
} = require('../controller/memberController');

// Create
router.post('/member', addMember);

// Read all
router.get('/member', getMembers);
router.get('/member/admin', getAdmin);

// Read one
router.get('/member/:id', getMemberById);

// Update
router.put('/member/:id', updateMember);

// Delete
router.delete('/member/:id', deleteMember);

module.exports = router;
