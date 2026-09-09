# DBMS Foundation Design

**Date:** 2026-09-09
**Status:** Approved
**Target:** MySQL 8.x, InnoDB, on-premise modular monolith

## 1. Objective

Deliver the complete relational data foundation for the internal learning and training platform before expanding the API and frontend. The database must enforce structural integrity, support authorization decisions, preserve security history, and remain operable in production without embedding application business workflows in database triggers.

This design replaces the prototype's `EnsureCreated`/JSON fallback approach with versioned EF Core migrations and MySQL as the authoritative store. Existing media files and metadata remain preserved during migration.

## 2. Scope

The DBMS delivery includes:

- Complete schema for identity, authorization, organization, learning, files, security, progress, and operations.
- EF Core entity mappings and migrations.
- Production reference seed data and opt-in development sample data.
- Foreign keys, unique constraints, check constraints, indexes, soft-delete rules, and concurrency tokens.
- MySQL least-privilege accounts and grants.
- Data migration path for existing `MediaFile` metadata.
- ERD and data dictionary.
- Integration tests against a real MySQL 8 instance.
- Backup, restore, migration, rollback, and operational documentation.

API authentication, UI screens, Redis, MinIO, MFA delivery mechanisms, background jobs, and authorization services are outside this DBMS implementation. The schema supports those later modules.

## 3. Architecture Decisions

### 3.1 Source of truth

EF Core migrations are the only authoritative production schema mechanism. `Database.EnsureCreated()` is removed from production startup. SQL scripts may provision MySQL users and databases, but must not duplicate application table DDL.

### 3.2 Database conventions

- Engine: InnoDB.
- Character set: `utf8mb4`.
- Collation: `utf8mb4_0900_ai_ci` where available, otherwise `utf8mb4_unicode_ci`.
- Time: UTC stored as `DATETIME(6)`.
- Primary keys: signed `BIGINT` auto-increment to maintain EF/MySQL compatibility.
- Money is not currently in scope.
- Boolean values: `TINYINT(1)`.
- External secrets and raw tokens are never stored.
- Closed status fields use constrained `VARCHAR` values; configurable business taxonomies use lookup tables.
- JSON is limited to audit snapshots and structured configuration values.
- Names use `snake_case`; permission and policy codes use uppercase `SNAKE_CASE`.

### 3.3 Security boundary

Sequential identifiers are not treated as protection. Every later resource lookup must apply authorization and scope checks. The schema provides the relationships and indexes required for those checks.

### 3.4 Business logic placement

Publish, close, permission, clearance, audit, and retention workflows execute in application service transactions. Database triggers and stored procedures do not contain business workflows. Integrity is enforced through constraints, foreign keys, transactions, and grants.

### 3.5 Deletion

- Business entities use `deleted_at` where historical restoration or auditability matters.
- Join rows may be physically deleted only when their parent business operation and audit event are committed together.
- `audit_logs`, `download_logs`, and security history never cascade-delete with users or resources.
- Physical file deletion is deferred to retention processing.

## 4. Shared Columns and Patterns

Mutable aggregate tables use:

- `id BIGINT` primary key.
- `created_at DATETIME(6)` required.
- `updated_at DATETIME(6)` required.
- `row_version BIGINT` required, incremented on each application update for optimistic concurrency.

Soft-deletable tables additionally use `deleted_at DATETIME(6) NULL`.

Actor foreign keys are `RESTRICT` where the referenced actor must remain, or nullable with `ON DELETE SET NULL` where the historical record must survive anonymization/deletion. Audit snapshots retain the original display data required by policy.

## 5. Schema

### 5.1 Identity, RBAC, and organization

#### `roles`

- `id`, `code`, `name`, `description`, `is_system`, `status`, timestamps, `row_version`.
- Unique: `code`.
- Seed: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`.

#### `permissions`

- `id`, `code`, `name`, `module`, `description`, `status`, timestamps.
- Unique: `code`.
- Indexed: `(module, status)`.

#### `role_permissions`

- `role_id`, `permission_id`, `granted_at`, `granted_by` nullable.
- Composite primary key: `(role_id, permission_id)`.
- Foreign keys use `RESTRICT` for system roles/permissions.

#### `organizational_units`

- `id`, `parent_id` nullable, `code`, `name`, `unit_type`, `status`, timestamps, `row_version`.
- Unique: `code`.
- Indexes: `parent_id`, `(unit_type, status)`.
- Self-reference uses `RESTRICT` to prevent accidental subtree deletion.
- Cycle prevention is performed transactionally by the application; the DB enforces `parent_id <> id`.

#### `users`

- `id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role_id`, `organizational_unit_id`, `status`, `must_change_password`, `last_login_at`, timestamps, `deleted_at`, `row_version`.
- Unique active identity keys: normalized username and email are stored as `normalized_username` and `normalized_email`; both are unique.
- Indexes: `role_id`, `organizational_unit_id`, `status`, `deleted_at`.
- Password hashes use a versioned application format compatible with Argon2id or BCrypt.

#### `user_sessions`

- `id`, `user_id`, `refresh_token_hash`, `token_family_id`, `device_id`, `device_name`, `ip_address`, `user_agent`, `last_activity_at`, `expires_at`, `revoked_at`, `revoke_reason`, `replaced_by_session_id`, `created_at`.
- Unique: `refresh_token_hash` and `(user_id, device_id, token_family_id)` where supported by the application model.
- Indexes: `(user_id, revoked_at, expires_at)`, `device_id`, `token_family_id`.
- Only a SHA-256/HMAC digest of a refresh token is stored.

#### `user_mfa`

- `id`, `user_id`, `method`, `secret_ciphertext`, `secret_key_version`, `is_enabled`, `enabled_at`, `last_verified_at`, timestamps.
- Unique: `(user_id, method)`.
- The encryption key remains outside the database.

### 5.2 Classes and subjects

#### `classes`

- `id`, `code`, `name`, `organizational_unit_id`, `academic_year`, `semester`, `status`, timestamps, `row_version`.
- Unique: `code`.
- Indexes: `organizational_unit_id`, `(academic_year, semester, status)`.

#### `student_classes`

- `id`, `student_id`, `class_id`, `joined_at`, `left_at`, `status`, timestamps.
- Unique: `(student_id, class_id)`.
- Indexes: `(class_id, status)`, `(student_id, status)`.

#### `subjects`

- `id`, `code`, `name`, `description`, `organizational_unit_id`, `credits`, `status`, timestamps, `row_version`.
- Unique: `code`.
- Indexes: `organizational_unit_id`, `status`.

#### `teacher_subjects`

- `id`, `teacher_id`, `subject_id`, `created_at`.
- Unique: `(teacher_id, subject_id)`.
- Reverse index: `(subject_id, teacher_id)`.

### 5.3 Lectures and access

#### `lectures`

- `id`, `subject_id`, `teacher_id`, `organizational_unit_id`, `title`, `description`, `status`, `publish_at`, `close_at`, `version`, timestamps, `deleted_at`, `row_version`.
- Status constraint: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `CLOSED`, `ARCHIVED`.
- Check: `close_at IS NULL OR publish_at IS NULL OR close_at > publish_at`.
- Indexes: `teacher_id`, `subject_id`, `organizational_unit_id`, `(status, publish_at, close_at)`, `deleted_at`.

#### `lecture_permissions`

- `id`, `lecture_id`, `class_id`, `can_view`, `publish_at`, `expires_at`, timestamps, `row_version`.
- Unique: `(lecture_id, class_id)`.
- Check: `expires_at IS NULL OR publish_at IS NULL OR expires_at > publish_at`.
- Index: `(class_id, can_view, publish_at, expires_at)`.

### 5.4 Files and storage metadata

#### `classification_levels`

- `id`, `code`, `name`, `level_order`, `description`, `status`, timestamps, `row_version`.
- Unique: `code`, `level_order`.
- Seed: `NORMAL`, `INTERNAL`, `CONFIDENTIAL`, `SECRET` as technical defaults that administrators may rename/configure according to policy.

#### `files`

- `id`, `original_name`, `stored_name`, `mime_type`, `extension`, `file_type`, `file_size`, `storage_provider`, `storage_key`, `checksum_sha256`, `classification_level_id`, `uploaded_by`, `status`, timestamps, `deleted_at`, `row_version`.
- `storage_key` is private metadata and is never returned by public API DTOs.
- Status constraint: `PROCESSING`, `ACTIVE`, `LOCKED`, `QUARANTINED`, `DELETED`, `FAILED`.
- File type constraint: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `OTHER`.
- Checks: `file_size >= 0`, SHA-256 length is 64 lowercase hexadecimal characters when present.
- Unique: `(storage_provider, storage_key)`.
- Indexes: `uploaded_by`, `classification_level_id`, `status`, `checksum_sha256`, `deleted_at`, `(file_type, status)`.

#### `file_versions`

- `id`, `file_id`, `version`, `stored_name`, `storage_provider`, `storage_key`, `mime_type`, `file_size`, `checksum_sha256`, `uploaded_by`, `change_note`, `created_at`.
- Unique: `(file_id, version)` and `(storage_provider, storage_key)`.
- Check: `version > 0`, `file_size >= 0`.

#### `lecture_files`

- `id`, `lecture_id`, `file_id`, `display_order`, `is_visible`, `is_downloadable`, `publish_at`, `close_at`, timestamps, `row_version`.
- Unique: `(lecture_id, file_id)` and `(lecture_id, display_order)`.
- Check: `is_downloadable = 0 OR is_visible = 1`.
- Check: `close_at IS NULL OR publish_at IS NULL OR close_at > publish_at`.
- Index: `(lecture_id, is_visible, publish_at, close_at)`.

#### `file_permissions`

- `id`, `file_id`, `user_id` nullable, `class_id` nullable, `can_view`, `can_download`, `can_print` nullable, `access_reason`, `expires_at`, timestamps, `row_version`.
- Exactly one principal is required: user XOR class.
- Check: `can_download = 0 OR can_view = 1`; `can_print = 0 OR can_view = 1` when not null.
- Unique principal grants are enforced with generated principal columns or two unique indexes managed by migration: `(file_id, user_id)` and `(file_id, class_id)`.
- Indexes support user and class authorization lookups with expiry.

#### `user_clearance_levels`

- `id`, `user_id`, `classification_level_id`, `granted_by`, `granted_at`, `expires_at`, `revoked_at`, `revoked_by`, `status`, `grant_reason`, timestamps, `row_version`.
- Index: `(user_id, status, expires_at)`.
- Duplicate active grants are prevented by application transaction plus a generated active-grant uniqueness key where MySQL supports it.

### 5.5 Learning and engagement

#### `watch_history`

- `id`, `user_id`, `file_id`, `lecture_id`, `last_position_seconds`, `duration_seconds`, `completed`, `last_watched_at`, timestamps, `row_version`.
- Unique: `(user_id, file_id, lecture_id)`.
- Checks: positions/duration are non-negative; position does not exceed duration when duration is known.
- Index: `(user_id, last_watched_at)`.

#### `learning_progress`

- `id`, `user_id`, `lecture_id`, `progress_percent`, `completed`, `completed_at`, timestamps, `row_version`.
- Unique: `(user_id, lecture_id)`.
- Check: `progress_percent BETWEEN 0 AND 100`.
- Index: `(lecture_id, completed)`.

#### `notifications`

- `id`, `user_id`, `title`, `message`, `type`, `is_read`, `read_at`, `created_at`.
- Indexes: `(user_id, is_read, created_at)`, `type`.

### 5.6 Audit and security operations

#### `audit_logs`

- `id`, `user_id` nullable, `action`, `entity_type`, `entity_id` nullable, `old_value` JSON nullable, `new_value` JSON nullable, `access_reason`, `ip_address`, `user_agent`, `request_id`, `trace_id`, `created_at`.
- No `updated_at`, no application update/delete permission.
- Indexes: `user_id`, `(entity_type, entity_id)`, `action`, `created_at`, `trace_id`.
- Sensitive fields such as passwords, tokens, MFA secrets, and encryption keys must be redacted before insertion.

#### `download_logs`

- `id`, `user_id` nullable, `file_id` nullable, `lecture_id` nullable, `ip_address`, `user_agent`, `file_size`, `status`, `denial_reason`, `request_id`, `downloaded_at`.
- Status constraint: `SUCCESS`, `DENIED`, `FAILED`.
- Indexes: `(user_id, downloaded_at)`, `(file_id, downloaded_at)`, `(status, downloaded_at)`, `request_id`.
- Historical foreign keys use `SET NULL` or no cascade.

#### `security_alerts`

- `id`, `user_id` nullable, `alert_type`, `severity`, `description`, `source_ip`, `status`, `resolved_by` nullable, `resolved_at`, `resolution_note`, `created_at`, `updated_at`, `row_version`.
- Severity constraint: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Status constraint: `OPEN`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`.
- Check: resolved statuses require `resolved_at` and `resolved_by`.
- Indexes: `(status, severity, created_at)`, `user_id`, `source_ip`.

### 5.7 Configuration and retention

#### `retention_policies`

- `id`, `entity_type`, `retention_days`, `archive_after_days`, `delete_after_days`, `is_enabled`, timestamps, `row_version`.
- Unique: `entity_type`.
- Checks: configured day values are positive and ordered consistently.

#### `system_settings`

- `id`, `setting_key`, `value_json`, `value_type`, `is_sensitive`, `description`, `updated_by`, timestamps, `row_version`.
- Unique: `setting_key`.
- Sensitive secret material is not stored here; only secret references or encrypted values with an external key are allowed.
- Seed includes non-secret defaults for device limits, rate-limit policies, session lifetimes, and feature flags.

## 6. Permission Seed

The production seed creates stable permission codes grouped by module:

- User: `USER_VIEW`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_STATUS_UPDATE`.
- Role: `ROLE_VIEW`, `ROLE_CREATE`, `ROLE_UPDATE`, `PERMISSION_VIEW`, `PERMISSION_ASSIGN`.
- Organization: `ORGANIZATION_VIEW`, `ORGANIZATION_CREATE`, `ORGANIZATION_UPDATE`, `ORGANIZATION_DISABLE`, `ORGANIZATION_MOVE`.
- Class/subject: view/create/update/disable and membership assignment permissions.
- Lecture: `LECTURE_VIEW`, `LECTURE_CREATE`, `LECTURE_UPDATE`, `LECTURE_DELETE`, `LECTURE_PUBLISH`, `LECTURE_CLOSE`, `LECTURE_ARCHIVE`.
- File: `FILE_VIEW`, `FILE_UPLOAD`, `FILE_UPDATE`, `FILE_DELETE`, `FILE_DOWNLOAD`, `FILE_PRINT`, `FILE_PERMISSION_MANAGE`, `FILE_VERSION_CREATE`.
- Security: audit, alerts, classification, clearance, MFA, session/device, retention, and system configuration permissions.
- Learning: progress, watch history, statistics, and notification permissions.

Role mappings follow least privilege. `SUPER_ADMIN` receives system permissions; `ADMIN` receives operational permissions but not unrestricted system/security ownership; `TEACHER` manages owned or delegated educational resources; `STUDENT` receives view/progress/profile permissions. Scope enforcement remains mandatory even when a permission code is present.

## 7. Development Seed Data

Development seeding is explicit and idempotent. It creates:

- A root organization with representative departments and teams.
- Sample classes, student memberships, subjects, and teacher assignments.
- Sample lectures covering each lifecycle state.
- Sample file metadata for PDF, image, video, and document types.
- Lecture/file permissions demonstrating visible, locked, downloadable, and non-downloadable combinations.
- Users for each role and clearance examples.
- Progress, watch history, notification, audit, download, and security alert samples.

Bootstrap passwords are read from environment variables. Seeded users set `must_change_password = true`. Production startup refuses to create sample users.

## 8. Existing Data Migration

The current `MediaFiles`/JSON metadata is migrated without exposing physical paths:

1. Back up the existing MySQL/JSON metadata and `Storage` directory.
2. Create a migration organization, bootstrap administrator, subject, and legacy lecture container.
3. Import each existing media row into `files` with normalized type, MIME, checksum, provider `LOCAL`, and a private `storage_key`.
4. Attach imported files to the legacy lecture through `lecture_files`.
5. Recalculate missing/invalid SHA-256 hashes from physical files.
6. Record an `IMPORT_LEGACY_FILE` audit entry for each imported item.
7. Verify counts, sizes, checksums, and missing storage objects before enabling the new endpoints.

The importer is idempotent through a unique legacy source key stored in import bookkeeping or deterministic storage keys.

## 9. MySQL Accounts and Grants

Provisioning creates separate credentials supplied through environment variables or a secret store:

- `dhan_migrator`: schema migration privileges only during deployment.
- `dhan_app`: required SELECT/INSERT/UPDATE/DELETE on application tables; no DDL, GRANT, FILE, or administrative privileges. It receives no UPDATE/DELETE grant on append-only log tables where deployment constraints permit table-level separation.
- `dhan_worker`: runtime permissions plus narrowly scoped cleanup/archive permissions.
- `dhan_backup`: consistent read/backup permissions only.

Accounts are limited to required network hosts, use TLS when traffic leaves the database host, and never use `root` from the application.

## 10. Migration Strategy

- Migrations are additive by default and have descriptive IDs.
- Destructive changes use expand/migrate/contract across releases.
- Deployment takes a verified backup before migration.
- Startup does not silently migrate production; deployment executes migrations explicitly.
- Seed operations are idempotent and run after schema migration.
- Migration history is validated before application startup.
- Rollback documentation distinguishes schema rollback from data restoration; unsafe data-destructive down migrations are not presented as lossless.

## 11. Transactions and Concurrency

Later application services must wrap these operations in database transactions:

- Create/publish/close/archive lecture plus permissions and audit.
- Upload file metadata/version/lecture attachment plus audit.
- Change file or lecture permission plus audit.
- Grant/revoke clearance plus audit.
- Revoke sessions/devices plus audit/security notification.

`row_version` is checked in update predicates. A mismatch produces a conflict rather than silently overwriting another actor's change.

## 12. Testing

Tests run against real MySQL 8, preferably through Docker/Testcontainers, and verify:

- Every migration applies to an empty database.
- Migrations and production seed are idempotent where required.
- All foreign keys and delete behaviors match the design.
- Unique constraints reject duplicate memberships, attachments, grants, usernames, and file versions.
- Check constraints reject invalid date windows, progress, permission combinations, and principal combinations.
- Audit/download history survives deletion or anonymization of referenced business records.
- Concurrency conflicts are detected.
- Development seed is blocked in production.
- Legacy import preserves counts, sizes, and checksums and is safe to rerun.
- Runtime MySQL credentials cannot execute DDL or modify protected logs.

## 13. Documentation Deliverables

- Mermaid ERD split into readable domain diagrams plus one relationship overview.
- Data dictionary listing every table, column, type, nullability, default, constraint, and sensitive-data classification.
- Migration and seed commands.
- Environment variable template without secrets.
- MySQL account provisioning and grant instructions.
- Backup and restore runbook with restore verification.
- Legacy data import runbook.

## 14. Acceptance Criteria

The DBMS phase is complete when:

1. A clean MySQL 8 database can be created exclusively from migrations.
2. Production reference data and opt-in development data seed successfully and idempotently.
3. All schema integrity and grant tests pass against MySQL.
4. Existing media metadata can be imported and verified without data loss.
5. No application secret, plaintext password, raw refresh token, or public storage path is seeded or exposed.
6. ERD, data dictionary, operational commands, backup/restore, and migration instructions are complete.
7. The existing frontend/media viewer remains buildable while the DBMS foundation is introduced.
