import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found. Please request a new OTP." }, { status: 404 });
    }

    // Check OTP and Expiry
    if (user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "OTP code has expired. Please request a new one." }, { status: 400 });
    }

    // Set user as verified and clear OTP fields
    await prisma.user.update({
      where: { email: emailTrimmed },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      email: emailTrimmed,
    });

    // Set user session cookie
    response.cookies.set("user_session", emailTrimmed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
