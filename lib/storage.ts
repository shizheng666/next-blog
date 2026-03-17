import fs from "node:fs/promises";
import path from "node:path";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";

export interface UploadedFileItem {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
}

function getAbsoluteUploadRoot(): string {
  return path.join(process.cwd(), uploadRoot);
}

/**
 * 本地存储适配器（ECS 起步方案）。
 * 后续如果切换 OSS，仅需要替换该文件实现，不影响 API 层。
 */
export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const absoluteRoot = getAbsoluteUploadRoot();
  const absolutePath = path.join(absoluteRoot, fileName);

  await fs.mkdir(absoluteRoot, { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return `/${uploadRoot.replace(/^public\//, "")}/${fileName}`;
}

/**
 * 返回本地上传目录中的文件列表。
 * - 用于后台素材管理页。
 * - 这里只返回最常用的展示字段，避免前端自己做路径转换。
 */
export async function listUploadedFiles(): Promise<UploadedFileItem[]> {
  const absoluteRoot = getAbsoluteUploadRoot();
  await fs.mkdir(absoluteRoot, { recursive: true });
  const entries = await fs.readdir(absoluteRoot);

  const files = await Promise.all(
    entries.map(async (name) => {
      const absolutePath = path.join(absoluteRoot, name);
      const stat = await fs.stat(absolutePath);
      return {
        name,
        url: `/${uploadRoot.replace(/^public\//, "")}/${name}`,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      };
    })
  );

  return files.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function removeUploadedFile(fileName: string): Promise<void> {
  const absolutePath = path.join(getAbsoluteUploadRoot(), fileName);
  await fs.rm(absolutePath, { force: true });
}
