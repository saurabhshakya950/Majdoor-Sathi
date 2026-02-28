import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.model.js';

// Protect admin routes
export const protectAdmin = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.adminToken) {
            token = req.cookies.adminToken;
        }

        if (!token) {
            console.log('❌ Admin Auth: No token provided');
            return res.status(401).json({
                success: false,
                message: 'TOKEN_MISSING',
                error: 'No authentication token provided'
            });
        }

        // Verify token with detailed error logging
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Admin Auth: Token verified successfully for admin ID:', decoded.id);
        } catch (jwtError) {
            console.log('❌ Admin Auth: JWT verification failed:', jwtError.message);
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'TOKEN_EXPIRED',
                    error: 'Authentication token has expired'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'TOKEN_INVALID',
                error: 'Invalid authentication token'
            });
        }

        // Find admin in database
        req.admin = await Admin.findById(decoded.id).select('-password -__v');

        if (!req.admin) {
            console.log('❌ Admin Auth: Admin not found in database for ID:', decoded.id);
            return res.status(401).json({
                success: false,
                message: 'ADMIN_NOT_FOUND',
                error: 'Admin account not found'
            });
        }

        if (!req.admin.isActive) {
            console.log('❌ Admin Auth: Admin account is deactivated:', decoded.id);
            return res.status(403).json({
                success: false,
                message: 'ACCOUNT_DEACTIVATED',
                error: 'Admin account is deactivated'
            });
        }

        console.log('✅ Admin Auth: Access granted for admin:', req.admin.username);
        next();
    } catch (error) {
        console.log('❌ Admin Auth: Unexpected error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'AUTH_ERROR',
            error: 'Authentication error occurred'
        });
    }
};

// Check admin role
export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (!allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Role-specific middleware shortcuts
export const isSuperAdmin = checkRole(['SUPER_ADMIN']);
export const isUserAdmin = checkRole(['SUPER_ADMIN', 'ADMIN_USER']);
export const isLabourAdmin = checkRole(['SUPER_ADMIN', 'ADMIN_LABOUR']);
export const isContractorAdmin = checkRole(['SUPER_ADMIN', 'ADMIN_CONTRACTOR']);
