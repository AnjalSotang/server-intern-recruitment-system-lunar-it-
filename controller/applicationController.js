const Position = require('../model/positionModal');
const Application = require('../model/applicationModal');
const sendEmail = require("../utils/sendEmail");
const path = require('path');
const fs = require('fs');
const { createApplicationNotification } = require('./notificationController');


// POST /api/application/:id - Create new application
const postApplication = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify position exists and is valid ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const position = await Position.findById(id);
        if (!position) {
            return res.status(404).json({ error: 'Position not found' });
        }

        // Check if position is still active
        if (position.status === 'closed') {
            return res.status(400).json({
                error: 'Position is closed for applications',
                positionTitle: position.title
            });
        }

        // Check if user already applied for this position
        const existingApplication = await Application.findOne({
            email: req.body.email,
            position: id
        });

        if (existingApplication) {
            return res.status(400).json({
                error: 'You have already applied for this position',
                applicationId: existingApplication._id
            });
        }

        // Parse skills if sent as JSON string
        let skills = req.body.skills;
        if (typeof skills === 'string') {
            try {
                skills = JSON.parse(skills);
            } catch {
                skills = [];
            }
        }

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'university', 'major', 'graduationYear', 'portfolioUrl'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields
            });
        }

        // Convert graduationYear to number
        const graduationYear = parseInt(req.body.graduationYear);
        if (isNaN(graduationYear)) {
            return res.status(400).json({ error: 'Invalid graduation year format' });
        }

        // Prepare application data
        const applicationData = {
            firstName: req.body.firstName?.trim(),
            lastName: req.body.lastName?.trim(),
            email: req.body.email?.trim().toLowerCase(),
            phone: req.body.phone?.trim() || '',
            university: req.body.university?.trim(),
            major: req.body.major?.trim(),
            graduationYear,
            gpa: req.body.gpa?.trim() || '',
            portfolioUrl: req.body.portfolioUrl?.trim(),
            githubUrl: req.body.githubUrl?.trim() || '',
            linkedinUrl: req.body.linkedinUrl?.trim() || '',
            coverLetter: req.body.coverLetter?.trim() || '',
            additionalInfo: req.body.additionalInfo?.trim() || '',
            skills: skills || [],
            position: id,
            positionTitle: position.title,
            department: position.department
        };

        // Add resume file if uploaded
        if (req.file) {
            applicationData.resume = req.file.path;
        }

        // Create and save application
        const application = new Application(applicationData);
        await application.save();

        // Increment application count
        await Position.findByIdAndUpdate(id, {
            $inc: { currentApplications: 1 }
        });

        // Prepare formatted response
        const formattedResponse = {
            id: application._id,
            fullName: `${application.firstName} ${application.lastName}`,
            email: application.email,
            position: application.positionTitle,
            status: application.status,
            submittedAt: application.createdAt
        };

        // Respond to client immediately
        res.status(201).json({
            message: 'Application submitted successfully',
            data: formattedResponse
        });

        // Send confirmation email in background
        setImmediate(async () => {
            try {
                await createApplicationNotification(application, position)
                const subject = `Application Received - ${position.title}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; padding:20px;">
                        <p>Dear ${application.firstName},</p>
                        <p>Thank you for applying for the <strong>${position.title}</strong> position at ${position.department}.</p>
                        <p>We have received your application and will review it shortly.</p>
                        <p>Best regards,<br>The Recruitment Team</p>
                    </div>
                `;

                await sendEmail(application.email, subject, html);
                console.log(`✅ Application confirmation email sent to ${application.email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send confirmation email to ${application.email}:`, emailError);
            }
        });

    } catch (error) {
        console.error('Application submission error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                error: 'An application with this email already exists for this position'
            });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};



// GET /api/application/:id - Get application by ID
const getApplications = async (req, res) => {
    try {
        const application = await Application.find()
            .populate('position', 'title department location type');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.status(200).json(
            {
                data: application
            }
        );
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/application/:id - Get application by ID
const getApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid application ID format' });
        }

        const application = await Application.findById(id)
            .populate('position', 'title department location type');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.status(200).json(application);
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/application/:id/status - Update application status

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params; // Application ID
        const { status, sendNotification, notes } = req.body;

        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        application.status = status;
        await application.save();

        // Respond to client first
        res.status(200).json({
            message: "Application status updated successfully",
            data: application,
        });

        // Send notification in background (if enabled)
        if (sendNotification) {
            setImmediate(async () => {
                try {
                    let subject = "";
                    let html = "";

                    if (status === "accepted") {
                        subject = "Congratulations! Your Application Has Been Accepted";
                        html = `
                        <div style="font-family:sans-serif; padding:20px;">
                            <p>Dear ${application.firstName},</p>
                            <p>We are pleased to inform you that your application for <strong>${application.positionTitle}</strong> has been accepted. We will contact you with the next steps soon.</p>
                            <p>Best regards,<br>HR Team</p>
                        </div>
                        `;
                    } else if (status === "rejected") {
                        subject = "Update on Your Application Status";
                        html = `
                        <div style="font-family:sans-serif; padding:20px;">
                            <p>Dear ${application.firstName},</p>
                            <p>We appreciate your interest in <strong>${application.positionTitle}</strong>. Unfortunately, we will not be moving forward with your application.</p>
                            <p>Best regards,<br>HR Team</p>
                        </div>
                        `;
                    } else {
                        subject = "Application Status Updated";
                        html = `
                        <div style="font-family:sans-serif; padding:20px;">
                            <p>Dear ${application.firstName},</p>
                            <p>Your application status has been updated to: <strong>${status}</strong>.</p>
                            <p>Notes: ${notes || "No additional notes provided."}</p>
                        </div>
                        `;
                    }

                    await sendEmail(application.email, subject, html);
                    console.log(`✅ Status update email sent to ${application.email}`);
                } catch (emailError) {
                    console.error(`❌ Failed to send status email to ${application.email}:`, emailError);
                }
            });
        }

    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Download resume for specific application
const downloadResume = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId); // or .findByPk() if Sequelize
        if (!application) return res.status(404).json({ error: 'Application not found' });
        if (!application.resume) return res.status(404).json({ error: 'No resume for this application' });

        const filePath = path.resolve(path.join(__dirname, '..', application.resume));
        const allowedDir = path.resolve(path.join(__dirname, '..', 'storage'));
        if (!filePath.startsWith(allowedDir)) return res.status(403).json({ error: 'Access denied' });

        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

        const fileExtension = path.extname(filePath).toLowerCase();
        const filename = `${application.firstName}_${application.lastName}_Resume${fileExtension}`;

        const contentTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

        res.setHeader('Content-Type', contentTypes[fileExtension] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        fs.createReadStream(filePath).pipe(res);

    } catch (err) {
        // console.error('Download error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the application
        const deletedApplication = await Application.findByIdAndDelete(id);

        if (!deletedApplication) {
            return res.status(404).json({ message: "Application not found" });
        }

        // If resume exists, delete it from local storage
        if (deletedApplication.resume) {
            const filePath = path.resolve(deletedApplication.resume); // Already includes storage/resume

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                    return res.status(500).json({ message: "Error deleting file" });
                }

                console.log("File deleted successfully");
                return res.status(200).json({
                    message: "Application and file deleted successfully"
                });
            });
        } else {
            return res.status(200).json({
                message: "Application deleted successfully (no file found)"
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error deleting application",
            error: error.message
        });
    }
};

const emailTemplates = [
    {
        id: "custom",
        name: "Custom Message",
        subject: "",
        body: "",
    },
    {
        id: "acknowledgment",
        name: "Application Acknowledgment",
        subject: "Thank you for your application - {{position}}",
        body: `Dear {{candidateName}},

Thank you for your interest in the {{position}} position at our company. We have received your application and are currently reviewing it.

We will be in touch within the next few days regarding the next steps in our hiring process.

Best regards,
The Hiring Team`,
    },
    {
        id: "interview-request",
        name: "Interview Request",
        subject: "Interview Invitation - {{position}}",
        body: `Dear {{candidateName}},

We are pleased to inform you that we would like to schedule an interview for the {{position}} position.

Please let us know your availability for the coming week, and we will coordinate a suitable time.

We look forward to speaking with you soon.

Best regards,
The Hiring Team`,
    },
    {
        id: "status-update",
        name: "Status Update",
        subject: "Update on your application - {{position}}",
        body: `Dear {{candidateName}},

We wanted to provide you with an update on your application for the {{position}} position.

Your application is currently under review, and we will contact you with next steps soon.

Thank you for your patience.

Best regards,
The Hiring Team`,
    },
    {
        id: "additional-info",
        name: "Request Additional Information",
        subject: "Additional Information Required - {{position}}",
        body: `Dear {{candidateName}},

Thank you for your application for the {{position}} position. To proceed with your application, we need some additional information from you.

Please provide the following at your earliest convenience:
- [Specify what information is needed]

You can reply directly to this email with the requested information.

Best regards,
The Hiring Team`,
    },
];


const sendApplicationMessage = async (req, res) => {
    try {
        const { id } = req.params; // Application ID
        const {
            subject: reqSubject,
            message: reqMessage,
            priority,
            copyToTeam,
            scheduleEmail,
            scheduledDate,
            scheduledTime,
            template,
        } = req.body;

        // 1. Find the application
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // 2. Select template or fallback to custom message
        const selectedTemplate = emailTemplates.find((t) => t.id === template) || {
            subject: reqSubject || "",
            body: reqMessage || "",
        };

        // 3. Replace variables in subject and body
        const replaceVariables = (text) => {
            return text
                .replace(/{{candidateName}}/g, application.firstName || "")
                .replace(/{{position}}/g, application.positionTitle || "")
                .replace(/\n/g, "<br>");
        };

        const finalSubject = replaceVariables(selectedTemplate.subject) || reqSubject;
        const finalBody = replaceVariables(selectedTemplate.body) || reqMessage;

        // Validate subject and message
        if (!finalSubject.trim() || !finalBody.trim()) {
            return res.status(400).json({ message: "Subject and message are required" });
        }

        // 4. Update application priority if provided
        if (priority) {
            application.priority = priority;
            await application.save();
        }

        // 5. Handle scheduled email - (persist if you want)
        if (scheduleEmail) {
            // Example: you could save scheduled emails in DB for cron job to process later
            // For now, just return success response
            return res.status(200).json({
                message: `Email scheduled to be sent to ${application.firstName} on ${scheduledDate} at ${scheduledTime}`,
            });
        }

        // 6. Prepare HTML content for immediate send
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color:#333; padding:20px;">
                ${finalBody}
                <p style="margin-top:20px;">Best regards,<br>The Hiring Team</p>
            </div>
        `;

        // 7. Send email to candidate
        await sendEmail(application.email, finalSubject, htmlContent);

        // 8. Optionally send copy to hiring team
        if (copyToTeam) {
            const teamEmail = "hr-team@yourcompany.com"; // Replace with your HR team email
            await sendEmail(teamEmail, `COPY: ${finalSubject}`, htmlContent);
        }

        // 9. Respond success
        res.status(200).json({
            message: "Message sent successfully",
            data: {
                applicationId: id,
                candidateEmail: application.email,
                subject: finalSubject,
                priority: application.priority,
                template: template || "custom",
                sentAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    postApplication,
    getApplications,
    getApplication,
    updateApplicationStatus,
    downloadResume, // Export this function
    deleteApplication,
    sendApplicationMessage
};