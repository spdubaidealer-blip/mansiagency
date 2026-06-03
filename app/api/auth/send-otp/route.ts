import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    
    // Validate Gmail pattern
    if (!emailTrimmed.endsWith("@gmail.com")) {
      return NextResponse.json({ error: "Only Gmail (@gmail.com) addresses are allowed" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user details
    await prisma.user.upsert({
      where: { email: emailTrimmed },
      update: {
        otp,
        otpExpiry,
        isVerified: false,
      },
      create: {
        email: emailTrimmed,
        otp,
        otpExpiry,
        isVerified: false,
      },
    });

    console.log(`[OTP Generated] Email: ${emailTrimmed}, OTP: ${otp}`);
    
    const previewUrl = await sendOtpEmail(emailTrimmed, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your Gmail.",
      previewUrl: process.env.NODE_ENV !== "production" ? previewUrl : undefined,
    });
  } catch (error) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
