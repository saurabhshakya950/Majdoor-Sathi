import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
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
    businessType: {
        type: String,
        enum: [
            'Proprietorship',
            'Partnership',
            'Private Limited',
            'Public Limited',
            'LLP',
            'Individual Contractor',
            'Construction Company',
            'Civil Contractor',
            'Interior Design Firm',
            'Renovation Contractor',
            'Electrical Contractor',
            'Plumbing Contractor',
            'Painting Contractor',
            'Waterproofing Contractor',
            'Flooring Contractor',
            'HVAC / AC Contractor',
            'Modular Kitchen Contractor',
            'Furniture & Woodwork Contractor',
            'False Ceiling Contractor',
            'Landscaping Contractor',
            'Solar Panel Contractor',
            'Fire Safety Contractor',
            'Maintenance & Repair Contractor',
            'Government Approved Contractor',
            'Turnkey Project Contractor'
        ],
        default: 'Proprietorship'
    },
    businessName: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    addressLine1: {
        type: String,
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileCompletionStatus: {
        type: String,
        enum: ['incomplete', 'basic', 'complete'],
        default: 'incomplete'
    }
}, {
    timestamps: true
});

const Contractor = mongoose.model('Contractor', contractorSchema);

export default Contractor;
