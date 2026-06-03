import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("user_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false });
    }

    const whatsapp = sessionCookie.value;

    const user = await prisma.user.findUnique({
      where: { whatsapp },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      name: user.name,
      whatsapp: user.whatsapp,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Internal server error" });
  }
}
