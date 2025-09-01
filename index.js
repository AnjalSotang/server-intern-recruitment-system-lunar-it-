require('dotenv').config()
const express = require("express")
//Database Connection
const cors = require('cors'); // Import the cors package
const connectDB = require("./database/index")
const { connect } = require('mongoose')
const app = express()
const bcrypt = require('bcrypt')
const path = require("path");

//parshing the json so that express understand the code
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


// Define the CORS options
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:5173'] // Whitelist the domains you want to allow
};

app.use(cors(corsOptions)); // Use the cors middleware with your options


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

app.use("/api", positionRoutes, applicatonRoutes, memberRoutes, interviewRoutes, notificationRoutes, dashboardSummaryRoutes, messagesRoutes)
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

app.listen(process.env.PORT, () => {
    console.log("Server is running on port 3000"
    )
})