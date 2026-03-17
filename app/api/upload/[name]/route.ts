import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { removeUploadedFile } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ name: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { name } = await context.params;
    const fileName = decodeURIComponent(name);

    // 中文说明：这里只允许删除文件名本身，避免路径穿越风险。
    if (fileName.includes("/") || fileName.includes("\\")) {
      return NextResponse.json({ code: 400, message: "非法文件名", data: null }, { status: 400 });
    }

    await removeUploadedFile(fileName);
    return NextResponse.json({ code: 0, message: "删除成功", data: { name: fileName } });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "删除素材失败", data: null },
      { status: 500 }
    );
  }
}
