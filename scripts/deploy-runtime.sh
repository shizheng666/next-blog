#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${REMOTE_APP_DIR:-/var/www/next-blog/current}"
SHARED_DIR="${REMOTE_SHARED_DIR:-/var/www/next-blog/shared}"
ENV_FILE="${SHARED_DIR}/.env.production"
SHARED_UPLOADS_DIR="${SHARED_DIR}/uploads"
APP_PUBLIC_DIR="${APP_DIR}/public"
APP_UPLOADS_DIR="${APP_PUBLIC_DIR}/uploads"
INSTALL_DEPS="${INSTALL_DEPS:-0}"

if ! command -v npm >/dev/null 2>&1; then
  echo "服务器缺少 npm，请先安装 Node.js。"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "服务器缺少 pm2，请先执行 npm install -g pm2"
  exit 1
fi

mkdir -p "$SHARED_UPLOADS_DIR"
mkdir -p "$APP_PUBLIC_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "缺少环境变量文件: $ENV_FILE"
  exit 1
fi

ln -sfn "$ENV_FILE" "$APP_DIR/.env"
rm -rf "$APP_UPLOADS_DIR"
ln -sfn "$SHARED_UPLOADS_DIR" "$APP_UPLOADS_DIR"

cd "$APP_DIR"

if [[ "$INSTALL_DEPS" == "1" ]]; then
  npm ci
fi

npx prisma generate
npx prisma migrate deploy
pm2 startOrReload ecosystem.config.js
pm2 save
