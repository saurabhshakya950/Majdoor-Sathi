import mongoose from 'mongoose';

const contractorJobSchema = new mongoose.Schema({
    contractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contractorName: {
        type: String,
        required: [true, 'Contractor name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    businessType: {
        type: String,
        required: [true, 'Business type is required'],
        enum: ['Individual Contractor', 'Business']
    },
    businessName: {
        type: String,
        trim: true
    },
    labourSkill: {
        type: String,
        required: [true, 'Labour skill is required'],
        trim: true
    },
    experience: {
        type: String,
        required: [true, 'Experience requirement is required'],
        trim: true
    },
    workDuration: {
        type: String,
        required: [true, 'Work duration is required'],
        enum: ['One Day', 'Multiple Days', 'Contract']
    },
    budgetType: {
        type: String,
        required: [true, 'Budget type is required'],
        enum: ['Fixed Amount', 'Negotiable'],
        default: 'Fixed Amount'
    },
    budgetAmount: {
        type: Number,
        min: 0
    },
    profileStatus: {
        type: String,
        enum: ['Active', 'Closed'],
        default: 'Active'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    targetAudience: {
        type: String,
        enum: ['User', 'Labour', 'Both'],
        default: 'Both'
    },
    applications: [{
        labour: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Labour'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending'
        },
        message: String,
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            default: null
        }
    }],
    selectedLabour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

contractorJobSchema.index({ contractor: 1 });
contractorJobSchema.index({ user: 1 });
contractorJobSchema.index({ labourSkill: 1 });
contractorJobSchema.index({ profileStatus: 1 });
contractorJobSchema.index({ createdAt: -1 });

const ContractorJob = mongoose.model('ContractorJob', contractorJobSchema);

export default ContractorJob;
