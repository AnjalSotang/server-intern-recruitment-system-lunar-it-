require('dotenv').config()
const express = require("express")
const cors = require('cors');
const connectDB = require("./database/index")
const app = express()
const bcrypt = require('bcrypt')
const path = require("path");

console.log('🚀 Starting minimal server...');

// CORS setup
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://intern-recruitment-system-lunar-it.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/cors-test', (req, res) => {
    res.json({ 
        message: 'CORS test successful!',
        origin: req.headers.origin,
        timestamp: new Date()
    });
});

console.log('✅ Basic server setup complete');

connectDB()
console.log('✅ Database connection initiated');

// Test ONLY ONE ROUTE at a time
// Comment out all except ONE to test each individually

// TEST 1: Only authRoutes
console.log('📥 Testing authRoutes...');
try {
    const authRoutes = require("./routes/authRoutes");
    app.use("/auth", authRoutes);
    console.log('✅ authRoutes loaded successfully');
} catch (error) {
    console.error('❌ ERROR in authRoutes:', error.message);
    console.error('Stack:', error.stack);
}

// TEST 2: Only positionRoutes (uncomment to test)
// console.log('📥 Testing positionRoutes...');
// try {
//     const positionRoutes = require("./routes/positionRoute");
//     app.use("/api", positionRoutes);
//     console.log('✅ positionRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in positionRoutes:', error.message);
// }

// TEST 3: Only applicationRoutes (uncomment to test)
// console.log('📥 Testing applicationRoutes...');
// try {
//     const applicatonRoutes = require("./routes/applicationRoutes");
//     app.use("/api", applicatonRoutes);
//     console.log('✅ applicationRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in applicationRoutes:', error.message);
// }

// TEST 4: Only memberRoutes (uncomment to test)
// console.log('📥 Testing memberRoutes...');
// try {
//     const memberRoutes = require("./routes/memberRoutes");
//     app.use("/api", memberRoutes);
//     console.log('✅ memberRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in memberRoutes:', error.message);
// }

// TEST 5: Only interviewRoutes (uncomment to test)
// console.log('📥 Testing interviewRoutes...');
// try {
//     const interviewRoutes = require("./routes/interviewRoutes");
//     app.use("/api", interviewRoutes);
//     console.log('✅ interviewRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in interviewRoutes:', error.message);
// }

// TEST 6: Only notificationRoutes (uncomment to test)
// console.log('📥 Testing notificationRoutes...');
// try {
//     const notificationRoutes = require("./routes/notificationRoutes");
//     app.use("/api", notificationRoutes);
//     console.log('✅ notificationRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in notificationRoutes:', error.message);
// }

// TEST 7: Only dashboardSummaryRoutes (uncomment to test)
// console.log('📥 Testing dashboardSummaryRoutes...');
// try {
//     const dashboardSummaryRoutes = require("./routes/dashboardSummaryRoutes");
//     app.use("/api", dashboardSummaryRoutes);
//     console.log('✅ dashboardSummaryRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in dashboardSummaryRoutes:', error.message);
// }

// TEST 8: Only messagesRoutes (uncomment to test)
// console.log('📥 Testing messagesRoutes...');
// try {
//     const messagesRoutes = require("./routes/messagesRoutes");
//     app.use("/api", messagesRoutes);
//     console.log('✅ messagesRoutes loaded successfully');
// } catch (error) {
//     console.error('❌ ERROR in messagesRoutes:', error.message);
// }

console.log('✅ Route testing complete');

// User model and creation
const User = require("./model/userModal");

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

// Static files
app.use('/api/images', express.static(path.join(__dirname, 'storage/images')));
app.use('/api/resumes', express.static(path.join(__dirname, 'storage/resumes')));

createUser();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running successfully on port ${PORT}`);
    console.log(`📡 Test at: https://server-intern-recruitment-system-lunar-it.onrender.com/cors-test`);
});