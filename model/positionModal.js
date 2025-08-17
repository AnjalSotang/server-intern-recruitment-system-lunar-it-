const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const positionSchema = new Schema({
    title: { type: String, required: true },
    department: String,
    location: String,
    type: { type: String, enum: ["Full-time", "Part-time", "Remote", "Hybrid"] },
    status: { type: String, enum: ["active", "closed"], default: "active" },
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
}, {timestamps: true})


const Position = mongoose.model('Position', positionSchema);
module.exports = Position;