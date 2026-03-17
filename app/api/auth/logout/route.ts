import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { userTokenName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(userTokenName);
  return NextResponse.json({ code: 0, message: "已退出登录", data: null });
}
