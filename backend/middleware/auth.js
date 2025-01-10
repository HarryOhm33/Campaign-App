const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const auth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token is expired
            if (verified.exp && Date.now() >= verified.exp * 1000) {
                return res.status(401).json({ message: 'Token has expired' });
            }

            req.user = verified;
            next();
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            } else if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            } else {
                return res.status(401).json({ message: 'Token verification failed' });
            }
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ message: 'Internal server error during authentication' });
    }
};

const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token is expired
            if (verified.exp && Date.now() >= verified.exp * 1000) {
                return res.status(401).json({ message: 'Token has expired' });
            }

            if (verified.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
            }
            
            req.user = verified;
            next();
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            } else if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            } else {
                return res.status(401).json({ message: 'Token verification failed' });
            }
        }
    } catch (err) {
        console.error('Admin auth middleware error:', err);
        res.status(500).json({ message: 'Internal server error during authentication' });
    }
};

module.exports = { auth, adminAuth, authLimiter };
