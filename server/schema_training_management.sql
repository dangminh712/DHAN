-- ====================================================================
-- HỆ THỐNG QUẢN LÝ BÀI GIẢNG & HỌC LIỆU NỘI BỘ
-- DATABASE: training_management
-- ENGINE: MySQL 8.x, InnoDB, utf8mb4, utf8mb4_0900_ai_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `training_management`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE `training_management`;

-- --------------------------------------------------------------------
-- 1. MODULE: Identity & Access - roles
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_roles_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 2. MODULE: Identity & Access - permissions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `module` VARCHAR(100) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 3. MODULE: Identity & Access - role_permissions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_role_permissions_role`
        FOREIGN KEY (`role_id`)
        REFERENCES `roles`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_role_permissions_permission`
        FOREIGN KEY (`permission_id`)
        REFERENCES `permissions`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 4. MODULE: Organization - organizational_units (Cây tổ chức)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizational_units` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `parent_id` BIGINT UNSIGNED NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `unit_type` VARCHAR(50) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_org_parent`
        FOREIGN KEY (`parent_id`)
        REFERENCES `organizational_units`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_org_parent` (`parent_id`),
    INDEX `idx_org_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 5. MODULE: Identity & Access - users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `organizational_unit_id` BIGINT UNSIGNED NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    CONSTRAINT `fk_users_role`
        FOREIGN KEY (`role_id`)
        REFERENCES `roles`(`id`),
    CONSTRAINT `fk_users_org`
        FOREIGN KEY (`organizational_unit_id`)
        REFERENCES `organizational_units`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_users_role` (`role_id`),
    INDEX `idx_users_org` (`organizational_unit_id`),
    INDEX `idx_users_status` (`status`),
    INDEX `idx_users_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 6. MODULE: Academic - classes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `organizational_unit_id` BIGINT UNSIGNED NULL,
    `academic_year` VARCHAR(20) NOT NULL,
    `semester` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_classes_org`
        FOREIGN KEY (`organizational_unit_id`)
        REFERENCES `organizational_units`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_classes_org` (`organizational_unit_id`),
    INDEX `idx_classes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 7. MODULE: Academic - student_classes (Many-to-Many)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_classes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    UNIQUE KEY `uk_student_class` (`student_id`, `class_id`),
    CONSTRAINT `fk_student_classes_student`
        FOREIGN KEY (`student_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_student_classes_class`
        FOREIGN KEY (`class_id`)
        REFERENCES `classes`(`id`),
    INDEX `idx_student_classes_student` (`student_id`),
    INDEX `idx_student_classes_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 8. MODULE: Academic - subjects
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `organizational_unit_id` BIGINT UNSIGNED NULL,
    `credits` DECIMAL(5,2) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_subjects_org`
        FOREIGN KEY (`organizational_unit_id`)
        REFERENCES `organizational_units`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_subjects_org` (`organizational_unit_id`),
    INDEX `idx_subjects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 9. MODULE: Academic - teacher_subjects
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teacher_subjects` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `subject_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_teacher_subject` (`teacher_id`, `subject_id`),
    CONSTRAINT `fk_teacher_subjects_teacher`
        FOREIGN KEY (`teacher_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_teacher_subjects_subject`
        FOREIGN KEY (`subject_id`)
        REFERENCES `subjects`(`id`),
    INDEX `idx_teacher_subject_teacher` (`teacher_id`),
    INDEX `idx_teacher_subject_subject` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 10. MODULE: Security Classification - classification_levels
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classification_levels` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `level_order` INT NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_classification_order` (`level_order`),
    INDEX `idx_classification_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 11. MODULE: Security Classification - user_clearance_levels
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_clearance_levels` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `classification_level_id` BIGINT UNSIGNED NOT NULL,
    `granted_by` BIGINT UNSIGNED NOT NULL,
    `granted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_clearance_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_clearance_level`
        FOREIGN KEY (`classification_level_id`)
        REFERENCES `classification_levels`(`id`),
    CONSTRAINT `fk_clearance_granted_by`
        FOREIGN KEY (`granted_by`)
        REFERENCES `users`(`id`),
    INDEX `idx_clearance_user` (`user_id`),
    INDEX `idx_clearance_level` (`classification_level_id`),
    INDEX `idx_clearance_status` (`status`),
    INDEX `idx_clearance_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 12. MODULE: Lecture - lectures
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lectures` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `subject_id` BIGINT UNSIGNED NOT NULL,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publish_at` DATETIME NULL,
    `close_at` DATETIME NULL,
    `version` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    CONSTRAINT `fk_lectures_subject`
        FOREIGN KEY (`subject_id`)
        REFERENCES `subjects`(`id`),
    CONSTRAINT `fk_lectures_teacher`
        FOREIGN KEY (`teacher_id`)
        REFERENCES `users`(`id`),
    INDEX `idx_lectures_subject` (`subject_id`),
    INDEX `idx_lectures_teacher` (`teacher_id`),
    INDEX `idx_lectures_status` (`status`),
    INDEX `idx_lectures_publish` (`publish_at`),
    INDEX `idx_lectures_close` (`close_at`),
    INDEX `idx_lectures_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 13. MODULE: Lecture - lecture_permissions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lecture_permissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lecture_id` BIGINT UNSIGNED NOT NULL,
    `class_id` BIGINT UNSIGNED NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT FALSE,
    `publish_at` DATETIME NULL,
    `expires_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_lecture_class` (`lecture_id`, `class_id`),
    CONSTRAINT `fk_lecture_permissions_lecture`
        FOREIGN KEY (`lecture_id`)
        REFERENCES `lectures`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_lecture_permissions_class`
        FOREIGN KEY (`class_id`)
        REFERENCES `classes`(`id`)
        ON DELETE CASCADE,
    INDEX `idx_lecture_permission_lecture` (`lecture_id`),
    INDEX `idx_lecture_permission_class` (`class_id`),
    INDEX `idx_lecture_permission_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 14. MODULE: File - files
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `files` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `original_name` VARCHAR(500) NOT NULL,
    `stored_name` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `extension` VARCHAR(20) NULL,
    `file_type` ENUM('PDF', 'IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER') NOT NULL,
    `file_size` BIGINT UNSIGNED NOT NULL,
    `storage_path` VARCHAR(1000) NOT NULL,
    `checksum_sha256` CHAR(64) NOT NULL,
    `classification_level_id` BIGINT UNSIGNED NOT NULL,
    `uploaded_by` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    CONSTRAINT `fk_files_classification`
        FOREIGN KEY (`classification_level_id`)
        REFERENCES `classification_levels`(`id`),
    CONSTRAINT `fk_files_uploaded_by`
        FOREIGN KEY (`uploaded_by`)
        REFERENCES `users`(`id`),
    UNIQUE KEY `uk_files_stored_name` (`stored_name`),
    INDEX `idx_files_uploader` (`uploaded_by`),
    INDEX `idx_files_classification` (`classification_level_id`),
    INDEX `idx_files_status` (`status`),
    INDEX `idx_files_checksum` (`checksum_sha256`),
    INDEX `idx_files_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 15. MODULE: Lecture - lecture_files (Liên kết bài giảng & file)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lecture_files` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lecture_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_downloadable` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_printable` BOOLEAN NOT NULL DEFAULT FALSE,
    `publish_at` DATETIME NULL,
    `close_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_lecture_file` (`lecture_id`, `file_id`),
    CONSTRAINT `fk_lecture_files_lecture`
        FOREIGN KEY (`lecture_id`)
        REFERENCES `lectures`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_lecture_files_file`
        FOREIGN KEY (`file_id`)
        REFERENCES `files`(`id`),
    INDEX `idx_lecture_files_lecture` (`lecture_id`),
    INDEX `idx_lecture_files_file` (`file_id`),
    INDEX `idx_lecture_files_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 16. MODULE: File - file_permissions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_permissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `class_id` BIGINT UNSIGNED NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT FALSE,
    `can_download` BOOLEAN NOT NULL DEFAULT FALSE,
    `can_print` BOOLEAN NOT NULL DEFAULT FALSE,
    `access_reason` VARCHAR(500) NULL,
    `expires_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_file_permissions_file`
        FOREIGN KEY (`file_id`)
        REFERENCES `files`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_file_permissions_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_file_permissions_class`
        FOREIGN KEY (`class_id`)
        REFERENCES `classes`(`id`)
        ON DELETE CASCADE,
    INDEX `idx_file_permission_file` (`file_id`),
    INDEX `idx_file_permission_user` (`user_id`),
    INDEX `idx_file_permission_class` (`class_id`),
    INDEX `idx_file_permission_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 17. MODULE: File - file_versions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_versions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `version` INT NOT NULL,
    `stored_name` VARCHAR(500) NOT NULL,
    `storage_path` VARCHAR(1000) NOT NULL,
    `checksum_sha256` CHAR(64) NOT NULL,
    `uploaded_by` BIGINT UNSIGNED NOT NULL,
    `change_note` VARCHAR(1000) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_file_version` (`file_id`, `version`),
    CONSTRAINT `fk_file_versions_file`
        FOREIGN KEY (`file_id`)
        REFERENCES `files`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_file_versions_uploader`
        FOREIGN KEY (`uploaded_by`)
        REFERENCES `users`(`id`),
    INDEX `idx_file_versions_file` (`file_id`),
    INDEX `idx_file_versions_uploader` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 18. MODULE: Learning - watch_history
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `watch_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `lecture_id` BIGINT UNSIGNED NULL,
    `last_position_seconds` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `duration_seconds` DECIMAL(12,3) NULL,
    `completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `last_watched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_watch_user_file` (`user_id`, `file_id`),
    CONSTRAINT `fk_watch_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_watch_file`
        FOREIGN KEY (`file_id`)
        REFERENCES `files`(`id`),
    CONSTRAINT `fk_watch_lecture`
        FOREIGN KEY (`lecture_id`)
        REFERENCES `lectures`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_watch_user` (`user_id`),
    INDEX `idx_watch_file` (`file_id`),
    INDEX `idx_watch_last` (`last_watched_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 19. MODULE: Learning - learning_progress
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_progress` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `lecture_id` BIGINT UNSIGNED NOT NULL,
    `progress_percent` DECIMAL(5,2) NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `completed_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_learning_progress` (`user_id`, `lecture_id`),
    CONSTRAINT `fk_progress_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_progress_lecture`
        FOREIGN KEY (`lecture_id`)
        REFERENCES `lectures`(`id`)
        ON DELETE CASCADE,
    INDEX `idx_progress_user` (`user_id`),
    INDEX `idx_progress_lecture` (`lecture_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 20. MODULE: Audit & Security - download_logs
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `download_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_id` BIGINT UNSIGNED NOT NULL,
    `lecture_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `file_size` BIGINT UNSIGNED NULL,
    `status` ENUM('SUCCESS', 'DENIED', 'FAILED') NOT NULL,
    `denial_reason` VARCHAR(500) NULL,
    `downloaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_download_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`),
    CONSTRAINT `fk_download_file`
        FOREIGN KEY (`file_id`)
        REFERENCES `files`(`id`),
    CONSTRAINT `fk_download_lecture`
        FOREIGN KEY (`lecture_id`)
        REFERENCES `lectures`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_download_user` (`user_id`),
    INDEX `idx_download_file` (`file_id`),
    INDEX `idx_download_lecture` (`lecture_id`),
    INDEX `idx_download_time` (`downloaded_at`),
    INDEX `idx_download_user_time` (`user_id`, `downloaded_at`),
    INDEX `idx_download_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 21. MODULE: Audit & Security - audit_logs
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `access_reason` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 22. MODULE: Audit & Security - security_alerts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_alerts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `alert_type` VARCHAR(100) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `description` TEXT NULL,
    `source_ip` VARCHAR(45) NULL,
    `status` ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE') NOT NULL DEFAULT 'OPEN',
    `resolved_by` BIGINT UNSIGNED NULL,
    `resolved_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_security_alert_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE SET NULL,
    CONSTRAINT `fk_security_alert_resolver`
        FOREIGN KEY (`resolved_by`)
        REFERENCES `users`(`id`)
        ON DELETE SET NULL,
    INDEX `idx_security_alert_user` (`user_id`),
    INDEX `idx_security_alert_status` (`status`),
    INDEX `idx_security_alert_severity` (`severity`),
    INDEX `idx_security_alert_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 23. MODULE: Identity & Access - user_sessions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `session_token_hash` CHAR(64) NOT NULL UNIQUE,
    `device_id` VARCHAR(255) NOT NULL,
    `device_name` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `last_activity_at` DATETIME NULL,
    `expires_at` DATETIME NULL,
    `revoked_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sessions_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE,
    INDEX `idx_sessions_user` (`user_id`),
    INDEX `idx_sessions_device` (`device_id`),
    INDEX `idx_sessions_expiry` (`expires_at`),
    INDEX `idx_sessions_revoked` (`revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 24. MODULE: Identity & Access - user_mfa
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_mfa` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `method` ENUM('TOTP', 'EMAIL_OTP', 'SMS_OTP') NOT NULL,
    `secret_encrypted` TEXT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `enabled_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mfa_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 25. MODULE: Notification - notifications
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `read_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notifications_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE,
    INDEX `idx_notifications_user` (`user_id`),
    INDEX `idx_notifications_read` (`is_read`),
    INDEX `idx_notifications_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 26. MODULE: System - retention_policies
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `retention_policies` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `entity_type` VARCHAR(100) NOT NULL UNIQUE,
    `retention_days` INT NOT NULL,
    `archive_after_days` INT NULL,
    `delete_after_days` INT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------
-- 27. MODULE: System - system_settings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(150) NOT NULL UNIQUE,
    `setting_value` TEXT NULL,
    `setting_type` ENUM('STRING', 'INTEGER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
    `description` VARCHAR(500) NULL,
    `is_sensitive` BOOLEAN NOT NULL DEFAULT FALSE,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_settings_updated_by`
        FOREIGN KEY (`updated_by`)
        REFERENCES `users`(`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
