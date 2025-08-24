const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET_KEY = process.env.JWT_SECRET;

if (!JWT_SECRET_KEY) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined! Set it in your environment variables.");
}

const checkTokenAndRole = (allowedRoles = []) => {
    return function (req, res, next) {
        const token = req.headers["authorization"];

        // Case: No token → assume public "user"
        if (!token) {
            if (allowedRoles.includes("user")) {
                req.user = { role: "user" }; // minimal info
                return next();
            }
            return res.status(401).json({ error: "No token provided." });
        }

        // Clean token
        const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

        jwt.verify(tokenWithoutBearer, JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Failed to authenticate token." });
            }

            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({ error: "Token has expired." });
            }

            req.user = {
                id: decoded.id || decoded.userId,
                role: decoded.role,
                email: decoded.email,
                name: decoded.name
            };

            // Role check
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ error: "You do not have permission to access this resource." });
            }

            next();
        });
    };
};

module.exports = { checkTokenAndRole };
