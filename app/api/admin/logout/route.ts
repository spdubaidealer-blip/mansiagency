import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Clear the cookie by setting it with an expired date
  response.cookies.set("admin_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  
  return response;
}
