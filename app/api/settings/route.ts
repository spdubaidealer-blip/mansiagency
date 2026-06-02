import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Check admin credentials
function isAdmin(request: NextRequest) {
  return request.cookies.get("admin_session")?.value === "mansi_admin_logged_in";
}

// GET /api/settings - Fetch all settings (Public)
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.paymentSetting.findMany();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST /api/settings - Update or create setting (Admin)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, type, details, qrImageUrl } = await request.json();
    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    let setting;
    if (id) {
      setting = await prisma.paymentSetting.update({
        where: { id: parseInt(id) },
        data: { details, qrImageUrl },
      });
    } else {
      // Find by type to upsert
      const existing = await prisma.paymentSetting.findFirst({
        where: { type },
      });

      if (existing) {
        setting = await prisma.paymentSetting.update({
          where: { id: existing.id },
          data: { details, qrImageUrl },
        });
      } else {
        setting = await prisma.paymentSetting.create({
          data: { type, details, qrImageUrl },
        });
      }
    }

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment setting" }, { status: 500 });
  }
}
