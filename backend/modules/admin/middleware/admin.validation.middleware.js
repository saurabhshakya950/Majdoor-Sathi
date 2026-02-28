// ============================================================
// Admin Panel — Centralized Strong Input Validation Middleware
// File: backend/modules/admin/middleware/admin.validation.middleware.js
//
// DESIGN PRINCIPLES:
//   - Zero external library dependencies (pure JS)
//   - Each validator is an Express middleware (req, res, next)
//   - Does NOT touch controllers, models, or any other file
//   - Simply plugged into route files before the controller
// ============================================================

// ─────────────────────────────────────────
// 🔧 INTERNAL HELPER UTILITIES
// ─────────────────────────────────────────

/**
 * Sends a standardised 400 validation error response.
 * Matches the exact response shape used in all controllers.
 */
const validationError = (res, message, errors = null) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(400).json(response);
};

/** Checks if a string is non-empty after trimming */
const isNonEmpty = (value) =>
    value !== undefined && value !== null && String(value).trim().length > 0;

/** Checks if value is a valid 10-digit Indian mobile number */
const isValidMobile = (mobile) =>
    /^[6-9]\d{9}$/.test(String(mobile).trim());

/** Checks if value is a valid email address */
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

/** Checks if value is a valid MongoDB ObjectId (24-hex-char string) */
const isValidObjectId = (id) =>
    /^[a-fA-F0-9]{24}$/.test(String(id));

/** Strips harmful characters that could be used for NoSQL injection */
const hasDangerousChars = (value) =>
    /[${}()|[\]\\]/.test(String(value));

/** Returns true if the string length is within [min, max] bounds */
const isLengthValid = (value, min, max) => {
    const len = String(value).trim().length;
    return len >= min && len <= max;
};

/** Checks if value is one of the allowed enum values (case-insensitive) */
const isAllowedEnum = (value, allowed) =>
    allowed.map((v) => v.toLowerCase()).includes(String(value).toLowerCase());

// ─────────────────────────────────────────
// 🔐 AUTH VALIDATORS
// ─────────────────────────────────────────

/**
 * POST /api/admin/auth/login
 * Validates: username (non-empty, no dangerous chars), password (min 4 chars)
 */
export const validateAdminLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!isNonEmpty(username)) {
        errors.push('Username is required');
    } else if (hasDangerousChars(username)) {
        errors.push('Username contains invalid characters');
    } else if (!isLengthValid(username, 3, 50)) {
        errors.push('Username must be between 3 and 50 characters');
    }

    if (!isNonEmpty(password)) {
        errors.push('Password is required');
    } else if (!isLengthValid(password, 4, 100)) {
        errors.push('Password must be between 4 and 100 characters');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/auth/change-password
 * Validates: currentPassword, newPassword (min 8, uppercase, number, special char)
 */
export const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const errors = [];

    if (!isNonEmpty(currentPassword)) {
        errors.push('Current password is required');
    }

    if (!isNonEmpty(newPassword)) {
        errors.push('New password is required');
    } else {
        if (newPassword.length < 8) {
            errors.push('New password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(newPassword)) {
            errors.push('New password must contain at least one uppercase letter');
        }
        if (!/[0-9]/.test(newPassword)) {
            errors.push('New password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword)) {
            errors.push('New password must contain at least one special character');
        }
        if (currentPassword && newPassword === currentPassword) {
            errors.push('New password must be different from current password');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/auth/profile
 * Validates: email (if provided), newPassword strength (if provided)
 */
export const validateUpdateAdminProfile = (req, res, next) => {
    const { email, newPassword, currentPassword } = req.body;
    const errors = [];

    if (email !== undefined) {
        if (!isNonEmpty(email)) {
            errors.push('Email cannot be empty if provided');
        } else if (!isValidEmail(email)) {
            errors.push('Please provide a valid email address');
        } else if (!isLengthValid(email, 5, 100)) {
            errors.push('Email must be between 5 and 100 characters');
        }
    }

    // Password change requested — validate both fields
    if (newPassword !== undefined || currentPassword !== undefined) {
        if (!isNonEmpty(currentPassword)) {
            errors.push('Current password is required to change password');
        }
        if (!isNonEmpty(newPassword)) {
            errors.push('New password is required');
        } else {
            if (newPassword.length < 8) {
                errors.push('New password must be at least 8 characters long');
            }
            if (!/[A-Z]/.test(newPassword)) {
                errors.push('New password must contain at least one uppercase letter');
            }
            if (!/[0-9]/.test(newPassword)) {
                errors.push('New password must contain at least one number');
            }
            if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword)) {
                errors.push('New password must contain at least one special character');
            }
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 👥 USER MANAGEMENT VALIDATORS
// ─────────────────────────────────────────

/**
 * POST /api/admin/users
 * Validates: mobileNumber (required, valid Indian), firstName (required),
 *            city (optional but sanitized), state (optional but sanitized)
 */
export const validateCreateUser = (req, res, next) => {
    const { mobileNumber, firstName, lastName, gender, city, state } = req.body;
    const errors = [];

    // Mobile number
    if (!isNonEmpty(mobileNumber)) {
        errors.push('Mobile number is required');
    } else if (!isValidMobile(mobileNumber)) {
        errors.push('Mobile number must be a valid 10-digit Indian number starting with 6-9');
    }

    // First name
    if (!isNonEmpty(firstName)) {
        errors.push('First name is required');
    } else if (!isLengthValid(firstName, 2, 50)) {
        errors.push('First name must be between 2 and 50 characters');
    } else if (hasDangerousChars(firstName)) {
        errors.push('First name contains invalid characters');
    }

    // Last name (optional)
    if (lastName !== undefined && isNonEmpty(lastName)) {
        if (!isLengthValid(lastName, 1, 50)) {
            errors.push('Last name must be between 1 and 50 characters');
        } else if (hasDangerousChars(lastName)) {
            errors.push('Last name contains invalid characters');
        }
    }

    // Gender (optional)
    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    // City (optional sanitization)
    if (city !== undefined && isNonEmpty(city)) {
        if (hasDangerousChars(city)) {
            errors.push('City contains invalid characters');
        } else if (!isLengthValid(city, 2, 100)) {
            errors.push('City must be between 2 and 100 characters');
        }
    }

    // State (optional sanitization)
    if (state !== undefined && isNonEmpty(state)) {
        if (hasDangerousChars(state)) {
            errors.push('State contains invalid characters');
        } else if (!isLengthValid(state, 2, 100)) {
            errors.push('State must be between 2 and 100 characters');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/users/:id
 * At least one updatable field must be provided
 */
export const validateUpdateUser = (req, res, next) => {
    const { firstName, lastName, gender, city, state, isActive } = req.body;
    const errors = [];
    const UPDATABLE_FIELDS = ['firstName', 'lastName', 'gender', 'city', 'state', 'isActive'];

    const hasAtLeastOneField = UPDATABLE_FIELDS.some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOneField) {
        errors.push('At least one field must be provided to update');
    }

    if (firstName !== undefined && isNonEmpty(firstName)) {
        if (!isLengthValid(firstName, 2, 50)) {
            errors.push('First name must be between 2 and 50 characters');
        } else if (hasDangerousChars(firstName)) {
            errors.push('First name contains invalid characters');
        }
    }

    if (lastName !== undefined && isNonEmpty(lastName)) {
        if (!isLengthValid(lastName, 1, 50)) {
            errors.push('Last name must be between 1 and 50 characters');
        } else if (hasDangerousChars(lastName)) {
            errors.push('Last name contains invalid characters');
        }
    }

    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    if (city !== undefined && isNonEmpty(city)) {
        if (hasDangerousChars(city)) {
            errors.push('City contains invalid characters');
        }
    }

    if (state !== undefined && isNonEmpty(state)) {
        if (hasDangerousChars(state)) {
            errors.push('State contains invalid characters');
        }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        errors.push('isActive must be a boolean value (true or false)');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 🔨 LABOUR MANAGEMENT VALIDATORS
// ─────────────────────────────────────────

const VALID_SKILL_TYPES = [
    'Mason', 'Plumber', 'Electrician', 'Carpenter', 'Painter',
    'Welder', 'Tiler', 'Roofer', 'HVAC Technician', 'Landscaper',
    'Concrete Worker', 'Ironworker', 'Heavy Machinery Operator',
    'Scaffolding Worker', 'Demolition Worker', 'Other'
];

/**
 * POST /api/admin/labours
 * Validates: mobileNumber, firstName, skillType/trade (required)
 */
export const validateCreateLabour = (req, res, next) => {
    const { mobileNumber, firstName, lastName, skillType, trade, gender, city } = req.body;
    const errors = [];

    // Mobile number
    if (!isNonEmpty(mobileNumber)) {
        errors.push('Mobile number is required');
    } else if (!isValidMobile(mobileNumber)) {
        errors.push('Mobile number must be a valid 10-digit Indian number starting with 6-9');
    }

    // First name
    if (!isNonEmpty(firstName)) {
        errors.push('First name is required');
    } else if (!isLengthValid(firstName, 2, 50)) {
        errors.push('First name must be between 2 and 50 characters');
    } else if (hasDangerousChars(firstName)) {
        errors.push('First name contains invalid characters');
    }

    // Last name optional
    if (lastName !== undefined && isNonEmpty(lastName)) {
        if (hasDangerousChars(lastName)) {
            errors.push('Last name contains invalid characters');
        }
    }

    // Skill type / trade — one is required
    const skill = skillType || trade;
    if (!isNonEmpty(skill)) {
        errors.push('Skill type or trade is required');
    } else if (hasDangerousChars(skill)) {
        errors.push('Skill type contains invalid characters');
    } else if (!isLengthValid(skill, 2, 100)) {
        errors.push('Skill type must be between 2 and 100 characters');
    }

    // Gender (optional)
    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    // City (optional)
    if (city !== undefined && isNonEmpty(city)) {
        if (hasDangerousChars(city)) {
            errors.push('City contains invalid characters');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/labours/:id
 * At least one updatable field required
 */
export const validateUpdateLabour = (req, res, next) => {
    const { firstName, lastName, skillType, trade, gender, city, state, isActive, experience } = req.body;
    const errors = [];
    const UPDATABLE_FIELDS = ['firstName', 'lastName', 'skillType', 'trade', 'gender', 'city', 'state', 'isActive', 'experience'];

    const hasAtLeastOneField = UPDATABLE_FIELDS.some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOneField) {
        errors.push('At least one field must be provided to update');
    }

    if (firstName !== undefined && isNonEmpty(firstName)) {
        if (!isLengthValid(firstName, 2, 50)) errors.push('First name must be between 2 and 50 characters');
        else if (hasDangerousChars(firstName)) errors.push('First name contains invalid characters');
    }

    if (lastName !== undefined && isNonEmpty(lastName)) {
        if (hasDangerousChars(lastName)) errors.push('Last name contains invalid characters');
    }

    const skill = skillType || trade;
    if (skill !== undefined && isNonEmpty(skill)) {
        if (hasDangerousChars(skill)) errors.push('Skill type contains invalid characters');
        if (!isLengthValid(skill, 2, 100)) errors.push('Skill type must be between 2 and 100 characters');
    }

    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    if (city !== undefined && isNonEmpty(city) && hasDangerousChars(city)) {
        errors.push('City contains invalid characters');
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 🏗️ CONTRACTOR MANAGEMENT VALIDATORS
// ─────────────────────────────────────────

const VALID_BUSINESS_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other'];

/**
 * POST /api/admin/contractors
 * Validates: mobileNumber, firstName, businessName (required)
 */
export const validateCreateContractor = (req, res, next) => {
    const { mobileNumber, firstName, lastName, businessName, businessType, gender, city } = req.body;
    const errors = [];

    // Mobile number
    if (!isNonEmpty(mobileNumber)) {
        errors.push('Mobile number is required');
    } else if (!isValidMobile(mobileNumber)) {
        errors.push('Mobile number must be a valid 10-digit Indian number starting with 6-9');
    }

    // First name
    if (!isNonEmpty(firstName)) {
        errors.push('First name is required');
    } else if (!isLengthValid(firstName, 2, 50)) {
        errors.push('First name must be between 2 and 50 characters');
    } else if (hasDangerousChars(firstName)) {
        errors.push('First name contains invalid characters');
    }

    // Business name — required for contractors
    if (!isNonEmpty(businessName)) {
        errors.push('Business name is required');
    } else if (!isLengthValid(businessName, 2, 100)) {
        errors.push('Business name must be between 2 and 100 characters');
    } else if (hasDangerousChars(businessName)) {
        errors.push('Business name contains invalid characters');
    }

    // Business type (optional)
    if (businessType !== undefined && isNonEmpty(businessType)) {
        if (!isAllowedEnum(businessType, VALID_BUSINESS_TYPES)) {
            errors.push(`Business type must be one of: ${VALID_BUSINESS_TYPES.join(', ')}`);
        }
    }

    // Gender (optional)
    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    // City (optional)
    if (city !== undefined && isNonEmpty(city) && hasDangerousChars(city)) {
        errors.push('City contains invalid characters');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/contractors/:id
 * At least one updatable field required
 */
export const validateUpdateContractor = (req, res, next) => {
    const { firstName, lastName, businessName, businessType, gender, city, state, isActive } = req.body;
    const errors = [];
    const UPDATABLE_FIELDS = ['firstName', 'lastName', 'businessName', 'businessType', 'gender', 'city', 'state', 'addressLine1', 'landmark', 'isActive'];

    const hasAtLeastOneField = UPDATABLE_FIELDS.some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOneField) {
        errors.push('At least one field must be provided to update');
    }

    if (firstName !== undefined && isNonEmpty(firstName)) {
        if (!isLengthValid(firstName, 2, 50)) errors.push('First name must be between 2 and 50 characters');
        else if (hasDangerousChars(firstName)) errors.push('First name contains invalid characters');
    }

    if (businessName !== undefined && isNonEmpty(businessName)) {
        if (!isLengthValid(businessName, 2, 100)) errors.push('Business name must be between 2 and 100 characters');
        else if (hasDangerousChars(businessName)) errors.push('Business name contains invalid characters');
    }

    if (businessType !== undefined && isNonEmpty(businessType)) {
        if (!isAllowedEnum(businessType, VALID_BUSINESS_TYPES)) {
            errors.push(`Business type must be one of: ${VALID_BUSINESS_TYPES.join(', ')}`);
        }
    }

    if (gender !== undefined && isNonEmpty(gender)) {
        if (!isAllowedEnum(gender, ['Male', 'Female', 'Other'])) {
            errors.push('Gender must be one of: Male, Female, Other');
        }
    }

    if (city !== undefined && isNonEmpty(city) && hasDangerousChars(city)) {
        errors.push('City contains invalid characters');
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 📢 BROADCAST VALIDATORS
// ─────────────────────────────────────────

const VALID_AUDIENCES = ['ALL', 'USERS', 'LABOUR', 'CONTRACTORS'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * POST /api/admin/broadcasts
 * Validates: title, message (required), targetAudience, priority (enum)
 */
export const validateCreateBroadcast = (req, res, next) => {
    const { title, message, targetAudience, priority, scheduledAt, expiresAt } = req.body;
    const errors = [];

    // Title
    if (!isNonEmpty(title)) {
        errors.push('Broadcast title is required');
    } else if (!isLengthValid(title, 3, 200)) {
        errors.push('Broadcast title must be between 3 and 200 characters');
    } else if (hasDangerousChars(title)) {
        errors.push('Broadcast title contains invalid characters');
    }

    // Message
    if (!isNonEmpty(message)) {
        errors.push('Broadcast message is required');
    } else if (!isLengthValid(message, 5, 2000)) {
        errors.push('Broadcast message must be between 5 and 2000 characters');
    }

    // Target audience (optional, defaults to 'ALL' in controller)
    if (targetAudience !== undefined && isNonEmpty(targetAudience)) {
        if (!isAllowedEnum(targetAudience, VALID_AUDIENCES)) {
            errors.push(`Target audience must be one of: ${VALID_AUDIENCES.join(', ')}`);
        }
    }

    // Priority (optional, defaults to 'MEDIUM' in controller)
    if (priority !== undefined && isNonEmpty(priority)) {
        if (!isAllowedEnum(priority, VALID_PRIORITIES)) {
            errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
        }
    }

    // Scheduled date (optional) — must be a future date
    if (scheduledAt !== undefined && scheduledAt !== null && isNonEmpty(scheduledAt)) {
        const schedDate = new Date(scheduledAt);
        if (isNaN(schedDate.getTime())) {
            errors.push('scheduledAt must be a valid ISO date string');
        } else if (schedDate <= new Date()) {
            errors.push('scheduledAt must be a future date');
        }
    }

    // Expiry date (optional) — must be in future and after scheduledAt
    if (expiresAt !== undefined && expiresAt !== null && isNonEmpty(expiresAt)) {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime())) {
            errors.push('expiresAt must be a valid ISO date string');
        } else if (expDate <= new Date()) {
            errors.push('expiresAt must be a future date');
        } else if (scheduledAt && new Date(expiresAt) <= new Date(scheduledAt)) {
            errors.push('expiresAt must be after scheduledAt');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/broadcasts/:id
 * Must not update SENT broadcasts (guarded in controller),
 * here we validate the shape of incoming data
 */
export const validateUpdateBroadcast = (req, res, next) => {
    const { title, message, targetAudience, priority, scheduledAt, expiresAt } = req.body;
    const errors = [];
    const UPDATABLE_FIELDS = ['title', 'message', 'targetAudience', 'priority', 'scheduledAt', 'expiresAt'];

    const hasAtLeastOneField = UPDATABLE_FIELDS.some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOneField) {
        errors.push('At least one field must be provided to update');
    }

    if (title !== undefined && isNonEmpty(title)) {
        if (!isLengthValid(title, 3, 200)) errors.push('Broadcast title must be between 3 and 200 characters');
        else if (hasDangerousChars(title)) errors.push('Broadcast title contains invalid characters');
    }

    if (message !== undefined && isNonEmpty(message)) {
        if (!isLengthValid(message, 5, 2000)) errors.push('Broadcast message must be between 5 and 2000 characters');
    }

    if (targetAudience !== undefined && isNonEmpty(targetAudience)) {
        if (!isAllowedEnum(targetAudience, VALID_AUDIENCES)) {
            errors.push(`Target audience must be one of: ${VALID_AUDIENCES.join(', ')}`);
        }
    }

    if (priority !== undefined && isNonEmpty(priority)) {
        if (!isAllowedEnum(priority, VALID_PRIORITIES)) {
            errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
        }
    }

    if (scheduledAt !== undefined && scheduledAt !== null && isNonEmpty(scheduledAt)) {
        const schedDate = new Date(scheduledAt);
        if (isNaN(schedDate.getTime())) {
            errors.push('scheduledAt must be a valid ISO date string');
        } else if (schedDate <= new Date()) {
            errors.push('scheduledAt must be a future date');
        }
    }

    if (expiresAt !== undefined && expiresAt !== null && isNonEmpty(expiresAt)) {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime())) {
            errors.push('expiresAt must be a valid ISO date string');
        } else if (expDate <= new Date()) {
            errors.push('expiresAt must be a future date');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// ✔️ VERIFICATION VALIDATORS
// ─────────────────────────────────────────

const VALID_ENTITY_TYPES = ['user', 'labour', 'contractor'];

/**
 * POST /api/admin/verification/requests
 * Validates: entityType, entityId, name, phone, aadhaarNumber
 */
export const validateCreateVerification = (req, res, next) => {
    const { entityType, entityId, name, phone, aadhaarNumber } = req.body;
    const errors = [];

    // Entity type
    if (!isNonEmpty(entityType)) {
        errors.push('Entity type is required');
    } else if (!isAllowedEnum(entityType, VALID_ENTITY_TYPES)) {
        errors.push(`Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }

    // Entity ID
    if (!isNonEmpty(entityId)) {
        errors.push('Entity ID is required');
    } else if (!isValidObjectId(entityId)) {
        errors.push('Entity ID must be a valid MongoDB ID');
    }

    // Name
    if (!isNonEmpty(name)) {
        errors.push('Name is required');
    } else if (!isLengthValid(name, 2, 100)) {
        errors.push('Name must be between 2 and 100 characters');
    } else if (hasDangerousChars(name)) {
        errors.push('Name contains invalid characters');
    }

    // Phone
    if (!isNonEmpty(phone)) {
        errors.push('Phone number is required');
    } else if (!isValidMobile(phone)) {
        errors.push('Phone must be a valid 10-digit Indian number starting with 6-9');
    }

    // Aadhaar number — optional but if provided must be 12 digits
    if (aadhaarNumber !== undefined && isNonEmpty(aadhaarNumber)) {
        if (!/^\d{12}$/.test(String(aadhaarNumber).trim())) {
            errors.push('Aadhaar number must be exactly 12 digits');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * POST /api/admin/verification/submit (end-user submission)
 * Validates: entityType, name, phone, aadhaarNumber, aadhaarFrontUrl, aadhaarBackUrl
 */
export const validateSubmitVerification = (req, res, next) => {
    const { entityType, name, phone, aadhaarNumber, aadhaarFrontUrl, aadhaarBackUrl } = req.body;
    const errors = [];

    // Entity type
    if (!isNonEmpty(entityType)) {
        errors.push('Entity type is required');
    } else if (!isAllowedEnum(entityType, VALID_ENTITY_TYPES)) {
        errors.push(`Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }

    // Name
    if (!isNonEmpty(name)) {
        errors.push('Name is required');
    } else if (!isLengthValid(name, 2, 100)) {
        errors.push('Name must be between 2 and 100 characters');
    } else if (hasDangerousChars(name)) {
        errors.push('Name contains invalid characters');
    }

    // Phone
    if (!isNonEmpty(phone)) {
        errors.push('Phone number is required');
    } else if (!isValidMobile(phone)) {
        errors.push('Phone must be a valid 10-digit Indian number starting with 6-9');
    }

    // Aadhaar number — required for verification submission
    if (!isNonEmpty(aadhaarNumber)) {
        errors.push('Aadhaar number is required');
    } else if (!/^\d{12}$/.test(String(aadhaarNumber).trim())) {
        errors.push('Aadhaar number must be exactly 12 digits');
    }

    // Aadhaar front image — required
    if (!isNonEmpty(aadhaarFrontUrl)) {
        errors.push('Aadhaar front image is required');
    } else if (!aadhaarFrontUrl.startsWith('data:image') && !aadhaarFrontUrl.startsWith('http')) {
        errors.push('Aadhaar front image must be a valid base64 image or URL');
    }

    // Aadhaar back image — required
    if (!isNonEmpty(aadhaarBackUrl)) {
        errors.push('Aadhaar back image is required');
    } else if (!aadhaarBackUrl.startsWith('data:image') && !aadhaarBackUrl.startsWith('http')) {
        errors.push('Aadhaar back image must be a valid base64 image or URL');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/verification/requests/:id/reject
 * Validates: reason (optional but recommended)
 */
export const validateRejectVerification = (req, res, next) => {
    const { reason } = req.body;
    const errors = [];

    if (reason !== undefined && isNonEmpty(reason)) {
        if (!isLengthValid(reason, 5, 500)) {
            errors.push('Rejection reason must be between 5 and 500 characters');
        } else if (hasDangerousChars(reason)) {
            errors.push('Rejection reason contains invalid characters');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 🏷️ CATEGORY VALIDATORS
// ─────────────────────────────────────────

/**
 * POST /api/admin/labour-categories
 * Validates: name (required, 2-80 chars), image (optional URL or base64)
 */
export const validateCreateCategory = (req, res, next) => {
    const { name, image } = req.body;
    const errors = [];

    if (!isNonEmpty(name)) {
        errors.push('Category name is required');
    } else if (!isLengthValid(name, 2, 80)) {
        errors.push('Category name must be between 2 and 80 characters');
    } else if (hasDangerousChars(name)) {
        errors.push('Category name contains invalid characters');
    } else if (!/^[a-zA-Z\s\-/()&]+$/.test(name.trim())) {
        errors.push('Category name can only contain letters, spaces, hyphens, slashes, and parentheses');
    }

    if (image !== undefined && isNonEmpty(image)) {
        if (!image.startsWith('data:image') && !image.startsWith('http')) {
            errors.push('Image must be a valid base64 encoded image or a URL starting with http');
        }
    }

    if (req.body.subCategories !== undefined) {
        if (!Array.isArray(req.body.subCategories)) {
            errors.push('subCategories must be an array');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/labour-categories/:id
 * At least one field required
 */
export const validateUpdateCategory = (req, res, next) => {
    const { name, image, isActive } = req.body;
    const errors = [];

    const hasAtLeastOneField = ['name', 'image', 'isActive', 'subCategories'].some((f) => req.body[f] !== undefined);
    if (!hasAtLeastOneField) {
        errors.push('At least one field must be provided to update');
    }

    if (name !== undefined && isNonEmpty(name)) {
        if (!isLengthValid(name, 2, 80)) {
            errors.push('Category name must be between 2 and 80 characters');
        } else if (hasDangerousChars(name)) {
            errors.push('Category name contains invalid characters');
        }
    }

    if (image !== undefined && isNonEmpty(image)) {
        if (!image.startsWith('data:image') && !image.startsWith('http')) {
            errors.push('Image must be a valid base64 encoded image or a URL starting with http');
        }
    }

    if (req.body.subCategories !== undefined) {
        if (!Array.isArray(req.body.subCategories)) {
            errors.push('subCategories must be an array');
        }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        errors.push('isActive must be a boolean value');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 📝 CMS VALIDATORS
// ─────────────────────────────────────────

const VALID_CMS_SECTIONS = ['aboutUs', 'contactUs', 'terms', 'privacy'];

/**
 * PUT /api/admin/cms/:section
 * Validates: section param, content/value (required, non-empty)
 */
export const validateUpdateCMSSection = (req, res, next) => {
    const { section } = req.params;
    const { content, value } = req.body;
    const errors = [];

    // Section param validation
    if (!isNonEmpty(section)) {
        errors.push('Section parameter is required');
    } else if (!isAllowedEnum(section, VALID_CMS_SECTIONS)) {
        errors.push(`Section must be one of: ${VALID_CMS_SECTIONS.join(', ')}`);
    }

    // Content or value — one must be present
    const contentToUpdate = content || value;
    if (!isNonEmpty(contentToUpdate)) {
        errors.push('Content or value is required and cannot be empty');
    } else if (!isLengthValid(contentToUpdate, 5, 50000)) {
        errors.push('Content must be between 5 and 50000 characters');
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

/**
 * PUT /api/admin/cms (bulk update)
 * At least one CMS section must be provided
 */
export const validateUpdateCMSContent = (req, res, next) => {
    const { aboutUs, contactUs, terms, privacy } = req.body;
    const errors = [];

    const hasAtLeastOneSection = [aboutUs, contactUs, terms, privacy].some(
        (val) => val !== undefined && isNonEmpty(val)
    );

    if (!hasAtLeastOneSection) {
        errors.push('At least one CMS section (aboutUs, contactUs, terms, privacy) must be provided');
    }

    // Each provided field gets length-checked
    const fields = { aboutUs, contactUs, terms, privacy };
    for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined && isNonEmpty(val)) {
            if (!isLengthValid(val, 5, 50000)) {
                errors.push(`${key} content must be between 5 and 50000 characters`);
            }
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};

// ─────────────────────────────────────────
// 🔒 SHARED / GENERAL VALIDATORS
// ─────────────────────────────────────────

/**
 * Generic MongoDB ObjectId param validator.
 * Usage: router.get('/:id', validateObjectIdParam('id'), controller)
 * @param {string} paramName - The req.params key to validate
 */
export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
        return validationError(res, `Invalid ${paramName}: must be a valid 24-character MongoDB ObjectId`);
    }
    next();
};

/**
 * Generic pagination query validator.
 * Ensures page and limit are positive integers within sane bounds.
 */
export const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;
    const errors = [];

    if (page !== undefined) {
        const pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) {
            errors.push('page must be a positive integer (minimum 1)');
        } else if (pageNum > 10000) {
            errors.push('page value is too large (maximum 10000)');
        }
    }

    if (limit !== undefined) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1) {
            errors.push('limit must be a positive integer (minimum 1)');
        } else if (limitNum > 200) {
            errors.push('limit cannot exceed 200 records per page');
        }
    }

    if (errors.length > 0) {
        return validationError(res, errors[0], errors);
    }
    next();
};
