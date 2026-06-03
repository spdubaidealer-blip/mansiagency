import nodemailer from "nodemailer";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    console.log("Using custom SMTP transporter configured from environment variables.");
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for others
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to ethereal.email (development / testing)
  console.log("No SMTP environment variables found. Attempting to create an Ethereal SMTP test account...");
  const testAccount = await nodemailer.createTestAccount();
  console.log(`Ethereal Test Account created!`);
  console.log(`User: ${testAccount.user}`);
  console.log(`Password: ${testAccount.pass}`);

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<string | null> {
  try {
    if (!transporterPromise) {
      transporterPromise = getTransporter();
    }
    const transporter = await transporterPromise;

    const from = process.env.SMTP_FROM || "Mansi Diamond Agency <no-reply@mansidiamondagency.com>";
    const mailOptions = {
      from,
      to,
      subject: "Verification OTP - Mansi Diamond Agency",
      text: `Your verification OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #a855f7; text-align: center;">Mansi Diamond Agency</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Hello,</p>
          <p>Thank you for choosing Mansi Diamond Agency. Please use the following 6-digit One-Time Password (OTP) to complete your verification:</p>
          <div style="background-color: #f3e8ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #a855f7;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share this OTP with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Mansi Diamond Agency &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
    
    // Preview URL is only available when sending through an Ethereal account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
      return previewUrl;
    }
    return null;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}
