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
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://intern-recruitment-system-lunar-it.onrender.com']
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

const positionRoutes = require("./routes/positionRoute")
const applicatonRoutes = require("./routes/applicationRoutes")
const authRoutes = require("./routes/authRoutes")
const memberRoutes = require("./routes/memberRoutes")
const interviewRoutes = require("./routes/interviewRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const dashboardSummaryRoutes = require("./routes/dashboardSummaryRoutes")
const messagesRoutes = require("./routes/messagesRoutes")
 
const User = require("./model/userModal")

app.use("/api", positionRoutes)
app.use("/api", applicatonRoutes);
app.use("/api", memberRoutes);
app.use("/api", interviewRoutes);
app.use("/api", notificationRoutes);
app.use("/api", dashboardSummaryRoutes);
app.use("/api", messagesRoutes);
app.use("/auth", authRoutes)
app.use('/api/images', express.static(path.join(__dirname, 'storage/images')));
// Serve resumes from the storage/resumes directory  
app.use('/api/resumes', express.static(path.join(__dirname, 'storage/resumes')));

const createUser = async () => {
    let foundAdmin = await User.findOne({ role: "admin" });

    if (!foundAdmin) {
        const hashpassword = await bcrypt.hash("password", 8);
        await User.create({
            name: "Admin Bahadur",
            email: "raianjal555@gmail.com",
            password: hashpassword,
            role: "admin"
        });
        console.log("Admin user created successfully");
    } else {
        console.log("Admin user already exists");
    }
};

createUser();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});