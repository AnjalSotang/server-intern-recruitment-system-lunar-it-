require('dotenv').config()
const express = require("express")
const cors = require('cors'); // Import the cors package
//Database Connection
const connectDB = require("./database/index")
const { connect } = require('mongoose')
const app = express()
const bcrypt = require('bcrypt')
const path = require("path");

// Define the CORS options FIRST
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://intern-recruitment-system-lunar-it.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
};

// Apply CORS middleware EARLY
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Then other middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Add a test endpoint to verify CORS is working
app.get('/cors-test', (req, res) => {
    res.json({ 
        message: 'CORS test successful!',
        origin: req.headers.origin,
        timestamp: new Date()
    });
});

connectDB()

// Load and test routes ONE BY ONE to find the problematic route
console.log('🚀 Starting server with route debugging...');

try {
    console.log('📥 Loading authRoutes...');
    const authRoutes = require("./routes/authRoutes");
    app.use("/auth", authRoutes);
    console.log('✅ authRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in authRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading positionRoutes...');
    const positionRoutes = require("./routes/positionRoute");
    app.use("/api", positionRoutes);
    console.log('✅ positionRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in positionRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading applicationRoutes...');
    const applicatonRoutes = require("./routes/applicationRoutes");
    app.use("/api", applicatonRoutes);
    console.log('✅ applicationRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in applicationRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading memberRoutes...');
    const memberRoutes = require("./routes/memberRoutes");
    app.use("/api", memberRoutes);
    console.log('✅ memberRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in memberRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading interviewRoutes...');
    const interviewRoutes = require("./routes/interviewRoutes");
    app.use("/api", interviewRoutes);
    console.log('✅ interviewRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in interviewRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading notificationRoutes...');
    const notificationRoutes = require("./routes/notificationRoutes");
    app.use("/api", notificationRoutes);
    console.log('✅ notificationRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in notificationRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading dashboardSummaryRoutes...');
    const dashboardSummaryRoutes = require("./routes/dashboardSummaryRoutes");
    app.use("/api", dashboardSummaryRoutes);
    console.log('✅ dashboardSummaryRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in dashboardSummaryRoutes:', error.message);
    process.exit(1);
}

try {
    console.log('📥 Loading messagesRoutes...');
    const messagesRoutes = require("./routes/messagesRoutes");
    app.use("/api", messagesRoutes);
    console.log('✅ messagesRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in messagesRoutes:', error.message);
    process.exit(1);
}

console.log('🎉 All routes loaded successfully!');
 
const User = require("./model/userModal")

// Static file serving
app.use('/api/images', express.static(path.join(__dirname, 'storage/images')));
app.use('/api/resumes', express.static(path.join(__dirname, 'storage/resumes')));

const createUser = async () => {
    try {
        let foundAdmin = await User.findOne({ role: "admin" });

        if (!foundAdmin) {
            const hashpassword = await bcrypt.hash("password", 8);
            await User.create({
                name: "Admin Bahadur",
                email: "raianjal555@gmail.com",
                password: hashpassword,
                role: "admin"
            });
            console.log("✅ Admin user created successfully");
        } else {
            console.log("✅ Admin user already exists");
        }
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    }
};

createUser();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running successfully on port ${PORT}`);
    console.log(`📡 Test CORS at: https://server-intern-recruitment-system-lunar-it.onrender.com/cors-test`);
});