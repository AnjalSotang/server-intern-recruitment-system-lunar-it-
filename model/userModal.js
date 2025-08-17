const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String },
    email: {
        type: String,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: String,
    password: String,
    role: { type: String, default: "admin" },
    bio: String,
    image: String,
    twoFASecret: {
        type: String,  // Changed from STRING to String (Mongoose syntax)
        default: null,
    },
    is2FAEnabled: {
        type: Boolean,  // Changed from BOOLEAN to Boolean (Mongoose syntax)
        default: false,
    },
}, { timestamps: true })

const User = mongoose.model('User', userSchema);
module.exports = User;