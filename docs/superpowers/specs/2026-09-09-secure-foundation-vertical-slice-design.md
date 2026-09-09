# Secure Foundation Vertical Slice Design

Date: 2026-09-09
Status: Proposed for implementation
Source: `MASTER SPECIFICATION — Hệ thống quản lý bài giảng và học liệu đào tạo`

## 1. Objective

Build the first production-oriented vertical slice of the existing application. The slice must prove the complete security path from a real MySQL database through authentication and backend authorization to private PDF/video access. Existing PDF, video, fullscreen, pop-out, and browser note UX will be retained and connected to authenticated APIs.

This slice is intentionally smaller than the master specification. It establishes the security and data foundations required by later modules without creating unused tables, fake screens, or placeholder business behavior.

## 2. Non-negotiable decisions

- MySQL 8.x is the only application DBMS and the only source of truth for persistent business metadata.
- The application fails fast with a clear health/startup error when MySQL is unavailable. It does not silently switch to JSON or SQLite.
- EF Core migrations create and evolve the schema. Production startup never calls `EnsureCreated`.
- No sample users, lectures, files, organizations, or dashboard records are seeded.
- Seed data is limited to immutable system bootstrap data: default roles and permission codes.
- The first administrator is created only through an explicit one-time bootstrap operation using secrets supplied through environment/configuration. The password is hashed immediately, never logged, and the account must change it on first login.
- All file storage remains private. The browser receives only authorized API streams, never a physical storage path.
- Backend authorization is authoritative. Frontend guards only control presentation.
- Authorization follows default-deny and least-privilege rules.
- Existing uncommitted user work and stored files are preserved. No automatic import of sample JSON metadata occurs.

## 3. Scope

### Included

1. Modular-monolith backend foundation.
2. MySQL connection, migration, transactional seed, and readiness health check.
3. Users, roles, permissions, role-permissions, organizational hierarchy, sessions, files, and audit logs required by this slice.
4. JWT access tokens and rotating refresh tokens.
5. Password hashing and forced first-password change.
6. Permission and organization-scope resolution.
7. Private file view, stream, and download endpoints.
8. Audit events for authentication and file access decisions.
9. React TypeScript authentication shell, session restoration, permission-aware routes/actions, and integration of the existing viewer.
10. Unit, integration, and security tests for the slice.
11. Environment/configuration documentation for local and on-premise development.

### Deferred

- Classes, subjects, lectures, lecture lifecycle, and class-scoped permissions.
- Classification and clearance policy.
- MFA, device limits, Redis-backed rate limiting, and security alerts.
- MinIO/NAS implementation, file versioning, retention, watermarking, and monitoring.
- Progress, watch history, notifications, and analytical dashboards.
- Full Docker Compose stack and production Nginx configuration.

These items remain required by the master specification and will be delivered as later vertical slices after this foundation is accepted.

## 4. Solution architecture

The backend remains a modular monolith but is separated into projects with one-way dependencies:

```text
Server.Api
  -> Server.Application
  -> Server.Infrastructure

Server.Infrastructure
  -> Server.Application
  -> Server.Domain

Server.Application
  -> Server.Domain

Server.Domain
  -> no infrastructure dependencies
```

Proposed solution layout:

```text
server/
  src/
    Server.Domain/
      Auth/
      Users/
      Organizations/
      Files/
      Audit/
    Server.Application/
      Abstractions/
      Auth/
      Users/
      Organizations/
      Files/
      Authorization/
      Audit/
    Server.Infrastructure/
      Persistence/
      Authentication/
      Authorization/
      Storage/
      Audit/
    Server.Api/
      Controllers/
      Middleware/
      Contracts/
      Configuration/
  tests/
    Server.UnitTests/
    Server.IntegrationTests/
```

Controllers translate HTTP requests and responses only. Application handlers/services own use cases and transactions. Domain types own invariants. Infrastructure implements EF Core, token, hashing, audit, and storage abstractions.

The frontend moves incrementally toward the master structure:

```text
client/src/
  app/
  auth/
  files/
  shared/
    components/
    layouts/
    services/
    permissions/
    routes/
    types/
    utils/
```

New frontend code is TypeScript. Existing viewer behavior may be wrapped before the remaining legacy JSX is migrated, avoiding a high-risk all-at-once rewrite.

## 5. Initial database model

All timestamps are UTC. Tables use InnoDB and `utf8mb4`. Business entities use soft deletion where required. Audit records never cascade-delete with users.

### Identity and authorization

- `users`: id, username, password_hash, full_name, email, phone, role_id, organizational_unit_id, status, must_change_password, last_login_at, created_at, updated_at, deleted_at, row_version.
- `roles`: id, code, name, description, is_system, status, created_at, updated_at.
- `permissions`: id, code, name, description, module, status, created_at, updated_at.
- `role_permissions`: role_id, permission_id, created_at; unique `(role_id, permission_id)`.
- `organizational_units`: id, parent_id, code, name, unit_type, status, created_at, updated_at, deleted_at, row_version.
- `user_sessions`: id, user_id, refresh_token_hash, token_family_id, device_id, device_name, ip_address, user_agent, last_activity_at, expires_at, revoked_at, revoke_reason, created_at.

### File access required by the vertical slice

- `files`: id, original_name, stored_name, mime_type, extension, file_type, file_size, storage_provider, storage_key, checksum_sha256, organizational_unit_id, uploaded_by, status, is_downloadable, created_at, updated_at, deleted_at, row_version.
- `file_permissions`: id, file_id, user_id nullable, can_view, can_download, access_reason, expires_at, created_at, updated_at. Class-scoped permission is added with the class module in the next slice.

### Audit

- `audit_logs`: id, user_id nullable, action, entity_type, entity_id nullable, outcome, policy_code, old_value JSON nullable, new_value JSON nullable, access_reason nullable, ip_address, user_agent, trace_id, created_at.

Indexes cover normalized username, role/status, organization hierarchy, active session/token lookup, file organization/status/checksum, file permission lookup, and audit filtering.

## 6. Seed and real-data policy

Migrations seed only:

- Roles: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`.
- Permission codes needed by this slice, including `USER_VIEW`, `USER_CREATE`, `USER_UPDATE`, `ORGANIZATION_VIEW`, `ORGANIZATION_MANAGE`, `FILE_VIEW`, `FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_DELETE`, and `AUDIT_VIEW`.
- Default role-permission mappings using least privilege.

No fictional organizations, people, classes, lectures, files, statistics, or activity are inserted. An empty system displays honest empty states.

Existing `metadata.json` and files in `server/Storage` are not treated as database records. A later operator-only import command may validate and import explicitly selected real files into MySQL. It will not run automatically and will not infer that bundled sample files are production data.

## 7. Authentication design

### Login

1. Validate input and rate-limit at the API boundary when the rate-limit module becomes available.
2. Load the active user by normalized username.
3. Verify the password with BCrypt or Argon2id using a maintained library.
4. Record `LOGIN_FAILED` without exposing whether an account exists.
5. On success, create a short-lived JWT access token and a cryptographically random refresh token.
6. Store only the refresh-token hash in `user_sessions`.
7. Return the access token in the response and set the refresh token as `HttpOnly`, `Secure` in production, and `SameSite=Strict` cookie.

The frontend keeps the access token in memory, not local storage. Page reload restores a session through the refresh endpoint. Refresh and logout endpoints include CSRF protection appropriate to cookie-based credentials.

### Refresh rotation

Every refresh invalidates the presented token and issues a new token in the same token family. Reuse of an invalidated refresh token revokes the entire family and creates an audit event. Logout revokes the current session; administrative device/session revocation is delivered in the later session-management slice.

## 8. Authorization design

`PermissionResolver` receives the authenticated user, action, and resource context and returns an access decision:

```text
allowed
reason
policyCode
```

For this slice, a file action is allowed only when all applicable checks pass:

1. Authenticated active user and non-revoked session.
2. Required role permission exists.
3. File is active and not soft-deleted.
4. User is inside the file organization scope, is the uploader where policy allows, or has an explicit user-level grant.
5. Download additionally requires `files.is_downloadable` and `file_permissions.can_download` when an explicit permission applies.
6. Permission has not expired.

Unknown or incomplete context returns deny. The resolver does not use frontend state or trust IDs supplied without loading the corresponding database resource.

SUPER_ADMIN bypass, if supported, is explicit in policy code and still requires an active account/session and emits audit records. It is not implemented as an implicit role-name check scattered through controllers.

## 9. Private storage and media delivery

`IFileStorage` abstracts binary storage. The first implementation is `LocalFileStorage`, rooted at a configured private directory outside web static roots. It accepts generated storage keys only and rejects traversal. Database records store `storage_provider` and opaque `storage_key`, never a public URL.

Endpoints:

- `GET /api/files/{id}/view` for PDF/image/document viewing.
- `GET /api/files/{id}/stream` for video/audio range streaming.
- `GET /api/files/{id}/download` for authorized attachment download.

Each endpoint loads the resource by ID, calls `FileAccessService`, returns 404 or 403 according to one consistent confidentiality policy, streams through `IFileStorage`, and records the outcome. HTTP range support remains enabled for video. Physical paths, database errors, and policy details above the caller's visibility are never returned.

The legacy anonymous `/api/media/*` endpoints are removed after the frontend switches to the authorized endpoints. There is no permanent anonymous compatibility route.

## 10. Frontend flow

1. The application starts on a login route when no session can be restored.
2. Successful login stores the access token in memory and loads `/api/auth/me`.
3. Route and action guards use permission codes returned for the authenticated user.
4. File lists are already authorization-filtered by the backend; the client never receives a global list and hides forbidden entries.
5. The existing PDF/video viewer calls the authorized view/stream endpoint.
6. Download is shown only when the API says the action is available, while the download endpoint independently re-authorizes.
7. Per-page PDF notes remain local browser data in this slice and are explicitly labeled as local, not server-synchronized records.

The visual style remains professional, light, responsive, and restrained. Authentication and error states use the same design language as the current viewer.

## 11. API and error contract

Errors use a stable envelope:

```json
{
  "success": false,
  "code": "FILE_ACCESS_DENIED",
  "message": "Bạn không có quyền thực hiện thao tác này.",
  "traceId": "..."
}
```

Validation failures return field-safe details. Authentication failures do not disclose account existence. Authorization errors do not expose physical paths, SQL, exception details, higher classification metadata, or permission internals. A correlation/trace middleware includes `traceId` in logs and error responses.

Startup/configuration failures name the missing configuration key or unavailable service without printing credentials.

## 12. Transactions and concurrency

Transactions cover:

- One-time bootstrap administrator creation and role assignment.
- Login/session creation with its audit event where practical.
- Refresh-token rotation and reuse-family revocation.
- File metadata creation plus audit record after binary storage succeeds.
- Permission changes plus audit record.
- Soft file deletion plus audit record.

Optimistic concurrency uses a row-version/concurrency token on mutable users, organizations, and files. Conflicting updates return HTTP 409 rather than silently overwriting another administrator's work.

Binary upload follows a compensating-action pattern: validate and write to a temporary/private storage key, persist metadata transactionally, then finalize the storage object. Failures remove temporary data when safe and never leave a visible database record pointing to a missing object.

## 13. Testing strategy

### Unit tests

- Permission resolution defaults to deny.
- Role permission, organization scope, uploader exception, explicit grant, expiry, and download flag behavior.
- Password verification and refresh-token-family rules.
- Organization parent validation and cycle prevention service contract.
- Storage-key traversal rejection.

### Integration tests against MySQL

- Migration and system seed on an empty database.
- Bootstrap administrator can log in and must change password.
- Access-token authentication, refresh rotation, logout, and revoked-token rejection.
- Authorized PDF view and video range request.
- Authorized and denied download audit outcomes.
- Transaction rollback for failed permission/file operations.

Integration tests use an isolated real MySQL test database/container, never an EF in-memory provider, SQLite substitute, or JSON fixture database.

### Security tests

- Anonymous access is denied.
- A student cannot access a file by changing the ID.
- A teacher cannot access another organization's file.
- Expired explicit permission is denied.
- A non-downloadable file cannot be downloaded through a direct URL.
- A revoked session cannot refresh.
- Error responses do not leak storage paths, SQL, secrets, or internal exceptions.

## 14. Configuration and operations

Secrets and environment-specific values are supplied through environment variables or protected deployment configuration. Required settings include MySQL connection parts, JWT signing key/issuer/audience, refresh-cookie settings, private storage root, and bootstrap administrator controls.

The repository contains an `.env.example` with names and safe descriptions only. Real secrets are ignored by Git. Health endpoints are split into liveness and readiness; readiness fails when MySQL or required storage is unavailable.

Structured logging includes timestamp, level, service, trace ID, user ID when known, endpoint, status, and duration. Tokens, passwords, cookie values, connection passwords, and file contents are excluded.

## 15. Migration from the current prototype

Implementation proceeds without destroying current user work:

1. Add the new projects and tests beside the current backend.
2. Build the schema and authentication path against a dedicated development MySQL database.
3. Implement authorized file endpoints using `IFileStorage` and real DB records.
4. Migrate the frontend session shell and viewer to the new APIs.
5. Verify security scenarios and only then remove the JSON fallback and legacy anonymous controller.
6. Keep existing physical files untouched until an operator deliberately imports or archives them.

There is no interval in which the new production path silently falls back to unprotected JSON metadata.

## 16. Acceptance criteria

The slice is accepted when:

- A clean MySQL database can be created entirely through migrations.
- Only system roles/permissions are seeded; business tables are honestly empty.
- An explicitly bootstrapped administrator can log in and is forced to change the initial password.
- Tokens rotate and revoked sessions are rejected.
- Anonymous file view/download is rejected.
- Authorized users can view PDF and seek video through private endpoints.
- Cross-user ID changes and cross-organization access are denied by backend tests.
- Download policy is enforced at the endpoint and denied attempts are audited.
- The current PDF/video UX works through authenticated APIs on desktop and basic mobile layouts.
- Tests execute against MySQL and the repository documents required configuration without committing secrets.

## 17. Next slice

After this foundation is complete, the next vertical slice adds classes, subjects, lectures, lecture files, class membership, lecture permissions, file permissions by class, publish/close scheduling, and teacher/student lecture flows. It reuses the authentication, permission resolver, storage, audit, error, transaction, and test infrastructure defined here.
