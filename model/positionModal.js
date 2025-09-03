const { Schema, model } = require('mongoose');
const { ArrayPositionType, PositionType } = require('../utils/constants');


const positionSchema = new Schema({
    title: { type: String, required: true },
    department: String, enum: ['frontend', 'backend', 'fullstack', 'data', 'design', 'product', 'devops'],
    location: String,
    type: { type: String, enum: ["Full-time", "Part-time", "Remote", "Hybrid"] },
    status: { type: String, enum: ArrayPositionType, default: PositionType.active },
    description: String,
    requirements: [String],
    responsibilities: [String],
    qualifications: [String],
    optional: [String],
    salary: String,
    duration: String,
    startDate: Date,
    endDate: Date,
    applicationDeadline: Date,
    maxApplications: Number,
    currentApplications: Number,
    acceptedCandidates: Number,
    tags: [String],
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    experienceLevel: { type: String }
}, { timestamps: true })


const Position = model('Position', positionSchema);
module.exports = Position