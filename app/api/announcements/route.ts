import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Check admin credentials
function isAdmin(request: NextRequest) {
  return request.cookies.get("admin_session")?.value === "mansi_admin_logged_in";
}

// GET /api/announcements - Fetch current active announcement
export async function GET(request: NextRequest) {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { id: "desc" },
    });
    
    return NextResponse.json(announcement || { message: "", isActive: false });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

// POST /api/announcements - Set new announcement (Admin)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, isActive } = await request.json();
    if (message === undefined) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Set previous announcements to inactive if this new one is set to active
    const activeState = isActive ?? true;
    if (activeState) {
      await prisma.announcement.updateMany({
        data: { isActive: false },
      });
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        message,
        isActive: activeState,
      },
    });

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
