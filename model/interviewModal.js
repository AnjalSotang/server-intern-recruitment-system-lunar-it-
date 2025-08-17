const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const interviewSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled", "no_show"],
        default: "scheduled"
    },
    location: {
        type: String,
    },
    meetingLink: {
        type: String,
    },
    duration: {
        type: String,
    },
    notes: {
        type: String,
    },
    applicantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true
    },
    interviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    }
}, {
    timestamps: true
});

const interview = mongoose.model('interview', interviewSchema); // Capitalized model name
module.exports = interview;