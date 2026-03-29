import mongoose from 'mongoose';

const labourSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    firstName: {
        type: String,
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    skillType: {
        type: String,
        trim: true,
        default: 'Other'
    },
    experience: {
        type: String,
        trim: true,
        default: ''
    },
    workPhotos: [{
        type: String
    }],
    previousWorkLocation: {
        type: String,
        trim: true,
        default: ''
    },
    aadharNumber: {
        type: String,
        trim: true,
        match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhar number']
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    availability: {
        type: String,
        enum: ['Full Time', 'Part Time', 'Available', 'Busy', 'Not Available'],
        default: 'Available'
    },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Busy', 'Not Available'],
        default: 'Available'
    },
    hasLabourCard: {
        type: Boolean,
        default: false
    },
    labourCardDetails: {
        fullName: {
            type: String,
            trim: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        mobileNumber: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        skills: {
            type: String,
            trim: true
        },
        photo: {
            type: String
        }
    },
    labourCards: [{
        fullName: { type: String, trim: true },
        primarySkill: { type: String, trim: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        mobileNumber: { type: String, trim: true },
        city: { type: String, trim: true },
        address: { type: String, trim: true },
        skills: { type: String, trim: true },
        experience: { type: String, trim: true, default: '' },
        previousWorkLocation: { type: String, trim: true, default: '' },
        availability: { type: String, default: 'Full Time' },
        availabilityStatus: { type: String, default: 'Available' },
        rating: { type: Number, default: 0 },
        photo: { type: String }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_submitted'],
        default: 'not_submitted'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
labourSchema.index({ skillType: 1 });
labourSchema.index({ isActive: 1 });
labourSchema.index({ rating: -1 });
labourSchema.index({ 'labourCardDetails.city': 1 });

const Labour = mongoose.model('Labour', labourSchema);

export default Labour;
