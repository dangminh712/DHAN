# Learning Persistence Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exact PDF navigation and page notes, persisted lecture/video progress, persisted quiz results, MySQL-only startup, structured API errors, EF Core migrations, and verified Range streaming.

**Architecture:** Extend the existing `TrainingDbContext` and training API rather than creating a new service. React reads PDF page count with PDF.js and sends debounced/throttled partial updates; ASP.NET Core only validates, projects, persists to MySQL, and streams disk files.

**Tech Stack:** React 18, Vite 5, `pdfjs-dist`, ASP.NET Core 8, EF Core 8, Pomelo MySQL 8, xUnit, MySQL 8, disk file storage.

**Spec:** `docs/superpowers/specs/2026-09-10-learning-persistence-design.md`

## Global Constraints

- Preserve all pre-existing uncommitted work and avoid unrelated refactors.
- MySQL is the only database; file binaries remain on disk.
- Never read PDF/video payloads into `byte[]` or store them in MySQL.
- Do not send progress for every page click or every video second.
- Do not add Redis, queues, microservices, transcoding, HLS, CDN, or continuous background jobs.
- Keep the current UI layout and only add controls/state needed by the feature.

---

### Task 1: Pure client learning helpers

**Files:**
- Modify: `client/src/pdfViewer.js`
- Modify: `client/src/pdfViewer.test.js`
- Create: `client/src/learningProgress.js`
- Create: `client/src/learningProgress.test.js`
- Modify: `client/package.json`

**Interfaces:**
- Produces: `clampPdfPage(value, totalPages)`, `createPdfNoteKey(fileId, page)`, `createQuizDraftKey(userId, lectureId, quizId)`, `isVideoComplete(position, duration, threshold)`, `createDebouncedSaver(save, delay)`.

- [ ] **Step 1: Add failing Node tests**

Test page values below 1, above the total, invalid input, 90% video completion, per-user quiz keys, debounce coalescing, and flush/cancel behavior using `node:test`.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test src/pdfViewer.test.js src/learningProgress.test.js` from `client`.

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the pure helpers**

Use this contract:

```js
export function clampPdfPage(value, totalPages) {
  const page = normalizePdfPage(value);
  const total = Math.max(1, Number.parseInt(totalPages, 10) || 1);
  return Math.min(page, total);
}

export function isVideoComplete(position, duration, threshold = 0.9) {
  return Number.isFinite(position) && Number.isFinite(duration) && duration > 0
    && position / duration >= threshold;
}
```

The debounced saver exposes `{ schedule(value), flush(), cancel() }`, retains only the newest value, and invokes `save` once per quiet period.

- [ ] **Step 4: Add PDF.js and test scripts**

Add `pdfjs-dist` to dependencies and scripts `test:unit` plus aggregate `test` without changing existing Vite scripts.

- [ ] **Step 5: Run client unit tests**

Run: `npm test` from `client`.

Expected: PASS.

### Task 2: Learning persistence entities and model indexes

**Files:**
- Modify: `server/Models/Training/Entities.cs`
- Modify: `server/Data/TrainingDbContext.cs`
- Create: `server/DTOs/LearningDtos.cs`
- Create: `server.Tests/Server.Tests.csproj`
- Create: `server.Tests/ModelConfigurationTests.cs`
- Modify: `DoAnKhoaHoc.sln`

**Interfaces:**
- Produces: entities `PdfNote`, `LearningPartProgress`, `QuizAttempt`; DTOs `PdfNoteDto`, `CreatePdfNoteDto`, `UpdatePdfNoteDto`, `ProgressPatchDto`, `LectureProgressDto`, `QuizSubmitDto`, `QuizAttemptDto`.

- [ ] **Step 1: Capture the current Training model as the controlled baseline before adding entities**

Run: `dotnet ef migrations add TrainingBaseline --context TrainingDbContext --output-dir Migrations/Training --project server/Server.csproj`.

Expected: a full MySQL baseline migration and model snapshot. For an existing database, do not apply this migration blindly; first compare its tables/columns with the existing schema, then record the baseline migration in `__EFMigrationsHistory` only after the comparison passes. A fresh database may apply it normally.

- [ ] **Step 2: Create the xUnit test project and failing model tests**

Reference `server/Server.csproj`, `Microsoft.EntityFrameworkCore.InMemory`, and xUnit packages. Assert table names and the composite indexes `(UserId, FileId, PdfPage)`, unique `(UserId, LectureId, PartId, FileId)`, and `(UserId, LectureId, QuizId, SubmittedAt)`.

- [ ] **Step 3: Run model tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter ModelConfigurationTests`.

Expected: FAIL because the entity types are absent.

- [ ] **Step 4: Add entities, DbSets, relationships, validation lengths, precision, and indexes**

Use `ulong` keys, UTC timestamps, `uint PdfPage`, `decimal(12,3)` seconds, `longtext` JSON/content where appropriate, and restrictive foreign keys for user/file/lecture records so historical learning data is not silently removed.

- [ ] **Step 5: Add request/response DTOs**

`ProgressPatchDto` contains required keys `UserId`, `LectureId`, `PartId`, optional `FileId`, and nullable changed fields `Completed`, `LastPdfPage`, `LastVideoSecond`, `VideoDurationSecond`. Reject a request when none of the changed fields is present.

- [ ] **Step 6: Run model tests**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter ModelConfigurationTests`.

Expected: PASS.

### Task 3: Page-scoped PDF notes API

**Files:**
- Create: `server/Controllers/PdfNotesController.cs`
- Create: `server.Tests/PdfNotesControllerTests.cs`

**Interfaces:**
- Produces: `GET /api/training/pdf-notes?userId=&fileId=&pdfPage=`, `POST /api/training/pdf-notes`, `PATCH /api/training/pdf-notes/{id}`, `DELETE /api/training/pdf-notes/{id}?userId=`.

- [ ] **Step 1: Write failing controller tests**

Seed notes for two users, two files and two pages. Assert GET returns only the exact tuple, POST allows a second note on the same page, PATCH/DELETE reject another user's note, and invalid page/content returns `VALIDATION_ERROR`.

- [ ] **Step 2: Run tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter PdfNotesControllerTests`.

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement projected, no-tracking GET and owned mutations**

GET must call `AsNoTracking()`, filter before projection, order by `CreatedAt`, and select only DTO fields. Mutations validate referenced user/file and never return EF navigation graphs.

- [ ] **Step 4: Run controller tests**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter PdfNotesControllerTests`.

Expected: PASS.

### Task 4: Partial progress API

**Files:**
- Create: `server/Controllers/ProgressController.cs`
- Create: `server.Tests/ProgressControllerTests.cs`

**Interfaces:**
- Produces: `GET /api/training/progress/{lectureId}?userId=` and `PATCH /api/training/progress`.

- [ ] **Step 1: Write failing progress tests**

Assert GET scopes by both user and lecture, PATCH changes only supplied fields, invalid pages/seconds fail, a second PATCH preserves existing values, and lecture percent is projected from completed distinct parts without querying other users.

- [ ] **Step 2: Run tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter ProgressControllerTests`.

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement keyed upsert and partial mutation**

Lookup by `UserId`, `LectureId`, `PartId` and nullable `FileId`. Create when absent, update only non-null DTO fields, set `UpdatedAt`, and save once. GET projects the lecture rows and derived percent in one bounded query.

- [ ] **Step 4: Run progress tests**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter ProgressControllerTests`.

Expected: PASS.

### Task 5: Quiz submission persistence

**Files:**
- Create: `server/Services/QuizDefinition.cs`
- Create: `server/Controllers/QuizAttemptsController.cs`
- Create: `server.Tests/QuizAttemptsControllerTests.cs`

**Interfaces:**
- Produces: `POST /api/training/quiz-attempts/submit`, `GET /api/training/quiz-attempts/{lectureId}?userId=&quizId=`; `QuizDefinition.Score(quizId, answers)`.

- [ ] **Step 1: Write failing scoring and persistence tests**

Assert the backend recomputes score, ignores a forged client score, persists answers JSON and submitted time, returns only the requested user's latest attempt, and rejects unknown quiz/question/option identifiers.

- [ ] **Step 2: Run tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter QuizAttemptsControllerTests`.

Expected: FAIL because quiz persistence is absent.

- [ ] **Step 3: Move the current three-question answer key into a small server definition and implement submit/query**

Accept answers as `Dictionary<string,int>`, calculate `correctCount` and percentage server-side, serialize with `System.Text.Json`, store one completed attempt per submit, and project the response DTO.

- [ ] **Step 4: Run quiz tests**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter QuizAttemptsControllerTests`.

Expected: PASS.

### Task 6: MySQL-only startup and EF migrations

**Files:**
- Modify: `server/Server.csproj`
- Modify: `server/Program.cs`
- Create: `server/Data/TrainingDbContextFactory.cs`
- Modify: `server/Migrations/Training/*`
- Create: `server.Tests/StartupConfigurationTests.cs`

**Interfaces:**
- Produces: design-time context factory for `dotnet ef`; MySQL-only runtime registration; explicit migration SQL.

- [ ] **Step 1: Write failing configuration guard tests**

Read project/startup source and assert there is no SQLite package, `JsonMediaService` registration, `EnsureCreated`, `Database.Migrate`, or TCP fallback branch.

- [ ] **Step 2: Run guard tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter StartupConfigurationTests`.

Expected: FAIL on current fallback/EnsureCreated/SQLite references.

- [ ] **Step 3: Remove fallback and configure MySQL unconditionally**

Register both contexts with Pomelo from `DefaultConnection`; leave connection attempts to EF and return a clear unhealthy status at `/` if `CanConnectAsync` fails. Do not create or migrate schema at application startup.

- [ ] **Step 4: Add design-time factory and generate the incremental migration**

Run: `dotnet ef migrations add LearningPersistenceCore --context TrainingDbContext --output-dir Migrations/Training --project server/Server.csproj`.

Expected: because Task 2 captured the baseline before adding the entities, this incremental migration creates only the three learning tables and their indexes without recreating or dropping existing training tables.

- [ ] **Step 5: Inspect generated migration SQL**

Run: `dotnet ef migrations script --context TrainingDbContext --project server/Server.csproj --idempotent`.

Expected: MySQL DDL only; no SQLite syntax, binary columns for files, or automatic execution.

- [ ] **Step 6: Run startup guard tests**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter StartupConfigurationTests`.

Expected: PASS.

### Task 7: PDF.js navigation and page-scoped notes UI

**Files:**
- Modify: `client/src/services/fileService.js`
- Create: `client/src/services/learningService.js`
- Modify: `client/src/LectureStudyPage.jsx`
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes: PDF helpers, note API, progress API, `fileService.getStreamUrl`.
- Produces: exact `currentPage / totalPages`, first/previous/next/last/jump controls, debounced resume, note list CRUD.

- [ ] **Step 1: Add a failing component-oriented source test**

Add `client/src/LectureStudyPage.test.js` that verifies the source wires `getDocument`, `numPages`, all five navigation actions, `learningService.getPdfNotes`, and debounced `patchProgress` rather than storing notes by lecture part.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test src/LectureStudyPage.test.js` from `client`.

Expected: FAIL on missing integration markers.

- [ ] **Step 3: Resolve the active PDF from `backendLecture.files` and load metadata**

Use the actual `fileId` and authenticated stream URL. Configure the PDF.js worker, cancel the previous loading task on file change, set `totalPages`, then restore/clamp `lastPdfPage`.

- [ ] **Step 4: Add bounded controls and debounced persistence**

First sets 1, Previous/Next clamp, Last sets total, and Jump validates on blur/Enter. Schedule one PATCH after two quiet seconds and flush on file/tab/page teardown without per-click requests.

- [ ] **Step 5: Replace part-local note storage with current-page API CRUD**

Fetch only when `userId`, active PDF file and page are known. Keep the current textarea as new-note composer; render a compact list with edit/delete actions and structured error/loading/empty states.

- [ ] **Step 6: Run client tests and build**

Run: `npm test && npm run build` from `client`.

Expected: PASS.

### Task 8: Persisted part and video progress UI

**Files:**
- Modify: `client/src/LectureStudyPage.jsx`
- Modify: `client/src/learningProgress.js`
- Modify: `client/src/learningProgress.test.js`

**Interfaces:**
- Consumes: progress GET/PATCH.
- Produces: restored completed parts, restored `video.currentTime`, 30-second throttled saves, pause/ended/unmount flush, 90% auto-completion.

- [ ] **Step 1: Extend failing helper/source tests**

Assert progress saves are separated by at least 30 seconds during playback, pause can force a save, resume occurs after metadata, and video completion uses actual duration at the 90% threshold.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test` from `client`.

Expected: FAIL for missing wiring.

- [ ] **Step 3: Load lecture progress once and hydrate state**

Map returned part rows to `completedParts`; keep per-file progress in a lookup and do not request progress for all learners or all lectures.

- [ ] **Step 4: Wire video resume and sparse persistence**

On `loadedmetadata`, clamp saved time below duration and assign `currentTime`. On `timeupdate`, update local maximum but PATCH only when 30 seconds elapsed; force save on pause/ended/file change/unmount.

- [ ] **Step 5: Enforce duration-based completion**

Mark the video part completed only at 90% or greater and persist it in the same PATCH. Keep manual completion for non-video parts only.

- [ ] **Step 6: Run tests and build**

Run: `npm test && npm run build` from `client`.

Expected: PASS.

### Task 9: Quiz draft and official submit UI

**Files:**
- Modify: `client/src/services/learningService.js`
- Modify: `client/src/LectureStudyPage.jsx`
- Modify: `client/src/learningProgress.test.js`

**Interfaces:**
- Consumes: quiz draft key and quiz attempt APIs.
- Produces: refresh-safe draft, official server score, clear-on-success behavior.

- [ ] **Step 1: Write failing draft/submit wiring tests**

Assert the draft key contains user + lecture + quiz, answers are restored on mount, submit calls the API once, displayed score comes from the response, and successful submit removes the draft.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test` from `client`.

Expected: FAIL for missing persistence wiring.

- [ ] **Step 3: Persist draft locally and submit once**

Write draft after answer changes without API calls. Disable submit while saving, send answers once, replace local score with official score, show structured error on failure, and retain draft if submit fails.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build` from `client`.

Expected: PASS.

### Task 10: Structured errors and streaming verification

**Files:**
- Create: `server/Infrastructure/ApiError.cs`
- Create: `server/Infrastructure/ApiExceptionMiddleware.cs`
- Modify: `server/Program.cs`
- Modify: `server/Controllers/FilesController.cs`
- Create: `server.Tests/FilesControllerTests.cs`

**Interfaces:**
- Produces: `{ success:false, message, code }` errors; 404 `FILE_RECORD_NOT_FOUND`, 404 `FILE_STORAGE_NOT_FOUND`, framework 416 for invalid ranges, and streaming results with Range enabled.

- [ ] **Step 1: Write failing file/error tests**

Assert metadata missing and disk missing have distinct codes, the action returns `FileStreamResult` with `EnableRangeProcessing == true`, and no file payload is materialized as `byte[]`.

- [ ] **Step 2: Run tests and verify failure**

Run: `dotnet test server.Tests/Server.Tests.csproj --filter FilesControllerTests`.

Expected: FAIL on structured codes and/or stream projection.

- [ ] **Step 3: Add middleware/envelope and tighten file queries**

Register middleware before controllers. Query only `Id`, `StoragePath`, `MimeType`, `OriginalName`, `FileSize`; preserve FileStream/PhysicalFile disposal semantics and Range processing. Do not log page changes or video seconds.

- [ ] **Step 4: Run backend tests/build**

Run: `dotnet test DoAnKhoaHoc.sln && dotnet build DoAnKhoaHoc.sln --no-restore`.

Expected: PASS.

- [ ] **Step 5: Run live migration/API/Range checks when MySQL is available**

Run the controlled migration, start the backend, query a known PDF/video with `Range: bytes=0-1023`, and issue an unsatisfiable range.

Expected: database update succeeds; valid range returns 206 without growing process memory by file size; invalid range returns 416.

- [ ] **Step 6: Static compliance scan**

Run:

```powershell
rg -n "UseSqlite|EnsureCreated|JsonMediaService|ReadAllBytes|ToArrayAsync" server --glob '!bin/**' --glob '!obj/**'
rg -n "setInterval.*api|timeupdate.*patchProgress" client/src
```

Expected: no SQLite/fallback/EnsureCreated or full-buffer PDF/video path; no polling/per-second API loop.

### Task 11: Core acceptance verification

**Files:**
- Modify: `server/Server.http`
- Create: `docs/learning-persistence-verification.md`

**Interfaces:**
- Produces: reproducible manual requests and recorded verification results.

- [ ] **Step 1: Add manual API scenarios**

Include exact requests for scoped note CRUD, partial progress PATCH, scoped GET, quiz submit, PDF stream range, missing metadata and missing physical file.

- [ ] **Step 2: Run all automated checks**

Run: `dotnet test DoAnKhoaHoc.sln`, `dotnet build DoAnKhoaHoc.sln --no-restore`, `npm test`, and `npm run build`.

Expected: all exit 0.

- [ ] **Step 3: Record database-dependent checks honestly**

Record migration version, representative SQL/EXPLAIN output and Range status when available. If MySQL or sample storage is unavailable, record the exact command and blocker; do not substitute SQLite/JSON.

- [ ] **Step 4: Review the final diff**

Confirm no unrelated user changes were overwritten, generated `bin/obj` files were not intentionally staged, and all new APIs return projections rather than navigation graphs.
