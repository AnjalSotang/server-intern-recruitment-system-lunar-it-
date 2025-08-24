const Position = require('../model/positionModal');

// Controller to handle position creation
const createPosition = async (req, res) => {
    try {
        // Extract data from request body
        const {
            title,
            department,
            location,
            type,
            description,
            requirements,
            responsibilities,
            qualifications,
            optional,
            salary,
            duration,
            startDate,
            endDate,
            applicationDeadline,
            maxApplications,
            tags,
            priority,
            experienceLevel
        } = req.body;

        // Create new position
        const newPosition = await Position.create({
            title,
            department,
            location,
            type,
            description,
            requirements,
            responsibilities,
            qualifications,
            optional,
            salary,
            duration,
            startDate,
            endDate,
            applicationDeadline,
            maxApplications,
            tags,
            priority,
            experienceLevel
        });

        res.status(201).json({
            message: "Position created successfully",
            data: newPosition
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating position",
            error: error.message
        });
    }
}



const viewPosition = async (req, res) => {

    try {
        const role = req.user.role;
        let positions;

        if (role === "admin") {
            positions = await Position.find();
        } else {
            positions = await Position.find({ status: "Active" })
        }

        if (positions.length === 0) {
            return res.status(200).json({ data: positions, message: "No positions found" });
        }

        res.status(200).json({
            message: "Positions retrieved successfully",
            data: positions
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error retrieving positions",
            error: error.message
        });
    }
}

const viewPositionById = async (req, res) => {
    try {
        const positionId = req.params.id;
        const position = await Position.findById(positionId);

        if (!position) {
            return res.status(200).json({ data: position, message: "Position not found" });
        }

        res.status(200).json({
            message: "Position retrieved successfully",
            data: position
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving position",
            error: error.message
        });
    }
}

const updatePosition = async (req, res) => {
    try {
        const positionId = req.params.id;

        // req.body will contain only the fields you want to update
        const updatedPosition = await Position.findByIdAndUpdate(
            positionId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPosition) {
            return res.status(404).json({ message: "Position not found" });
        }

        res.status(200).json({
            message: "Position updated successfully",
            data: updatedPosition,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating position",
            error: error.message,
        });
    }
};

const deletePostion = async (req, res) => {
    try {
        const positionId = req.params.id;
        const deletedPosition = await Position.findByIdAndDelete(positionId);

        if (!deletedPosition) {
            return res.status(404).json({ message: "Position not found" });
        }

        res.status(200).json({
            message: "Position deleted successfully",
            data: deletedPosition
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting position",
            error: error.message
        });
    }
}



module.exports = {
    createPosition,
    deletePostion,
    viewPosition,
    viewPositionById,
    updatePosition
}