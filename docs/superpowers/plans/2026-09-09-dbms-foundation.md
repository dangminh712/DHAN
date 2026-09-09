# Secure MySQL DBMS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete MySQL 8 schema, migrations, reference/development data, legacy importer, least-privilege grants, ERD, integrity tests, and operational runbooks.

**Architecture:** Add a modular `Domain` and `Infrastructure/Persistence` foundation without deleting the existing application. EF Core migrations own production DDL; MySQL is mandatory and production fails closed, while development data and legacy import are explicit commands.

**Tech Stack:** .NET 8, C# 12, EF Core 8, Pomelo MySQL 8, MySQL 8, xUnit, FluentAssertions, Testcontainers.MySql, BCrypt.Net-Next, Mermaid.

**Spec:** `docs/superpowers/specs/2026-09-09-dbms-foundation-design.md`

## Global Constraints

- MySQL 8/InnoDB, `utf8mb4`, UTC `DATETIME(6)`, signed `BIGINT` keys.
- Never use `EnsureCreated` in production or silently fall back to JSON/SQLite.
- Never store plaintext passwords, raw refresh tokens, MFA keys, database secrets, or public storage paths.
- No MySQL `ENUM` or business-logic triggers/procedures.
- No cascade deletion of audit/download/security history.
- Preserve the dirty worktree and all existing media.
- Test-first against real MySQL 8.

## File Map

- `server/Domain/{Common,Identity,Organization,Learning,Security}`: focused domain entities.
- `server/Infrastructure/Persistence/Configurations`: explicit EF mappings and constraints.
- `server/Infrastructure/Persistence/Migrations`: authoritative schema history.
- `server/Infrastructure/Persistence/{Seeding,Legacy}`: safe data population.
- `server/Tests/Database`: real-MySQL schema/integrity tests.
- `server/deploy/mysql`: database/account provisioning.
- `docs/database`: ERD, dictionary, migration, backup, restore, import.

---

### Task 1: MySQL-only persistence test harness

**Files:**
- Modify: `server/Server.csproj`, `server/Program.cs`, `DoAnKhoaHoc.sln`
- Replace: `server/Data/AppDbContext.cs`
- Create: `server/Infrastructure/Persistence/{AppDbContext,DatabaseOptions}.cs`
- Create: `server/Tests/Server.Database.Tests.csproj`
- Create: `server/Tests/Database/{MySqlFixture,StartupDatabaseTests}.cs`

**Produces:** `DatabaseOptions.Validate()`, `AppDbContext`, reusable MySQL Testcontainer.

- [ ] Write this failing test:

```csharp
[Fact]
public void Missing_connection_string_is_rejected()
{
    var act = () => new DatabaseOptions { ConnectionString = "" }.Validate();
    act.Should().Throw<InvalidOperationException>().WithMessage("*Database:ConnectionString*");
}
```

- [ ] Run `dotnet test server/Tests/Server.Database.Tests.csproj --filter StartupDatabaseTests`; expect RED because the new API is absent.
- [ ] Add xUnit, FluentAssertions, Testcontainers.MySql, EF Design, and Pomelo packages. Implement validated `DatabaseOptions`, `UseMySql`, and the fixture. Remove TCP probing, JSON/SQLite selection, and `EnsureCreated`.
- [ ] Run the focused test and `dotnet build DoAnKhoaHoc.sln`; expect exit 0.
- [ ] Commit: `build: establish MySQL persistence harness`.

### Task 2: Identity, RBAC, organization, classes, and subjects

**Files:**
- Create: `server/Domain/Common/Entity.cs`
- Create: `server/Domain/Identity/{Role,Permission,RolePermission,User}.cs`
- Create: `server/Domain/Organization/{OrganizationalUnit,Class,StudentClass,Subject,TeacherSubject}.cs`
- Create: `server/Infrastructure/Persistence/Configurations/{Identity,Organization}Configurations.cs`
- Modify: `server/Infrastructure/Persistence/AppDbContext.cs`
- Test: `server/Tests/Database/IdentityOrganizationSchemaTests.cs`

**Produces:** DbSets and relationships described in design sections 5.1–5.2.

- [ ] Write failing metadata tests asserting unique role code, normalized username/email, organization code, class code, subject code, student/class pair, and teacher/subject pair; assert organization parent delete is `Restrict` and has `parent_id <> id`.
- [ ] Run `dotnet test ... --filter IdentityOrganizationSchemaTests`; expect RED.
- [ ] Implement all specified columns, snake_case mappings, lengths, indexes, FK behavior, soft delete, UTC precision, and concurrency tokens. Core mapping pattern:

```csharp
builder.HasIndex(x => x.Code).IsUnique();
builder.Property(x => x.RowVersion).IsConcurrencyToken();
builder.HasOne(x => x.Parent).WithMany(x => x.Children)
    .HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
builder.ToTable(t => t.HasCheckConstraint(
    "ck_organizational_units_parent_not_self", "parent_id IS NULL OR parent_id <> id"));
```

- [ ] Re-run focused tests; expect GREEN.
- [ ] Commit: `feat: model identity organization and academics`.

### Task 3: Lectures, files, permissions, versions, classification, and clearance

**Files:**
- Create: `server/Domain/Learning/{Lecture,LearningFile,FileVersion,LectureFile,LecturePermission,FilePermission}.cs`
- Create: `server/Domain/Security/{ClassificationLevel,UserClearanceLevel}.cs`
- Create: `server/Infrastructure/Persistence/Configurations/{Learning,Security}Configurations.cs`
- Modify: `server/Infrastructure/Persistence/AppDbContext.cs`
- Test: `server/Tests/Database/LearningResourceSchemaTests.cs`

**Produces:** user → org/class → lecture → attachment → file → classification/clearance graph.

- [ ] Write failing MySQL tests that reject download without view, two/no file-permission principals, reversed publish/close windows, duplicate lecture/file, duplicate file version, invalid SHA-256, and duplicate active clearance.
- [ ] Run focused tests; expect RED.
- [ ] Implement design sections 5.3–5.4. Required checks include:

```csharp
builder.ToTable(t => t.HasCheckConstraint(
    "ck_lecture_files_download_requires_view", "is_downloadable = 0 OR is_visible = 1"));
builder.ToTable(t => t.HasCheckConstraint(
    "ck_file_permissions_one_principal",
    "(user_id IS NOT NULL AND class_id IS NULL) OR (user_id IS NULL AND class_id IS NOT NULL)"));
builder.HasIndex(x => new { x.LectureId, x.FileId }).IsUnique();
builder.HasIndex(x => new { x.FileId, x.Version }).IsUnique();
```

Use `LearningFile` mapped to `files`; use provider-specific generated columns only where nullable uniqueness needs them.

- [ ] Re-run focused tests; expect GREEN.
- [ ] Commit: `feat: model learning resources and access grants`.

### Task 4: Sessions, MFA, progress, watch history, notifications, and security operations

**Files:**
- Create: `server/Domain/Identity/{UserSession,UserMfa}.cs`
- Create: `server/Domain/Learning/{WatchHistory,LearningProgress,Notification}.cs`
- Create: `server/Domain/Security/{AuditLog,DownloadLog,SecurityAlert,RetentionPolicy,SystemSetting}.cs`
- Modify: mappings and `AppDbContext.cs`
- Test: `server/Tests/Database/OperationalSchemaTests.cs`

- [ ] Write failing tests for unique refresh-token hash, unique progress/history, 0–100 progress, non-negative playback, resolved-alert fields, retention ordering, and non-cascade historical FKs.
- [ ] Run focused tests; expect RED.
- [ ] Implement all fields/indexes/checks in design sections 5.1 and 5.5–5.7. Store refresh-token hashes only, MFA ciphertext plus key version, sanitized audit JSON, and nullable historical actor/resource FKs with `SetNull`/restriction.
- [ ] Re-run focused tests; expect GREEN.
- [ ] Commit: `feat: model sessions progress audit and security`.

### Task 5: Authoritative migration and SQL artifact

**Files:**
- Create: `server/Infrastructure/Persistence/DesignTimeDbContextFactory.cs`
- Create: `server/Infrastructure/Persistence/Migrations/*_InitialSecurePlatform.cs`
- Create: `server/Infrastructure/Persistence/Migrations/AppDbContextModelSnapshot.cs`
- Create: `server/Tests/Database/MigrationTests.cs`
- Create: `artifacts/db/initial-secure-platform.sql`

- [ ] Write a failing test that applies migrations to clean MySQL, asserts the exact 27-table set, rolls back to zero, and reapplies.
- [ ] Run focused test; expect RED.
- [ ] Generate migration and deployment SQL:

```powershell
dotnet ef migrations add InitialSecurePlatform --project server/Server.csproj --output-dir Infrastructure/Persistence/Migrations
dotnet ef migrations script --project server/Server.csproj --idempotent --output artifacts/db/initial-secure-platform.sql
```

- [ ] Inspect SQL for InnoDB/collation, every FK/delete action, check, generated uniqueness column, and index. Put provider SQL in the migration, not startup.
- [ ] Run migration tests; expect GREEN.
- [ ] Commit: `feat: add initial secure MySQL migration`.

### Task 6: Production seed, development data, and legacy import

**Files:**
- Create: `server/Infrastructure/Persistence/Seeding/{PermissionCatalog,ProductionSeeder,DevelopmentSeedOptions,DevelopmentSeeder}.cs`
- Create: `server/Infrastructure/Persistence/Legacy/{LegacyMediaRecord,LegacyMediaImporter}.cs`
- Test: `server/Tests/Database/{ProductionSeedTests,DevelopmentSeedTests,LegacyMediaImportTests}.cs`
- Modify: `server/Server.csproj`

- [ ] Write failing tests proving production seed is idempotent, creates exactly four roles/four classifications and no users/secrets; development seed refuses Production; importer preserves counts/checksums and is idempotent.
- [ ] Run these tests; expect RED.
- [ ] Implement stable permission catalog and transactional upserts. Require `DHAN_DEV_BOOTSTRAP_PASSWORD`, hash with BCrypt work factor 12, and set `must_change_password=true`. Development data covers all roles, organization levels, classes, subjects, lecture statuses, file types, permission combinations, clearance states, progress, alerts, and logs.
- [ ] Implement importer using provider `LOCAL` plus relative keys, recomputed invalid hashes, legacy organization/subject/lecture, attachment rows, and `IMPORT_LEGACY_FILE` audits.
- [ ] Re-run tests; expect GREEN.
- [ ] Commit: `feat: seed platform data and import legacy media`.

### Task 7: Least-privilege accounts, ERD, dictionary, and runbooks

**Files:**
- Create: `server/deploy/mysql/{01-create-database-and-accounts.sql,02-verify-runtime-grants.sql,README.md}`
- Test: `server/Tests/Database/{MySqlGrantTests,SchemaDocumentationTests}.cs`
- Create: `docs/database/{erd-overview,erd-identity,erd-learning,erd-security,data-dictionary,migrations,backup-restore,legacy-import}.md`
- Create: `.env.example`
- Modify: `HUONG_DAN_SU_DUNG.md`

- [ ] Write failing tests proving runtime DML succeeds but DDL/GRANT fails, protected history cannot be changed through the runtime account, and the data dictionary lists every mapped table.
- [ ] Run focused tests; expect RED.
- [ ] Add parameterized provisioning for `dhan_migrator`, `dhan_app`, `dhan_worker`, and `dhan_backup`; scripts contain no password and default to restricted hosts. Runtime receives no DDL, GRANT, FILE, or administrative privilege.
- [ ] Write Mermaid domain ERDs and a dictionary row for every migration column: type, nullability, default, FK/delete behavior, indexes, sensitivity, and purpose.
- [ ] Document exact migration, seed, backup, restore-to-new-DB, integrity verification, and legacy import commands.
- [ ] Re-run focused tests; expect GREEN.
- [ ] Commit: `docs: secure and operate the MySQL database`.

### Task 8: Complete DBMS verification

- [ ] Run static checks:

```powershell
dotnet format DoAnKhoaHoc.sln --verify-no-changes
git diff --check
```

- [ ] Run all database tests against fresh MySQL:

```powershell
dotnet test server/Tests/Server.Database.Tests.csproj --logger "console;verbosity=normal"
```

- [ ] Rehearse a clean database:

```powershell
dotnet ef database update --project server/Server.csproj
dotnet run --project server/Server.csproj -- db seed-production
dotnet run --project server/Server.csproj -- db seed-development
dotnet run --project server/Server.csproj -- db import-legacy --metadata server/Storage/metadata.json --storage-root server/Storage
```

Verify table/FK counts, imported counts, checksums, idempotency, and absence of raw credentials.

- [ ] Regression verification:

```powershell
dotnet build DoAnKhoaHoc.sln --no-restore
npm --prefix client test
npm --prefix client run build
```

- [ ] Re-read all seven design acceptance criteria. If Docker/MySQL is unavailable, report the exact command not executed and do not claim it passed.
- [ ] Commit only failure-driven fixes as `fix: complete DBMS verification`.
