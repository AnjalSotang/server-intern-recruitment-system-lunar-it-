const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    name: {
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
    role: {
        type: String, 
        required: true,
        trim: true
    },
     bio: {
        type: String, 
        trim: true
    },
    status: {
        type: String, 
        default: "active",
    },
    department: {
        type: String, 
        required: true,
    }
}, {
    timestamps: true
});

const Member = mongoose.model('Member', memberSchema); // Capitalized model name
module.exports = Member;