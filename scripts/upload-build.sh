#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:?REMOTE_HOST is required}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/var/www/next-blog/current}"
SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

if [[ ! -d "$PROJECT_ROOT/.next" ]]; then
  echo "缺少 .next，请先在本地执行 npm run build。"
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "缺少 rsync，请先在本地安装后再上传。"
  exit 1
fi

ssh -p "$REMOTE_PORT" "$SSH_TARGET" "mkdir -p '$REMOTE_APP_DIR'"

rsync -az --delete -e "ssh -p ${REMOTE_PORT}" \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude ".env*" \
  --exclude "public/uploads" \
  "$PROJECT_ROOT/.next/" "${SSH_TARGET}:${REMOTE_APP_DIR}/.next/"

rsync -az -e "ssh -p ${REMOTE_PORT}" \
  "$PROJECT_ROOT/app" \
  "$PROJECT_ROOT/components" \
  "$PROJECT_ROOT/content" \
  "$PROJECT_ROOT/lib" \
  "$PROJECT_ROOT/prisma" \
  "$PROJECT_ROOT/public" \
  "$PROJECT_ROOT/services" \
  "$PROJECT_ROOT/types" \
  "$PROJECT_ROOT/deploy" \
  "$PROJECT_ROOT/package.json" \
  "$PROJECT_ROOT/package-lock.json" \
  "$PROJECT_ROOT/next.config.ts" \
  "$PROJECT_ROOT/postcss.config.js" \
  "$PROJECT_ROOT/tailwind.config.ts" \
  "$PROJECT_ROOT/tsconfig.json" \
  "$PROJECT_ROOT/ecosystem.config.js" \
  "$PROJECT_ROOT/middleware.ts" \
  "$PROJECT_ROOT/next-env.d.ts" \
  "${SSH_TARGET}:${REMOTE_APP_DIR}/"

rsync -az -e "ssh -p ${REMOTE_PORT}" \
  "$PROJECT_ROOT/scripts/deploy-runtime.sh" \
  "${SSH_TARGET}:${REMOTE_APP_DIR}/scripts/"
