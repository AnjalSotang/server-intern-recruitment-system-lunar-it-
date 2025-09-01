const Message = require('../model/messagesModal');
const sendEmail = require("../utils/sendEmail");

const postMessage = async (req, res) => {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    if (!firstName || !lastName || !email || !phone || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    } 
    // Determine priority based on subject and message length
    let priority = "medium";

if ((["internship", "partnership", "services"].includes(subject) && message.length < 100)) {
    priority = "high";
} else if (subject === "careers" && message.length < 100) {
    priority = "low";
} else if (subject === "general") {
    priority = "high";
}

    try {
        const newMessage = new Message({
            firstName,
            lastName,
            email,
            phone,
            subject,
            message,
            status: "new",
            priority: priority
        });
        await newMessage.save();
        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
}; 

const viewMessage = async (req, res) => {
    // Implementation for viewing messages
    try{
        const messages = await Message.find();
        return res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: messages
        });
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve messages',
            error: error.message
        });
    }
};

const updateMessageStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status);
    if (!["new", "read", "archived", "replied"].includes(status)) {
        console.log('heh')
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }   
    try {
        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        message.status = status;
        await message.save();
        return res.status(200).json({
            success: true,
            message: 'Message status updated successfully',
            data: message
        });
    }

    catch (error) {
         console.log(error.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to update message status',
            // error: error.message
        });
       
       
    }
};



const deleteMessage = async (req, res) => {
    // Implementation for deleting a message
    const { id } = req.params;
    try {
        const message = await Message.findByIdAndDelete(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
       
        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
}


const subjectLabels = {
  internship: "Internship Inquiry",
  partnership: "Partnership Opportunity",
  services: "Service Information",
  careers: "Career Opportunities",
  general: "General Inquiry",
};

const sendReplyMessage = async (req, res) => {
  try {
    const { id } = req.params; // message id
    const { replyText } = req.body;

    // 1. Fetch message from DB
    const messageDoc = await Message.findById(id);
    if (!messageDoc) {
      return res.status(404).json({ message: "Message not found" });
    }

    // 2. Build subject line based on subject map
    const subjectLine =
      subjectLabels[messageDoc.subject] || subjectLabels.general;

   let mainMessage = "";

if (subjectLine.toLowerCase().includes("job application")) {
  mainMessage = "We have received your job application and our recruitment team is currently reviewing your credentials. You will be contacted should your profile meet the required criteria.";
} else if (subjectLine.toLowerCase().includes("scholarship application")) {
  mainMessage = "We have received your scholarship application. Our review committee will carefully assess your submission, and you will be informed of the outcome in due course.";
} else if (subjectLine.toLowerCase().includes("application")) {
  mainMessage = "We have received your application and it is under review. You will be notified once the evaluation process is complete.";
} else if (subjectLine.toLowerCase().includes("inquiry")) {
  mainMessage = "Thank you for your inquiry. We value your interest and will provide you with the requested information shortly.";
} else if (subjectLine.toLowerCase().includes("support")) {
  mainMessage = "We acknowledge your support request. Our team is looking into your concern and will provide you with the necessary assistance as soon as possible.";
} else {
  mainMessage = "Thank you for reaching out to us. We have received your message and will respond at the earliest convenience.";
}

const emailBody = `
  <div style="font-family: Arial, sans-serif; color:#333; padding:20px;">
    <p>Dear ${messageDoc.firstName} ${messageDoc.lastName},</p>
    <p>${mainMessage}</p>
    <p>${replyText}</p>
    <p style="margin-top:20px;">Best regards,<br>The Team</p>
  </div>
`;


    // 4. Send email
    await sendEmail(messageDoc.email, subjectLine, emailBody);

    // 5. Save reply in DB
    // messageDoc.replyText = replyText;
    messageDoc.status = "replied"; // optional update
    await messageDoc.save();

    // 6. Respond success
    res.status(200).json({
      message: "Reply sent successfully",
      data: messageDoc
    });

  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
    postMessage,
    viewMessage,
    updateMessageStatus,
    deleteMessage,
    sendReplyMessage
};