import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    targetAudience: {
        type: String,
        enum: ['ALL', 'USERS', 'LABOUR', 'CONTRACTORS'],
        default: 'ALL',
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'],
        default: 'DRAFT'
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    sentAt: {
        type: Date,
        default: null
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    deliveredCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
broadcastSchema.index({ status: 1, createdAt: -1 });
broadcastSchema.index({ targetAudience: 1 });
broadcastSchema.index({ createdBy: 1 });

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export default Broadcast;
