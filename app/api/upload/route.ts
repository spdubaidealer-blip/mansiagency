import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";

// Helper to check admin status (Bypassed)
function isAdmin(request: NextRequest) {
  return true;
}

// POST /api/upload - Upload general images (Admin only)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const url = await uploadFile(file);
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error("File upload route error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
