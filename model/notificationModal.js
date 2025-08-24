    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    const notificationSchema = new Schema({
        type: {
            type: String
        },
        title: {
            type: String
        },
        message: {
            type: String,
        },
        time: {
            type: String
        },
        date: {
            type: Date,
        },
        read: {
            type: Boolean,
        },
        avatar: {
            type: String,
        },
        actionUrl: {
            type: String,
        },
        priority: {
            type: String,
        },
    }, {
        timestamps: true
    });

    const Notification = mongoose.model('Notification', notificationSchema); // Capitalized model name
    module.exports = Notification;