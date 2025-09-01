const {mongoose, Schema} = require('mongoose');

const messageSchema = new Schema({
    firstName: { 
        type: String, 
        required: true },
    lastName: { 
        type: String, 
        required: true,
          },
    email: { 
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ["new", "read", "replied", "archived"], default: "new"},
    priority: { type: String, required: true, enum: ["low", "medium", "high"], default: "medium"},
},
 { timestamps: true })


const Message = mongoose.model('Message', messageSchema);
module.exports = Message;