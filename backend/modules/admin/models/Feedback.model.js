import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    entityType: {
        type: String,
        required: true,
        enum: ['user', 'labour', 'contractor']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityModel'
    },
    entityModel: {
        type: String,
        required: true,
        enum: ['User', 'Labour', 'Contractor']
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'givenByModel'
    },
    givenByModel: {
        type: String,
        enum: ['User', 'Labour', 'Contractor']
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
feedbackSchema.index({ entityId: 1, entityType: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
