-- AlterTable
ALTER TABLE `users` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `nicknameUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'MUTED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX `users_status_idx` ON `users`(`status`);
