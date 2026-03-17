import { NextRequest, NextResponse } from "next/server";
import { toJsonSafe } from "@/lib/serialize";
import { searchPosts } from "@/services/search.service";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q") || "";
  const data = await searchPosts(keyword);
  return NextResponse.json({ code: 0, message: "ok", data: toJsonSafe(data) });
}
