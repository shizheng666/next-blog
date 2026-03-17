# 阿里云 ECS 部署说明（Node.js 20 + Nginx + MySQL）

## 1. 服务器准备

1. 安装 Node.js 20 与 npm。
2. 安装 MySQL 8（若使用阿里云 RDS，可跳过本地 MySQL 安装）。
3. 安装 Nginx 与 PM2：

```bash
npm install -g pm2
```

## 2. 项目初始化

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run build
```

## 3. 环境变量

建议保留你已有的 `DB_*` 变量，同时补充：

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`

`DATABASE_URL` 示例：

```bash
DATABASE_URL="mysql://user:password@host:3306/next_blog"
```

## 4. 启动服务

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 5. Nginx 反向代理

将 `deploy/nginx.conf` 放入 `/etc/nginx/conf.d/next-blog.conf`，然后重启：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. 生产建议

1. 开启 HTTPS（Let's Encrypt 或阿里云证书）。
2. 轮换 `.env` 中明文密码并改用 SSH Key。
3. 对 `public/uploads` 和 MySQL 做定时备份。
