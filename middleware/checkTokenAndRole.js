const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET_KEY = process.env.JWT_SECRET;

if (!JWT_SECRET_KEY) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined! Set it in your environment variables.");
}

const checkTokenAndRole = (allowedRoles = []) => {
    return function (req, res, next) {
        const token = req.headers["authorization"];
        // console.log(token)

        // Case: No token → assume public "user"
        if (!token) {
            if (allowedRoles.includes("user")) {
                req.user = { role: "user" }; // minimal info
                return next();
            }
            return res.status(401).json({ error: "No token provided." });
        }

        // Clean token
        const tokenWithoutBearer = token.split("Bearer ").filter(Boolean)[0]
        if (!tokenWithoutBearer) {
            return res.status(401).json({ error: "No Bearer token provided." });
        }

        try {
            const decoded = jwt.verify(tokenWithoutBearer, JWT_SECRET_KEY)
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
        } catch (err) {
            if (err.name == "JsonWebTokenError") {
                return res.status(508).json({ error: "Failed to authenticate token.", err });
            }
            if (err.name == 'TokenExpiredError') return res.status(508).json({ error: "Session Expired." });


            return res.status(401).json({ error: "Failed to authenticate token.", err });

        }
    };
};

module.exports = { checkTokenAndRole };
