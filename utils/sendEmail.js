const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use any email service or SMTP
      auth: {
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASS, // your email password or app-specific password
      },
    });

    const mailOptions = {
      from: `"HR Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html, // You can also use text: "..." instead of html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email not sent");
  }
};

module.exports = sendEmail;
