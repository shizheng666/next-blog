import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "注册参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ code: 409, message: "该邮箱已注册", data: null }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.nickname,
        passwordHash,
        role: "READER",
        status: "ACTIVE",
        nicknameUpdatedAt: new Date()
      }
    });

    return NextResponse.json({
      code: 0,
      message: "注册成功",
      data: {
        id: String(user.id),
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "注册失败", data: null },
      { status: 500 }
    );
  }
}
