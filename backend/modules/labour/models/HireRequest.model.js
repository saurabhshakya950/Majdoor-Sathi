import mongoose from 'mongoose';

const hireRequestSchema = new mongoose.Schema({
    // Labour Information
    labourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: true
    },
    cardId: {
        type: String, // String to handle both ObjectId and UI fallback IDs securely
        required: false,
        default: null
    },
    labourName: {
        type: String,
        required: true
    },
    labourSkill: {
        type: String,
        required: true
    },
    labourPhone: {
        type: String,
        required: true
    },
    labourCity: {
        type: String,
        required: true
    },

    // Requester Information (User or Contractor)
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'requesterModel'
    },
    requesterModel: {
        type: String,
        required: true,
        enum: ['User', 'Contractor']
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterPhone: {
        type: String,
        required: true
    },
    requesterLocation: {
        type: String,
        required: true
    },

    // Request Status
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },

    // Chat Reference (added when request is accepted)
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },

    // Response Details
    respondedAt: {
        type: Date,
        default: null
    },

    // Additional Info
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for faster queries
hireRequestSchema.index({ labourId: 1, status: 1 });
hireRequestSchema.index({ requesterId: 1, requesterModel: 1 });
hireRequestSchema.index({ status: 1, createdAt: -1 });

const HireRequest = mongoose.model('HireRequest', hireRequestSchema);

export default HireRequest;
