import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const TOKEN_NAME = "blog_user_token";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET 未配置，无法进行后台鉴权。");
  }
  return new TextEncoder().encode(secret);
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = String(payload.role || "");
    const status = String(payload.status || "");
    return role === "ADMIN" && status !== "DISABLED";
  } catch {
    return false;
  }
}

/**
 * 后台路由保护：
 * - 未登录用户访问 /admin/* 时自动重定向到登录页。
 * - 已登录用户访问 /admin/login 时自动跳转到文章管理页。
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authorized = await isAuthorized(request);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !authorized) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && authorized) {
    return NextResponse.redirect(new URL("/admin/posts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
