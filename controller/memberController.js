const Member = require('../model/memberModal');
const { createMemberNotification, createMemberUpdateNotification } = require('./notificationController');

const getMemberChanges = (existing, updated) => {
    const changes = [];
    
    // Check role changes (most important)
    if (existing.role !== updated.role) {
        changes.push({
            type: 'role',
            oldValue: existing.role,
            newValue: updated.role
        });
    }
    
    // Check department changes
    if (existing.department !== updated.department) {
        changes.push({
            type: 'department',
            oldValue: existing.department,
            newValue: updated.department
        });
    }
    
    // Check name changes
    if (existing.name !== updated.name) {
        changes.push({
            type: 'name',
            oldValue: existing.name,
            newValue: updated.name
        });
    }
    
    // Check email changes
    if (existing.email !== updated.email) {
        changes.push({
            type: 'email',
            oldValue: existing.email,
            newValue: updated.email
        });
    }
    
    return changes;
};



const addMember = async (req, res) => {
    try {
        const { name, email, phone, role, bio, department } = req.body;

        // Validation (basic check)
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }
        if (role && role.toLowerCase() === 'admin') {
            return res.status(400).json({ message: "Role is invalid" });
        }


        // Create and save member
        const member = new Member({
            name,
            email,
            phone,
            role,
            bio,
            department
        });

        const savedMember = await member.save();
        res.status(201).json({
            data: savedMember,
            message: `New Member ${name} added successfully`
        })

  // Create notification in background
        setImmediate(async () => {
            try {
                await createMemberNotification(savedMember);
            } catch (notificationError) {
                console.error(`❌ Failed to create notification for member ${savedMember.name}:`, notificationError);
            }
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getMembers = async (req, res) => {
    try {
        const members = await Member.find().sort({ createdAt: -1 });
        res.status(200).json({ data: members });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single member by ID
// @route   GET /api/members/:id
const getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.status(200).json(member);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



const getAdmin = async (req, res) => {
    try {
        const member = await Member.find();
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.status(200).json({data: member});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



// @desc    Update a member
// @route   PUT /api/members/:id
const updateMember = async (req, res) => {
    try {
        const memberId = req.params.id;
        
        // First, get the existing member data to compare changes
        const existingMember = await Member.findById(memberId);
        if (!existingMember) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Prevent role update to 'admin' if it's in the request
        if (req.body.role && req.body.role.toLowerCase() === 'admin') {
            return res.status(400).json({ message: "Role cannot be updated to admin" });
        }

        // Update the member
        const updatedMember = await Member.findByIdAndUpdate(
            memberId,
            req.body,
            { new: true, runValidators: true }
        );

        // Detect what changed
        const changes = getMemberChanges(existingMember, updatedMember);

        // Respond to client immediately
        res.status(200).json({
            data: updatedMember,
            message: "Member details successfully updated!"
        });

        // Create notification in background (only if there were significant changes)
        const significantChanges = changes.filter(change => 
            ['role', 'department', 'name'].includes(change.type)
        );

        if (significantChanges.length > 0) {
            setImmediate(async () => {
                try {
                    await createMemberUpdateNotification(existingMember, updatedMember, changes);
                } catch (notificationError) {
                    console.error(`❌ Failed to create notification for member ${updatedMember.name}:`, notificationError);
                }
            });
        }

    } catch (error) {
        console.error('Member update error:', error);

        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'A member with this email already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                message: 'Validation failed',
                details: validationErrors
            });
        }

        res.status(500).json({ 
            message: 'Server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// @desc    Delete a member
// @route   DELETE /api/members/:id
const deleteMember = async (req, res) => {
    try {
        const deletedMember = await Member.findByIdAndDelete(req.params.id);
        if (!deletedMember) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    addMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember,
    getAdmin
};
