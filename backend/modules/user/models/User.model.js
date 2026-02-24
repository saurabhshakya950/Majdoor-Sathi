import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    userType: {
        type: String,
        enum: ['User', 'Labour', 'Contractor'],
        default: null
    },
    firstName: {
        type: String,
        trim: true,
        default: null
    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: null
    },
    dob: {
        type: Date,
        default: null
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    aadharNumber: {
        type: String,
        trim: true,
        match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhar number']
    },
    profilePhoto: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        default: null
    },
    fcmTokenWeb: [{
        type: String
    }],
    fcmTokenMobile: [{
        type: String
    }]
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
