const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String, // Changed from Number to String to handle international formats
        trim: true
    },
    university: {
        type: String,
        required: true,
        trim: true
    },
    major: {
        type: String,
        required: true,
        trim: true
    },
    graduationYear: {
        type: Number,
        required: true,
        min: [2024, 'Graduation year must be 2024 or later'],
        max: [2030, 'Graduation year must be 2030 or earlier']
    },
    gpa: {
        type: String, // Changed from Float16Array to String to handle formats like "3.8/4.0"
        trim: true
        // Note: GPA is optional in the form, so removed required: true
    },
    portfolioUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+\..+/.test(v);
            },
            message: 'Portfolio URL must be a valid URL starting with http:// or https://'
        }
    },
    githubUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+\..+/.test(v);
            },
            message: 'GitHub URL must be a valid URL starting with http:// or https://'
        }
    },
    linkedinUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+\..+/.test(v);
            },
            message: 'LinkedIn URL must be a valid URL starting with http:// or https://'
        }
    },
    coverLetter: {
        type: String,
        trim: true
    },
    additionalInfo: {
        type: String,
        trim: true
    },
    skills: {
        type: [String],
        default: [] // Added default empty array
    },
    // File path or URL for resume document
    resume: {
        type: String,
        trim: true
        // Note: Resume is not required since it's optional in the form
    },
    // Relationship with Position model
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position', // Changed to capitalized 'Position' (standard convention)
        required: true
    },
    positionTitle: {
        type: String,
        trim: true
    },
    department: String, enum: ['frontend', 'backend', 'fullstack', 'data', 'design', 'product', 'devops'],
    status: {
        type: String,
        enum: ["pending", "reviewing", "interview-scheduled", "accepted", "rejected"],
        default: "pending"
    },
    priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal"
    },
    appliedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
applicationSchema.index({ email: 1 });
applicationSchema.index({ position: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedDate: -1 });

// Virtual for full name
applicationSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
applicationSchema.set('toJSON', {
    virtuals: true
});

const Application = mongoose.model('Application', applicationSchema); // Capitalized model name
module.exports = Application;