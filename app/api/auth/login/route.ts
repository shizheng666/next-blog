import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signUserToken, userTokenName, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "登录参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ code: 40401, message: "账户不存在，请先注册。", data: null }, { status: 401 });
    }

    if (user.status === "DISABLED") {
      return NextResponse.json({ code: 40301, message: "当前账号已被禁用，请联系管理员。", data: null }, { status: 403 });
    }

    const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ code: 40101, message: "密码错误，请检查后重试。", data: null }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    const token = await signUserToken({
      userId: String(user.id),
      email: user.email,
      name: user.name || "未命名用户",
      role: user.role,
      status: user.status
    });

    const forwardedProto = request.headers.get("x-forwarded-proto");
    const isSecureRequest = request.nextUrl.protocol === "https:" || forwardedProto === "https";

    const cookieStore = await cookies();
    cookieStore.set(userTokenName, token, {
      httpOnly: true,
      secure: isSecureRequest,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({
      code: 0,
      message: "登录成功",
      data: {
        role: user.role,
        name: user.name,
        redirectTo: "/"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "登录失败", data: null },
      { status: 500 }
    );
  }
}
