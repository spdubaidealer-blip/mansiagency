import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to check if user is logged in as admin (Bypassed)
function isAdmin(request: NextRequest) {
  return true;
}

// GET /api/rates - Fetch all packages
export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.ratePackage.findMany({
      orderBy: { coins: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}

// POST /api/rates - Create a new package (Admin)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currency, coins, price } = await request.json();
    if (!currency || coins === undefined || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPackage = await prisma.ratePackage.create({
      data: {
        currency,
        coins: parseInt(coins),
        price: parseFloat(price),
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create rate package" }, { status: 500 });
  }
}

// PUT /api/rates - Update a package (Admin)
export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, currency, coins, price } = await request.json();
    if (!id || !currency || coins === undefined || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedPackage = await prisma.ratePackage.update({
      where: { id: parseInt(id) },
      data: {
        currency,
        coins: parseInt(coins),
        price: parseFloat(price),
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rate package" }, { status: 500 });
  }
}

// DELETE /api/rates - Delete a package (Admin)
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing package ID" }, { status: 400 });
    }

    await prisma.ratePackage.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Package deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rate package" }, { status: 500 });
  }
}
