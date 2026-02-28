import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    jobTitle: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true
    },
    jobDescription: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
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
    status: {
        type: String,
        enum: ['Open', 'Closed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Open'
    },
    applications: [{
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'applications.applicantType'
        },
        applicantType: {
            type: String,
            enum: ['Labour', 'Contractor', 'User'],
            required: true
        },
        applicantName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        location: String,
        message: String,
        appliedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending'
        },
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

jobSchema.index({ user: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
