import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userType: {
        type: String,
        enum: ['USER', 'LABOUR', 'CONTRACTOR', 'ADMIN'],
        default: 'USER'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'BROADCAST', 'JOB', 'APPLICATION', 'VERIFICATION'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

notificationSchema.index({ user: 1, userType: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
