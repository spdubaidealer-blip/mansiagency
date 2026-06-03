import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/upload";

// Auth helper
function isAdmin(request: NextRequest) {
  return request.cookies.get("admin_session")?.value === "mansi_admin_logged_in";
}

// GET /api/orders - Fetch all orders (Admin only)
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST /api/orders - Create a new order (Public, requires WhatsApp credentials login)
export async function POST(request: NextRequest) {
  try {
    const userSession = request.cookies.get("user_session")?.value;
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const verifiedUser = await prisma.user.findUnique({
      where: { whatsapp: userSession },
    });
    if (!verifiedUser) {
      return NextResponse.json({ error: "Unauthorized. Session is invalid." }, { status: 401 });
    }

    const formData = await request.formData();
    const whatsapp = formData.get("whatsapp") as string;
    const chametId = formData.get("chametId") as string;
    const currency = formData.get("currency") as string;
    const selectedPackageId = formData.get("selectedPackageId") as string;
    const file = formData.get("screenshot") as File | null;

    if (!whatsapp || !chametId || !currency || !selectedPackageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Process and save the screenshot only if provided and not empty
    let screenshotUrl = null;
    if (file && file.size > 0 && file.name) {
      try {
        screenshotUrl = await uploadFile(file);
      } catch (err) {
        console.error("Screenshot upload failed, continuing order creation:", err);
      }
    }

    // Create the order record in SQLite
    const order = await prisma.order.create({
      data: {
        whatsapp,
        chametId,
        currency,
        selectedPackageId: parseInt(selectedPackageId),
        screenshotUrl,
        userWhatsapp: userSession,
        status: "Pending",
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to submit order. Please try again." }, { status: 500 });
  }
}

// PATCH /api/orders - Toggle order status (Admin only)
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
