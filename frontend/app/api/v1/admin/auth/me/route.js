import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/utils/auth";

export async function GET(request) {
  const admin = getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated.",
          details: null,
        },
      },
      { status: 401 }
    );
  }

  const adminData = {
    id: admin.id,
    username: admin.username,
    role: admin.role,
  };

  return NextResponse.json({
    success: true,
    admin: adminData,
    data: adminData,
  });
}
