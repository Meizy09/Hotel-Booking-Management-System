import nodemailer from "nodemailer";
import "dotenv/config";

export const sendEmail = async (
  email: string,
  subject: string,
  text: string,
  html: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html
    };

    const mailRes = await transporter.sendMail(mailOptions);
    console.log("Email sent:", mailRes.accepted);
    return "Email sent successfully";
  } catch (err: any) {
    console.error("Mailer error:", err.message);
    return "Failed to send email";
  }
};
