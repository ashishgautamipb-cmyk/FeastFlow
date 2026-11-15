import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

console.log("EMAIL:", process.env.EMAIL);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// to -from the sending mail from my side(ex-testwork845@gmail.com) , Otp - user side getting OTP

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: `"FeastFlow Security" <${process.env.EMAIL}>`,
    to,
    subject: "Reset Your FeastFlow Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ea580c; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">FeastFlow</h1>
          <p style="color: #78716c; font-size: 13px; margin: 4px 0 0 0;">Food Delivery & Restaurant Platform</p>
        </div>
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #431407; margin: 0 0 10px 0;">Use the following One-Time Password (OTP) to reset your password:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ea580c; padding: 8px; font-family: monospace;">${otp}</div>
          <p style="font-size: 12px; color: #9a3412; margin: 10px 0 0 0;">⏱️ Valid for 10 minutes. Do not share this code with anyone.</p>
        </div>
        <p style="font-size: 12px; color: #a8a29e; text-align: center; margin: 0;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendOtpToUser = async (user, otp) => {
  try {
    console.log("Sending to:", user.email);

    await transporter.sendMail({
      from: `"FeastFlow Delivery" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Your FeastFlow Delivery OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ea580c; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">FeastFlow</h1>
            <p style="color: #78716c; font-size: 13px; margin: 4px 0 0 0;">Safe & Verified Delivery Confirmation</p>
          </div>
          <div style="background-color: #fff7ed; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #431407; margin: 0 0 10px 0;">Your delivery partner has arrived! Share this OTP with the rider upon receipt:</p>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ea580c; padding: 8px; font-family: monospace;">${otp}</div>
            <p style="font-size: 12px; color: #9a3412; margin: 10px 0 0 0;">🔒 Only share this code when you receive your food order.</p>
          </div>
          <p style="font-size: 12px; color: #a8a29e; text-align: center; margin: 0;">Thank you for ordering with FeastFlow!</p>
        </div>
      `,
    });

    console.log("Email sent successfully");
  } catch (err) {
    console.log("MAIL ERROR:", err);
    throw err;
  }
};
