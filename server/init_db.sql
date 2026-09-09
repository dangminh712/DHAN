-- SQL Script khởi tạo Cơ sở dữ liệu Nội bộ
-- Có thể mở MySQL Workbench và thực thi script này hoặc chạy qua dòng lệnh

CREATE DATABASE IF NOT EXISTS `media_intranet_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `media_intranet_db`;

CREATE TABLE IF NOT EXISTS `MediaFiles` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `OriginalFileName` VARCHAR(255) NOT NULL,
    `StoredFileName` VARCHAR(255) NOT NULL,
    `ContentType` VARCHAR(100) NOT NULL,
    `FileSize` BIGINT NOT NULL,
    `Category` VARCHAR(50) DEFAULT 'other',
    `Checksum` VARCHAR(64) DEFAULT '',
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `IX_MediaFiles_Category` (`Category`),
    INDEX `IX_MediaFiles_CreatedAt` (`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
