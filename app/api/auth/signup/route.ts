import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { whatsapp, name, password } = await request.json();

    if (!whatsapp || !name || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const whatsappTrimmed = whatsapp.trim().replace(/[^0-9]/g, "");
    if (whatsappTrimmed.length < 10) {
      return NextResponse.json({ error: "Invalid WhatsApp number. Enter at least 10 digits." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { whatsapp: whatsappTrimmed },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already registered. Please log in." }, { status: 400 });
    }

    // Hash password with SHA-256
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        whatsapp: whatsappTrimmed,
        name: name.trim(),
        password: hashedPassword,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      name: user.name,
      whatsapp: user.whatsapp,
    });

    // Set user session cookie
    response.cookies.set("user_session", user.whatsapp, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Signup failed. Try again." }, { status: 500 });
  }
}
