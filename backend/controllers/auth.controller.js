import User from '../modules/user/models/User.model.js';
import Labour from '../modules/labour/models/Labour.model.js';
import Contractor from '../modules/contractor/models/Contractor.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { generateOTP, sendOTP } from '../utils/sms.utils.js';

// Temporary OTP storage (in production, use Redis or database)
const otpStore = new Map();

const addFCMTokenToUserObject = (user, fcmToken, platform) => {
    if (!fcmToken) return;
    const isMobile = ['mobile', 'app', 'android', 'ios'].includes(platform?.toLowerCase());
    const tokenField = isMobile ? 'fcmTokenMobile' : 'fcmTokenWeb';
    // Always keep only the most recent token (Single Token Refresh Logic)
    user[tokenField] = [fcmToken];
};

// Helper to save FCM token
const saveFCMTokenToUser = async (user, fcmToken, platform) => {
    addFCMTokenToUserObject(user, fcmToken, platform);
    if (user.isModified('fcmTokenMobile') || user.isModified('fcmTokenWeb')) {
        await user.save();
        console.log(`✅ FCM Token (${platform}) saved for user ${user._id}`);
    }
};

// Send OTP to mobile number
export const sendOTPToMobile = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== SEND OTP REQUEST =====');
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required'
            });
        }

        console.log('📱 Mobile Number:', mobileNumber);

        // Special handling for default OTP
        const specialNumbers = ['9575500329', '9009022251', '8643041429', '7856201231', '9827223585', '9009011121'];
        let otp;
        if (specialNumbers.includes(mobileNumber)) {
            otp = '123456';
            console.log(`⭐ Special User (${mobileNumber}) - Using default OTP: 123456`);
            
            // Store OTP and return success immediately (skip SMS gateway)
            otpStore.set(mobileNumber, {
                otp,
                expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
            });

            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully (Default)',
                data: { mobileNumber, expiresIn: 300 }
            });
        }

        // Real logic for other users
        otp = generateOTP();
        
        // Store OTP with expiry (5 minutes)
        otpStore.set(mobileNumber, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });

        // Send OTP via SMS Utility
        const smsResult = await sendOTP(mobileNumber, otp);

        if (smsResult.success) {
            console.log('✅ OTP sent successfully to:', mobileNumber);
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: {
                    mobileNumber,
                    expiresIn: 300 // 5 minutes in seconds
                }
            });
        } else {
            console.error('❌ Failed to send OTP:', smsResult.error);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }
    } catch (error) {
        console.error('❌ SEND OTP ERROR:', error.message);
        next(error);
    }
};

// Verify OTP and login
export const verifyOTPAndLogin = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== VERIFY OTP REQUEST =====');
        const { mobileNumber, otp, fcmToken, platform } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and OTP are required'
            });
        }

        const storedOTPData = otpStore.get(mobileNumber);

        if (!storedOTPData) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or expired. Please request a new OTP.'
            });
        }

        if (Date.now() > storedOTPData.expiresAt) {
            otpStore.delete(mobileNumber);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (storedOTPData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.'
            });
        }

        // Success - clear OTP and proceed with login/registration
        otpStore.delete(mobileNumber);

        let user = await User.findOne({ mobileNumber });

        if (!user) {
            console.log('🆕 New user - Creating temporary entry');
            user = await User.create({
                mobileNumber,
                userType: null,
                firstName: null,
                lastName: null
            });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        
        // Add FCM token to user object before saving (one single DB write)
        addFCMTokenToUserObject(user, fcmToken, platform);
        
        await user.save();

        // 🟢 SMART PROFILE LOOKUP: If user is Labour or Contractor, fetch their name from their related collection
        // This solves the issue where registered labourers were redirected back to profile setup
        let firstName = user.firstName;
        let lastName = user.lastName;

        if (user.userType === 'Labour') {
            const labourProfile = await Labour.findOne({ user: user._id });
            if (labourProfile) {
                console.log(`👷 Registered Labour found: ${labourProfile.firstName}`);
                firstName = labourProfile.firstName;
                lastName = labourProfile.lastName;
            }
        } else if (user.userType === 'Contractor') {
            const contractorProfile = await Contractor.findOne({ user: user._id });
            if (contractorProfile) {
                console.log(`🏢 Registered Contractor found: ${contractorProfile.firstName}`);
                firstName = contractorProfile.firstName;
                lastName = contractorProfile.lastName;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    mobileNumber: user.mobileNumber,
                    userType: user.userType,
                    firstName: firstName, // Merged from role model if applicable
                    lastName: lastName    // Merged from role model if applicable
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('❌ VERIFY OTP ERROR:', error.message);
        next(error);
    }
};


export const login = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== LOGIN REQUEST =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        
        const { mobileNumber, fcmToken, platform } = req.body;
        console.log('📱 Mobile Number:', mobileNumber);

        let user = await User.findOne({ mobileNumber });

        if (!user) {
            console.log('🆕 New user - Creating temporary entry');
            // Create a temporary user entry for new users
            user = await User.create({
                mobileNumber,
                userType: null, // Will be set during registration
                firstName: null,
                lastName: null
            });
            console.log('✅ Temporary user created:', user._id);
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        
        // Add FCM token to user object before saving (one single DB write)
        addFCMTokenToUserObject(user, fcmToken, platform);
        
        await user.save();

        console.log('✅ Login successful for:', mobileNumber);

        // 🟢 SMART PROFILE LOOKUP: Merge name from related role-specific collection
        let firstName = user.firstName;
        let lastName = user.lastName;

        if (user.userType === 'Labour') {
            const labourProfile = await Labour.findOne({ user: user._id });
            if (labourProfile) {
                firstName = labourProfile.firstName;
                lastName = labourProfile.lastName;
            }
        } else if (user.userType === 'Contractor') {
            const contractorProfile = await Contractor.findOne({ user: user._id });
            if (contractorProfile) {
                firstName = contractorProfile.firstName;
                lastName = contractorProfile.lastName;
            }
        }

        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    mobileNumber: user.mobileNumber,
                    userType: user.userType,
                    firstName: firstName, // Merged from role model
                    lastName: lastName    // Merged from role model
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('❌ LOGIN ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== REGISTER REQUEST =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        
        const {
            mobileNumber,
            userType,
            firstName,
            middleName,
            lastName,
            gender,
            dob,
            city,
            state,
            address,
            aadharNumber,
            labourDetails,
            businessDetails,
            fcmToken,
            platform
        } = req.body;

        console.log('📱 Mobile Number:', mobileNumber);
        console.log('👤 User Type:', userType);
        console.log('📝 Name:', firstName, middleName, lastName);

        let user = await User.findOne({ mobileNumber });

        if (user) {
            console.log('🔄 Updating existing user:', user._id);
            user.userType = userType || user.userType;
            user.firstName = firstName || user.firstName;
            user.middleName = middleName !== undefined ? middleName : user.middleName;
            user.lastName = lastName || user.lastName;
            user.gender = gender || user.gender;
            user.dob = dob || user.dob;
            user.city = city || user.city;
            user.state = state || user.state;
            user.address = address || user.address;
            user.aadharNumber = aadharNumber || user.aadharNumber;
            await user.save();
            console.log('✅ User profile updated');
        } else {
            console.log('✨ Creating new user...');
            user = await User.create({
                mobileNumber,
                userType,
                firstName,
                middleName,
                lastName,
                gender,
                dob,
                city,
                state,
                address,
                aadharNumber
            });
            console.log('✅ New user created:', user._id);
        }

        if (userType === 'Labour' && labourDetails) {
            console.log('👷 Creating/Updating Labour profile...');
            let labour = await Labour.findOne({ user: user._id });
            if (!labour) {
                labour = await Labour.create({
                    user: user._id,
                    ...labourDetails
                });
                console.log('✅ Labour profile created');
            }
        }

        if (userType === 'Contractor' && businessDetails) {
            console.log('🏢 Creating/Updating Contractor profile...');
            let contractor = await Contractor.findOne({ user: user._id });
            if (!contractor) {
                contractor = await Contractor.create({
                    user: user._id,
                    ...businessDetails
                });
                console.log('✅ Contractor profile created');
            }
        }

        if (userType === 'Contractor') {
            let contractor = await Contractor.findOne({ user: user._id });
            if (!contractor) {
                contractor = await Contractor.create({
                    user: user._id
                });
                console.log('✅ Empty contractor profile created');
            }
        }

        if (userType === 'Labour') {
            let labour = await Labour.findOne({ user: user._id });
            if (!labour) {
                labour = await Labour.create({
                    user: user._id
                });
                console.log('✅ Empty labour profile created');
            }
        }

        console.log('ℹ️  Regular User - No additional profile needed');

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        
        // Add FCM token to user object before saving (one single DB write)
        addFCMTokenToUserObject(user, fcmToken, platform);
        
        await user.save();

        console.log('🎫 Tokens generated successfully');
        console.log('✅ Registration completed for:', mobileNumber);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    _id: user._id,
                    mobileNumber: user.mobileNumber,
                    userType: user.userType,
                    firstName: user.firstName,
                    lastName: user.lastName
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('❌ REGISTER ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        req.user.refreshToken = null;
        await req.user.save();

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const newAccessToken = generateAccessToken(user._id);

        res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Save FCM token
// @route   POST /api/auth/fcm-token
// @access  Private
export const saveFCMToken = async (req, res, next) => {
    try {
        const { fcmToken, platform } = req.body;

        // Validate inputs
        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        // req.user is already set by protect middleware, no need to fetch again
        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add token only if not already present (idempotent)
        const isMobile = ['mobile', 'app', 'android', 'ios'].includes(platform?.toLowerCase());
        const tokenField = isMobile ? 'fcmTokenMobile' : 'fcmTokenWeb';
        // Single Token Refresh Logic: Replace all old tokens with the new one
        user[tokenField] = [fcmToken];
        await user.save();

        res.status(200).json({
            success: true,
            message: 'FCM token saved successfully'
        });
    } catch (error) {
        console.error('❌ SAVE FCM TOKEN ERROR:', error.message);
        // Return 200 to prevent frontend errors — FCM token saving is non-critical
        res.status(200).json({
            success: false,
            message: 'Could not save FCM token, will retry later'
        });
    }
};

