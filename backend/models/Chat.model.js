import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'participants.userType'
        },
        userType: {
            type: String,
            required: true,
            enum: ['User', 'Labour', 'Contractor']
        },
        name: {
            type: String,
            required: true
        },
        profilePhoto: {
            type: String,
            default: ''
        },
        mobileNumber: {
            type: String,
            required: true
        }
    }],
    relatedRequest: {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        requestType: {
            type: String,
            required: true,
            enum: ['HireRequest', 'ContractorHireRequest', 'JobApplication']
        }
    },
    lastMessage: {
        text: {
            type: String,
            default: ''
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId
        },
        timestamp: {
            type: Date
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ createdAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
