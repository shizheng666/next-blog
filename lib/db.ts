import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL) {
    return;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // 关键中文说明：
  // 你当前环境主要维护 DB_* 变量，而 Prisma 只识别 DATABASE_URL。
  // 这里做一次兼容拼装，避免每次手动同步两套配置。
  if (host && user && password && database) {
    process.env.DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
}

ensureDatabaseUrl();

/**
 * Prisma 客户端单例。
 * - 在开发环境中通过 global 缓存，避免 Next 热更新导致连接数暴涨。
 * - 在生产环境中保持常规单例行为。
 */
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
