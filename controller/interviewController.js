const Interview = require("../model/interviewModal");
const Member = require("../model/memberModal");
const Applicantion = require("../model/applicationModal"); // <-- Make sure you have this model
const sendEmail = require("../utils/sendEmail"); // <-- Assuming you have a utility for sending emails
const { createInterviewUpdateNotification, createInterviewCancelNotification } = require("./notificationController");


// Helper function to determine what changed in the interview
const getInterviewChanges = (existing, updated) => {
    const changes = [];

    // Check date changes
    if (existing.date.toDateString() !== updated.date.toDateString()) {
        changes.push(`date changed to ${updated.date.toLocaleDateString()}`);
    }

    // Check time changes
    if (existing.time !== updated.time) {
        changes.push(`time changed to ${updated.time}`);
    }

    // Check status changes
    if (existing.status !== updated.status) {
        changes.push(`status updated to ${updated.status}`);
    }

    // Check interviewer changes
    if (existing.interviewerId._id.toString() !== updated.interviewerId.toString()) {
        changes.push('interviewer reassigned');
    }

    // Check type changes
    if (existing.type !== updated.type) {
        changes.push(`type changed to ${updated.type}`);
    }

    // Check location/meeting link changes
    if (existing.location !== updated.location && updated.location) {
        changes.push('location updated');
    }

    if (existing.meetingLink !== updated.meetingLink && updated.meetingLink) {
        changes.push('meeting link updated');
    }

    return changes;
};


const scheduleInterview = async (req, res) => {
    try {
        const {
            interviewerId,
            date,
            time,
            type,
            location,
            meetingLink,
            duration,
            notes,
            status,
            applicantId,
            sendNotification
        } = req.body;

        // 1. Find interviewer
        const interviewer = await Member.findById(interviewerId);
        if (!interviewer) {
            return res.status(404).json({ message: "Interviewer not found" });
        }

        // 2. Find applicant
        const applicant = await Applicantion.findById(applicantId);
        if (!applicant) {
            return res.status(404).json({ message: "Applicant not found" });
        }

        // 3. Create interview
        let interview = new Interview({
            interviewerId,
            date,
            time,
            type,
            location,
            meetingLink,
            duration,
            notes,
            applicantId,
            status
        });

        await interview.save();

        // 4. Populate for formatted response
        interview = await Interview.findById(interview._id)
            .populate('applicantId', 'firstName lastName positionTitle email')
            .populate('interviewerId', 'name email');

        const formatted = {
            id: interview._id,
            candidateName: `${interview.applicantId.firstName} ${interview.applicantId.lastName}`,
            position: interview.applicantId.positionTitle,
            interviewer: interview.interviewerId.name,
            date: interview.date.toISOString().split('T')[0],
            time: interview.time,
            type: interview.type,
            status: interview.status,
            meetingLink: interview.meetingLink || '',
            location: interview.location || '',
            notes: interview.notes || ''
        };

        // 5. Send API response immediately
        res.status(201).json({
            message: "Interview scheduled successfully",
            data: formatted
        });

        // 6. Send emails in the background
        if (sendNotification) {
            setImmediate(async () => {
                try {
                    const applicantSubject = "Interview Scheduled";
                    const applicantHtml = `
                        <div style="font-family: Arial, sans-serif; padding:20px;">
                            <p>Dear ${applicant.firstName},</p>
                            <p>Your interview has been scheduled.</p>
                            <p><strong>Date:</strong> ${date}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            <p><strong>Type:</strong> ${type}</p>
                            <p><strong>Interviewer:</strong> ${interviewer.name}</p>
                            <p><strong>Location / Link:</strong> ${location || meetingLink}</p>
                            <p><strong>Notes:</strong> ${notes || "No additional notes."}</p>
                        </div>
                    `;

                    const interviewerSubject = "You have been assigned an interview";
                    const interviewerHtml = `
                        <div style="font-family: Arial, sans-serif; padding:20px;">
                            <p>Dear ${interviewer.name},</p>
                            <p>You have been assigned to interview an applicant.</p>
                            <p><strong>Applicant:</strong> ${applicant.firstName} ${applicant.lastName}</p>
                            <p><strong>Date:</strong> ${date}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            <p><strong>Type:</strong> ${type}</p>
                            <p><strong>Location / Link:</strong> ${location || meetingLink}</p>
                            <p><strong>Notes:</strong> ${notes || "No additional notes."}</p>
                        </div>
                    `;

                    await sendEmail(applicant.email, applicantSubject, applicantHtml);
                    await sendEmail(interviewer.email, interviewerSubject, interviewerHtml);

                    console.log(`✅ Notification emails sent for interview ${interview._id}`);
                } catch (emailError) {
                    console.error(`❌ Failed to send notification emails for interview ${interview._id}:`, emailError);
                }
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const fetchInterview = async (req, res) => {
    try {
        const interviews = await Interview.find()
            .sort({ createdAt: -1 })
            .populate('applicantId', 'firstName lastName positionTitle') // select fields from Application
            .populate('interviewerId', 'name'); // select fields from Member

        // Map to custom format
        const formatted = interviews.map(interview => ({
            id: interview._id,
            candidateName: `${interview.applicantId.firstName} ${interview.applicantId.lastName}`,
            position: interview.applicantId.positionTitle,
            interviewer: interview.interviewerId.name,
            date: interview.date.toISOString().split('T')[0], // format YYYY-MM-DD
            time: interview.time,
            type: interview.type,
            status: interview.status,
            meetingLink: interview.meetingLink || '',
            location: interview.location || '',
            notes: interview.notes || ''
        }));

        res.status(200).json({ data: formatted });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

};

const updateInterview = async (req, res) => {
    try {
        const { id } = req.params; // Interview ID from URL params
        const {
            candidateName,
            position,
            interviewer,
            date,
            time,
            type,
            status,
            location,
            meetingLink,
            notes,
        } = req.body;

        // 1. Find existing interview with populated data
        const existingInterview = await Interview.findById(id)
            .populate('applicantId', 'firstName lastName positionTitle email')
            .populate('interviewerId', 'name email');

        if (!existingInterview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        // 2. Handle interviewer changes if interviewer name is provided
        let interviewerId = existingInterview.interviewerId._id;
        if (interviewer && interviewer !== existingInterview.interviewerId.name) {
            // Find interviewer by name (you might want to change this to use ID instead)
            const newInterviewer = await Member.findOne({ name: interviewer });
            if (!newInterviewer) {
                return res.status(404).json({ message: "Interviewer not found" });
            }
            interviewerId = newInterviewer._id;
        }

        // 3. Handle candidate changes if candidate name is provided
        let applicantId = existingInterview.applicantId._id;
        if (candidateName && candidateName !== `${existingInterview.applicantId.firstName} ${existingInterview.applicantId.lastName}`) {
            // Split candidateName to find applicant
            const [firstName, ...lastNameParts] = candidateName.split(' ');
            const lastName = lastNameParts.join(' ');

            const newApplicant = await Application.findOne({ // Fixed typo
                firstName: firstName,
                lastName: lastName
            });
            if (!newApplicant) {
                return res.status(404).json({ message: "Applicant not found" });
            }
            applicantId = newApplicant._id;
        }

        // 4. Prepare update data
        const updateData = {
            interviewerId,
            applicantId,
            date: date ? new Date(date) : existingInterview.date,
            time: time || existingInterview.time,
            type: type || existingInterview.type,
            status: status || existingInterview.status,
            location: location || existingInterview.location || '',
            meetingLink: meetingLink || existingInterview.meetingLink || '',
            notes: notes || existingInterview.notes || ''
        };

        // 5. Detect changes before updating
        const changes = getInterviewChanges(existingInterview, updateData);

        // 6. Update the interview and populate related fields
        const updatedInterview = await Interview.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('applicantId', 'firstName lastName positionTitle email')
            .populate('interviewerId', 'name email');


        // Notify if required
        if (updatedInterview.status === "cancelled") {
            if (!existingInterview.applicantId?.email || !existingInterview.interviewerId?.email) {
                return res.status(400).json({ message: "Missing email for applicant or interviewer" });
            }

            const formattedDate = existingInterview.date.toLocaleDateString();
            const formattedTime = existingInterview.time;

            setImmediate(async () => {
                try {
                    // Applicant Email
                    await sendEmail(
                        existingInterview.applicantId.email,
                        "Interview Cancelled",
                        `<p>Dear ${existingInterview.applicantId.firstName},</p>
                 <p>We regret to inform you that your interview scheduled for ${formattedDate} at ${formattedTime} has been cancelled.</p>
                 <p>Reason: ${notes}</p>
                 <p>We apologize for any inconvenience this may cause. Please feel free to contact us if you have any questions or would like to reschedule.</p>
                 <p>Best regards,<br/>Recruitment Team</p>`
                    );

                    // Interviewer Email
                    await sendEmail(
                        existingInterview.interviewerId.email,
                        "Interview Cancelled",
                        `<p>Dear ${existingInterview.interviewerId.name},</p>
                 <p>This is to notify you that the interview with ${existingInterview.applicantId.firstName} ${existingInterview.applicantId.lastName}, scheduled for ${formattedDate} at ${formattedTime}, has been cancelled.</p>
                 <p>Reason: ${notes}</p>
                 <p>Thank you for your understanding and cooperation.</p>
                 <p>Best regards,<br/>Recruitment Team</p>`
                    );
                } catch (emailError) {
                    console.error("Failed to send cancellation emails:", emailError);
                }
            });
        }


        if (updatedInterview.status === "scheduled") {
            if (!existingInterview.applicantId?.email || !existingInterview.interviewerId?.email) {
                return res.status(400).json({ message: "Missing email for applicant or interviewer" });
            }

            const formattedDate = existingInterview.date.toLocaleDateString();
            const formattedTime = existingInterview.time;

            const newFormattedDate = updatedInterview.date.toLocaleDateString();
            const newFormattedTime = updatedInterview.time;

            setImmediate(async () => {
                try {
                    // Applicant Email
                    await sendEmail(
                        existingInterview.applicantId.email,
                        "Interview Rescheduled",
                        `<p>Dear ${existingInterview.applicantId.firstName},</p>
             <p>We would like to inform you that your interview originally scheduled for ${formattedDate} at ${formattedTime} has been rescheduled to ${newFormattedDate} at ${newFormattedTime}.</p>
             <p>Reason: ${notes}</p>
             <p>Please check your updated schedule and confirm your availability at your earliest convenience.</p>
             <p>We apologize for any inconvenience caused and appreciate your understanding.</p>
             <p>Best regards,<br/>Recruitment Team</p>`
                    );

                    // Interviewer Email
                    await sendEmail(
                        existingInterview.interviewerId.email,
                        "Interview Rescheduled",
                        `<p>Dear ${existingInterview.interviewerId.name},</p>
             <p>Please be informed that the interview with ${existingInterview.applicantId.firstName} ${existingInterview.applicantId.lastName} originally scheduled for ${formattedDate} at ${formattedTime} has been rescheduled to ${newFormattedDate} at ${newFormattedTime}.</p>
             <p>Reason: ${notes}</p>
             <p>Kindly review your schedule and adjust accordingly.</p>
             <p>Thank you for your cooperation.</p>
             <p>Best regards,<br/>Recruitment Team</p>`
                    );
                } catch (emailError) {
                    console.error("Failed to send notification emails:", emailError);
                }
            });
        }


        if (updatedInterview.status === "completed") {
            if (!existingInterview.applicantId?.email) {
                return res.status(400).json({ message: "Missing applicant email" });
            }

            const formattedDate = existingInterview.date.toLocaleDateString();
            const formattedTime = existingInterview.time;

            setImmediate(async () => {
                try {
                    await sendEmail(
                        existingInterview.applicantId.email,
                        "Interview Completed",
                        `<p>Dear ${existingInterview.applicantId.firstName},</p>
                 <p>Thank you for attending your interview on ${formattedDate} at ${formattedTime}. We appreciate the time and effort you invested in the process.</p>
                 <p>Our team will review your interview and be in touch with you regarding the next steps.</p>
                 <p>We wish you all the best and thank you for your interest in joining our organization.</p>
                 <p>Best regards,<br/>Recruitment Team</p>`
                    );
                } catch (emailError) {
                    console.error("Failed to send completion email:", emailError);
                }
            });
        }


        // 7. Format response similar to fetchInterview
        const formattedInterview = {
            id: updatedInterview._id,
            candidateName: `${updatedInterview.applicantId.firstName} ${updatedInterview.applicantId.lastName}`,
            position: updatedInterview.applicantId.positionTitle,
            interviewer: updatedInterview.interviewerId.name,
            date: updatedInterview.date.toISOString().split('T')[0],
            time: updatedInterview.time,
            type: updatedInterview.type,
            status: updatedInterview.status,
            meetingLink: updatedInterview.meetingLink || '',
            location: updatedInterview.location || '',
            notes: updatedInterview.notes || ''
        };

        // 8. Respond to client immediately
        res.status(200).json({
            message: "Interview updated successfully",
            data: formattedInterview
        });

        // 9. Create notification in background (only if there were actual changes)
        if (changes.length > 0) {
            setImmediate(async () => {
                try {
                    await createInterviewUpdateNotification(existingInterview, updatedInterview, changes);
                } catch (notificationError) {
                    console.error(`❌ Failed to create notification for interview ${updatedInterview._id}:`, notificationError);
                }
            });
        }

    } catch (error) {
        console.error('Interview update error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                message: 'Validation failed',
                details: validationErrors
            });
        }

        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, notifyCandidate } = req.body;
        const { isValidObjectId } = require('mongoose');
        console.log(reason)

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid interview ID" });
        }

        let interview = await Interview.findById(id)
            .populate('applicantId', 'firstName lastName email positionTitle')
            .populate('interviewerId', 'name email');

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }


        // Update to cancelled
        const updatedInterview = await Interview.findByIdAndUpdate(
            id,
            { status: "cancelled" },
            { new: true, runValidators: true }
        )
            .populate('applicantId', 'firstName lastName email positionTitle')
            .populate('interviewerId', 'name email');

        // Notify if required
        if (notifyCandidate) {
            if (!reason) {
                return res.status(400).json({ message: "Reason is required when notifying candidate" });
            }
            if (!interview.applicantId?.email || !interview.interviewerId?.email) {
                return res.status(400).json({ message: "Missing email for applicant or interviewer" });
            }

            const formattedDate = interview.date.toLocaleDateString();
            const formattedTime = interview.time;

            setImmediate(async () => {
                try {
                    await sendEmail(
                        interview.applicantId.email,
                        "Interview Cancelled",
                        `<p>Dear ${interview.applicantId.firstName},</p>
                         <p>Your interview scheduled for ${formattedDate} at ${formattedTime} has been cancelled.</p>
                         <p>Reason: ${reason}</p>`
                    );

                    await sendEmail(
                        interview.interviewerId.email,
                        "Interview Cancelled",
                        `<p>Dear ${interview.interviewerId.name},</p>
                         <p>The interview with ${interview.applicantId.firstName} ${interview.applicantId.lastName} has been cancelled.</p>
                         <p>Reason: ${reason}</p>`
                    );
                } catch (emailError) {
                    console.error("Failed to send notification emails:", emailError);
                }
            });
        }


        // Format the response
        const formattedInterview = {
            id: updatedInterview._id,
            candidateName: `${updatedInterview.applicantId.firstName} ${updatedInterview.applicantId.lastName}`,
            position: updatedInterview.applicantId.positionTitle,
            interviewer: updatedInterview.interviewerId.name,
            date: updatedInterview.date.toISOString().split('T')[0],
            time: updatedInterview.time,
            type: updatedInterview.type,
            status: updatedInterview.status,
            meetingLink: updatedInterview.meetingLink || '',
            location: updatedInterview.location || '',
            notes: updatedInterview.notes || ''
        };

        res.status(200).json({
            message: "Interview has been cancelled successfully",
            data: formattedInterview
        });



    } catch (error) {
        console.error("Delete interview error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const permanentDeleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { isValidObjectId } = require('mongoose');

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid interview ID" });
        }

        // Check if interview exists before deletion
        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        // Store candidate name for response message
        const candidateName = interview.applicantId ?
            `${interview.applicantId.firstName} ${interview.applicantId.lastName}` :
            'Unknown Candidate';

        // Permanently delete the interview
        await Interview.findByIdAndDelete(id);

        res.status(200).json({
            message: "Interview has been permanently deleted",
            data: {
                deletedInterviewId: id,
                candidateName: candidateName
            }
        });

    } catch (error) {
        console.error("Permanent delete interview error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { scheduleInterview, fetchInterview, updateInterview, deleteInterview, permanentDeleteInterview };
