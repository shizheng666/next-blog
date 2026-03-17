import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listUploadedFiles, saveUploadedFile } from "@/lib/storage";

export async function GET() {
  try {
    await requireAdmin();
    const data = await listUploadedFiles();
    return NextResponse.json({ code: 0, message: "ok", data });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "获取素材列表失败", data: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ code: 400, message: "缺少文件", data: null }, { status: 400 });
    }

    const url = await saveUploadedFile(file);
    return NextResponse.json({ code: 0, message: "上传成功", data: { url } });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "上传失败", data: null },
      { status: 500 }
    );
  }
}
