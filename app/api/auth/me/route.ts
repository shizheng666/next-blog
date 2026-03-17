import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return NextResponse.json({ code: 0, message: "ok", data: null });
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: profile
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "获取当前用户失败", data: null },
      { status: 500 }
    );
  }
}
