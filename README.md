# Customer Blog

一个基于 Next.js 15、React 19、Prisma 和 MySQL 的前后端同仓博客系统，包含公开博客、用户体系、评论审核、文章后台、标签管理、素材上传与基础部署脚本。

## 项目特点

- 前后端同仓：页面、API、数据库模型、客户端请求封装集中在同一仓库维护。
- 博客前台完整：支持首页、文章列表、文章详情、标签页、RSS、站点地图和基础 SEO。
- 内容双通路：优先读取数据库文章；数据库不可用时，公开内容可回退到 `content/posts/*.mdx`。
- 用户体系可用：支持注册、登录、退出、账户资料查看与昵称更新。
- 评论审核闭环：登录用户可发表评论，管理员可在后台批量审核、驳回或删除评论。
- 后台能力齐全：支持文章 CRUD、标签管理、素材上传、用户角色/状态管理。
- 部署门槛较低：附带 PM2、Nginx、ECS 场景下的部署说明和脚本。

## 技术栈

- 框架：Next.js 15（App Router）
- 前端：React 19、Tailwind CSS、Radix Slot、Lucide React
- 数据层：Prisma、MySQL
- 内容能力：MDX、gray-matter、reading-time、next-mdx-remote
- 鉴权：JWT（`jose`）+ HttpOnly Cookie
- 校验与请求：Zod、自定义请求封装
- 运维：PM2、Nginx、Shell 部署脚本

## 功能模块

### 公开站点

- 首页最新文章与标签云
- 博客列表与文章详情页
- 标签列表与标签聚合页
- RSS 输出、`robots.txt`、`sitemap.xml`
- 基础搜索接口

### 用户与评论

- 用户注册、登录、退出
- 账户中心查看资料与修改昵称
- 已登录用户发表评论
- 用户禁言、禁用状态控制

### 管理后台

- 文章管理：创建、编辑、删除、从 `content/posts` 同步 MDX
- 标签管理：新增、删除标签
- 评论审核：通过、驳回、删除
- 素材管理：图片上传、复制地址、删除文件
- 用户管理：角色切换、禁言、禁用、软删除

## 目录结构

```text
app/                 Next.js 页面与 Route Handlers
components/          前端组件（前台、鉴权、后台、通用 UI）
content/posts/       本地 MDX 文章
lib/                 基础库、鉴权、MDX、SEO、存储、校验
prisma/              Prisma schema 与迁移记录
services/            服务层与客户端请求封装
types/               通用类型定义
deploy/              Nginx 配置
docs/                部署与补充文档
scripts/             构建/部署/工具同步脚本
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，至少补齐以下变量：

```bash
DATABASE_URL="mysql://root:password@127.0.0.1:3306/next_blog"
AUTH_SECRET="replace_with_long_random_string"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
UPLOAD_DIR="public/uploads"
```

说明：

- 项目兼容 `DB_*` 变量，并会在运行时自动拼装 `DATABASE_URL`。
- 当前后台登录已经切换为数据库用户登录，管理员需要在 `users` 表中存在且 `role = ADMIN`。
- `.env.example` 中保留了 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 字段，但当前代码已不再直接使用它们。

### 3. 初始化数据库

```bash
npm run prisma:generate
npm run prisma:deploy
```

如果你在本地开发中需要创建新迁移，也可以使用：

```bash
npm run prisma:migrate
```

### 4. 启动开发环境

```bash
npm run dev
```

默认访问地址：

- 前台首页：[http://localhost:3000](http://localhost:3000)
- 后台登录：[http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## 常用脚本

```bash
npm run dev            # 启动开发环境
npm run build          # 生产构建
npm run start          # 启动生产服务
npm run lint           # 执行 ESLint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run sync:codex-skills
```

## 内容与数据说明

- 公开文章读取优先级：数据库 > 本地 MDX 回退。
- `content/posts/*.mdx` 适合放示例文章或离线内容。
- 后台“从 content 同步”会把本地 MDX 元数据同步到数据库。
- 评论默认进入待审核状态，需后台通过后才会在文章页展示。

## 管理员初始化建议

当前仓库没有内置 seed 脚本，建议用以下任一方式准备管理员账号：

1. 先通过前台注册一个普通用户。
2. 在数据库中将该用户的 `role` 更新为 `ADMIN`。
3. 之后使用该账号从 `/admin/login` 登录后台。

## 部署文档

- 详细部署说明见 [DEPLOY.md](./DEPLOY.md)
- ECS 场景说明见 [docs/deploy-ecs.md](./docs/deploy-ecs.md)
- Nginx 示例配置见 [deploy/nginx.conf](./deploy/nginx.conf)

## 后续可补强项

- 增加 seed 脚本，自动创建首个管理员账号
- 为评论、文章、用户后台补充自动化测试
- 将上传存储从本地文件系统切换到 OSS / S3
- 为搜索能力接入全文索引或外部搜索服务
