import mongoose from 'mongoose';

const getStartedSlideSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
    },
    title: {
        type: String,
        required: [true, 'Title text is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
getStartedSlideSchema.index({ isActive: 1, order: 1 });

const GetStartedSlide = mongoose.model('GetStartedSlide', getStartedSlideSchema);

export default GetStartedSlide;
