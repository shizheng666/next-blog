/**
 * 将 Prisma 返回的数据安全转换为 JSON 可序列化结构。
 * - BigInt -> string
 * - Date -> ISO string
 */
export function toJsonSafe<T>(input: T): T {
  return JSON.parse(
    JSON.stringify(input, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  ) as T;
}
