const Member = require('../model/memberModal');

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
        }

        );
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
        const updatedMember = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedMember) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json({
            data: updatedMember,
            message: "Member Detail is sucessfully updated!!"
        }
        );
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
