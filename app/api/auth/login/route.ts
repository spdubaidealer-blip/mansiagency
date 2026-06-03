import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { whatsapp, password } = await request.json();

    if (!whatsapp || !password) {
      return NextResponse.json({ error: "WhatsApp number and password are required" }, { status: 400 });
    }

    const whatsappTrimmed = whatsapp.trim().replace(/[^0-9]/g, "");

    const user = await prisma.user.findUnique({
      where: { whatsapp: whatsappTrimmed },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found. Please sign up." }, { status: 401 });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully!",
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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}
