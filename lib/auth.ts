import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/current-user";

const TOKEN_NAME = "blog_user_token";

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  [key: string]: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET 未配置，无法进行用户鉴权。");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

/**
 * 统一用户 token：
 * - 管理员与普通用户共用一套登录态
 * - 权限依赖 role + status 双重控制
 */
export async function signUserToken(payload: AuthUserPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyUserToken(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name || ""),
      role: String(payload.role),
      status: String(payload.status)
    };
  } catch {
    return null;
  }
}

export const getCurrentUserFromCookie = cache(async (): Promise<AuthUserPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyUserToken(token);
});

export async function requireUser(): Promise<AuthUserPayload> {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    throw new Error("未登录或登录态失效，请重新登录。");
  }
  if (user.status === "DISABLED") {
    throw new Error("当前账号已被禁用，无法继续操作。");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUserPayload> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("权限不足，当前账号无后台操作权限。");
  }
  return user;
}

export const loadUserProfile = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });
});

export const getCurrentUserProfile = cache(async (): Promise<CurrentUser | null> => {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser) {
    return null;
  }

  const profile = await loadUserProfile(currentUser.userId);
  if (!profile) {
    return null;
  }

  return {
    id: String(profile.id),
    email: profile.email,
    name: profile.name,
    role: profile.role,
    status: profile.status,
    createdAt: profile.createdAt.toISOString()
  };
});

export const userTokenName = TOKEN_NAME;
