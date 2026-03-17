# 部署说明

## 当前部署方式

当前项目使用：

- 本地执行 `npm run build` 生成 `.next`
- 本地通过 `scripts/upload-build.sh` 上传构建产物与运行所需文件
- 服务器通过 `scripts/deploy-runtime.sh` 执行 Prisma、启动 PM2
- 仅在依赖变更时，服务器再手动执行一次依赖安装
- Nginx 反向代理到 `127.0.0.1:3000`

这不是静态部署，服务器仍然需要 Node.js 来运行 Next.js 服务端能力。

## 服务器目录约定

```bash
/var/www/customer-blog/current
/var/www/customer-blog/shared/.env.production
/var/www/customer-blog/shared/uploads
```

说明：

- `current`：当前项目代码与 `.next` 产物
- `.env.production`：服务器环境变量文件
- `shared/uploads`：持久化上传目录，避免部署覆盖

## 首次服务器准备

### 1. 安装基础软件

```bash
yum install -y rsync
npm install -g pm2
```

### 2. 创建目录

```bash
mkdir -p /var/www/customer-blog/current
mkdir -p /var/www/customer-blog/shared/uploads
```

### 3. 写入环境变量

```bash
cat >/var/www/customer-blog/shared/.env.production <<'EOF'
DATABASE_URL="mysql://user:password@host:3306/customer_blog"
AUTH_SECRET="replace_with_long_random_string"
ADMIN_EMAIL="your_admin_email@example.com"
ADMIN_PASSWORD="replace_with_strong_password"
NEXT_PUBLIC_SITE_URL="http://47.100.212.101"
EOF
```

### 4. 建议开启 swap

当前服务器内存较小，`npm ci` 可能 OOM，被系统杀掉。建议至少开启 2G swap：

```bash
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
free -h
```

## Nginx 配置

服务器最终使用的是反向代理配置，核心逻辑：

- `/uploads/` 指向 `/var/www/customer-blog/shared/uploads/`
- 其余请求代理到 `http://127.0.0.1:3000`

建议站点配置内容如下：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 47.100.212.101;

    client_max_body_size 20m;

    location /uploads/ {
        alias /var/www/customer-blog/shared/uploads/;
        expires 30d;
        add_header Cache-Control 'public, max-age=2592000';
        access_log off;
    }

    location /_next/static/ {
        expires 30d;
        add_header Cache-Control 'public, max-age=2592000, immutable';
        proxy_pass http://127.0.0.1:3000;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_pass http://127.0.0.1:3000;
    }
}
```

如果 `/etc/nginx/nginx.conf` 里已经存在其他默认 `server`，需要确保它不会继续把 `47.100.212.101` 指向旧项目。

## 本地每次发布流程

### 1. 本地构建

```bash
npm run build
```

### 2. 设置本地部署环境变量

```bash
export REMOTE_HOST="47.100.212.101"
export REMOTE_USER="root"
export REMOTE_PORT="22"
```

如果服务器目录不是默认值，再补充：

```bash
export REMOTE_APP_DIR="/var/www/customer-blog/current"
export REMOTE_SHARED_DIR="/var/www/customer-blog/shared"
```

### 3. 上传构建产物和运行文件

```bash
bash scripts/upload-build.sh
```

这个脚本会上传：

- `.next`
- `app`
- `components`
- `content`
- `lib`
- `prisma`
- `public`
- `services`
- `types`
- `deploy`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `postcss.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `ecosystem.config.js`
- `middleware.ts`
- `next-env.d.ts`
- `scripts/deploy-runtime.sh`

不会上传：

- `.git`
- `node_modules`
- `.env*`
- `public/uploads`

## 服务器每次发布流程

上传完成后，登录服务器执行：

```bash
REMOTE_APP_DIR="/var/www/customer-blog/current" REMOTE_SHARED_DIR="/var/www/customer-blog/shared" bash /var/www/customer-blog/current/scripts/deploy-runtime.sh
```

默认这个脚本会执行：

```bash
npx prisma generate
npx prisma migrate deploy
pm2 startOrReload ecosystem.config.js
pm2 save
```

如果 `package.json` 或 `package-lock.json` 发生变化，再手动带上依赖安装参数：

```bash
INSTALL_DEPS=1 REMOTE_APP_DIR="/var/www/customer-blog/current" REMOTE_SHARED_DIR="/var/www/customer-blog/shared" bash /var/www/customer-blog/current/scripts/deploy-runtime.sh
```

并自动：

- 软链 `.env.production` 到项目 `.env`
- 软链 `shared/uploads` 到项目 `public/uploads`

## PM2 配置

当前 PM2 配置不走 `npm start`，而是直接运行 Next：

```js
script: "node_modules/next/dist/bin/next",
args: "start -p 3000"
```

原因是服务器环境里 PM2 直接跑 `npm` 时，可能把 shell 脚本版 npm 当作 JS 解释，导致启动失败。

## 验证命令

### 服务器本机验证

```bash
pm2 list
curl -I http://127.0.0.1:3000
```

### 公网验证

```bash
curl -I http://47.100.212.101
```

### 查看日志

```bash
pm2 logs customer-blog --lines 50
```

## 常见问题

### 1. `REMOTE_HOST is required`

说明你还没在本地设置部署环境变量：

```bash
export REMOTE_HOST="47.100.212.101"
export REMOTE_USER="root"
export REMOTE_PORT="22"
```

### 2. SSH 一直要输密码

建议配置 SSH 公钥免密登录：

```bash
ssh-keygen -t ed25519 -C "customer-blog-deploy"
ssh-copy-id root@47.100.212.101
```

### 3. `npm ci` 被 killed

说明服务器 OOM。当前默认部署脚本已经不再每次执行 `npm ci`。

只有依赖发生变化时，才手动执行：

```bash
INSTALL_DEPS=1 REMOTE_APP_DIR="/var/www/customer-blog/current" REMOTE_SHARED_DIR="/var/www/customer-blog/shared" bash /var/www/customer-blog/current/scripts/deploy-runtime.sh
```

如果仍然 OOM，再考虑：

- 增加 swap
- 升级服务器内存

### 4. 本机 `127.0.0.1:3000` 正常，但公网 500

优先检查：

- Nginx 是否仍在使用旧默认站点配置
- `nginx.conf` 是否已经 `include /etc/nginx/conf.d/*.conf;`
- 目标站点配置是否正确反代到 `127.0.0.1:3000`

## 当前推荐日常发布命令

本地：

```bash
npm run build
export REMOTE_HOST="47.100.212.101"
export REMOTE_USER="root"
export REMOTE_PORT="22"
bash scripts/upload-build.sh
```

服务器：

```bash
REMOTE_APP_DIR="/var/www/customer-blog/current" REMOTE_SHARED_DIR="/var/www/customer-blog/shared" bash /var/www/customer-blog/current/scripts/deploy-runtime.sh
```

依赖变化时：

```bash
INSTALL_DEPS=1 REMOTE_APP_DIR="/var/www/customer-blog/current" REMOTE_SHARED_DIR="/var/www/customer-blog/shared" bash /var/www/customer-blog/current/scripts/deploy-runtime.sh
```
