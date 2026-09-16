# Course Content Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the primary lecture experience with a production-ready Môn học → Chương → Tài liệu domain across MySQL, ASP.NET Core, and React.

**Architecture:** Keep `subjects` as courses, add first-class `chapters` and `chapter_materials`, expose `/api/courses` read/write endpoints, and route the React client through three focused course pages. Legacy lecture tables remain available for rollback, but the primary UI and new writes use only the course domain.

**Tech Stack:** .NET 8, ASP.NET Core controllers, EF Core 8/Pomelo MySQL, React 18, Vite 5, Axios, Lucide React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-course-content-architecture-design.md`

## Global Constraints

- The user-facing hierarchy is exactly **Môn học → Chương → Tài liệu**.
- Chapters are flexible per course; the eight NVCB2 chapters are sample data only.
- Search is case-insensitive and Vietnamese accent-insensitive across material name, chapter name, file type, and extension.
- Body text is at least 16px; interactive targets are at least 44×44px; visible focus and 4.5:1 contrast are required.
- The course search and chapter list must be visible in the first desktop viewport; no large hero banner.
- A learner reaches a document in no more than three primary actions.
- The server remains authoritative for view/download permission.
- Legacy lecture tables are not dropped in this implementation.

---

## File Structure

- `server/Models/Training/CourseEntities.cs`: focused EF entities for chapters and chapter materials.
- `server/DTOs/CourseDtos.cs`: API contracts for cards, detail, search results, and mutations.
- `server/Services/VietnameseSearchNormalizer.cs`: deterministic accent/case normalization used by tests and fallback matching.
- `server/Controllers/CoursesController.cs`: course queries, search, chapter/material CRUD, authorization gates.
- `server/Data/TrainingDbContext.cs`: DbSets, constraints, relationships, filters, and indexes.
- `server/Migrations/Training/*CourseContentArchitecture*`: generated migration and legacy data transfer.
- `server/seed_data.php`: idempotent NVCB2 course/chapter seed.
- `server.CourseTests/*`: focused xUnit tests for model rules, normalization, and course API projections.
- `client/src/courseSearch.js`: frontend normalization, matching, format, and size helpers.
- `client/src/courseSearch.test.js`: Node tests for Vietnamese search and file-format behavior.
- `client/src/services/courseService.js`: all `/api/courses` calls and cancellation-aware query params.
- `client/src/pages/CoursesPage.jsx`: course catalog.
- `client/src/pages/CourseDetailPage.jsx`: course overview, global search, chapter/format filters.
- `client/src/pages/ChapterDetailPage.jsx`: breadcrumb, chapter filters, document rows.
- `client/src/components/course/*`: reusable course card, chapter card, filters, and material row.
- `client/src/styles/courses.css`: isolated responsive/accessibility styles for the new flow.
- `client/src/App.jsx`: routes and shared viewer integration.
- `client/src/components/layout/Navbar.jsx`: primary “Môn học” navigation.

---

### Task 1: Course Domain and Migration

**Files:**
- Create: `server/Models/Training/CourseEntities.cs`
- Modify: `server/Models/Training/Entities.cs`
- Modify: `server/Data/TrainingDbContext.cs`
- Create: `server.CourseTests/server.CourseTests.csproj`
- Create: `server.CourseTests/CourseModelTests.cs`
- Create: `server/Migrations/Training/20260916000000_CourseContentArchitecture.cs`
- Create: `server/Migrations/Training/20260916000000_CourseContentArchitecture.Designer.cs`
- Modify: `server/Migrations/Training/TrainingDbContextModelSnapshot.cs`

**Interfaces:**
- Produces: `Chapter`, `ChapterMaterial`, `TrainingDbContext.Chapters`, `TrainingDbContext.ChapterMaterials`.
- `Chapter` exposes `Id`, `SubjectId`, `ChapterNumber`, `Title`, `Description`, `DisplayOrder`, `Status`, timestamps, `DeletedAt`, `Subject`, and `Materials`.
- `ChapterMaterial` exposes `Id`, `ChapterId`, `FileId`, `MaterialGroup`, `DisplayOrder`, `IsVisible`, `IsDownloadable`, `IsPrintable`, timestamps, `Chapter`, and `File`.

- [ ] **Step 1: Add a failing model test**

```csharp
[Fact]
public void Course_model_has_required_unique_indexes()
{
    using var db = TestDb.Create();
    var chapter = db.Model.FindEntityType(typeof(Chapter))!;
    Assert.Contains(chapter.GetIndexes(), i => i.IsUnique &&
        i.Properties.Select(p => p.Name).SequenceEqual(new[] { "SubjectId", "ChapterNumber" }));
    var material = db.Model.FindEntityType(typeof(ChapterMaterial))!;
    Assert.Contains(material.GetIndexes(), i => i.IsUnique &&
        i.Properties.Select(p => p.Name).SequenceEqual(new[] { "ChapterId", "FileId" }));
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj --filter Course_model_has_required_unique_indexes`

Expected: compilation fails because `Chapter` and `ChapterMaterial` do not exist.

- [ ] **Step 3: Add the entities and EF configuration**

Implement `[Table("chapters")] Chapter` and `[Table("chapter_materials")] ChapterMaterial`. Add the two DbSets, unique indexes, `(SubjectId, DisplayOrder)` and `(ChapterId, DisplayOrder)` indexes, the `Chapter.DeletedAt == null` global filter, cascade from subject to chapters, and restrict file deletion while linked.

- [ ] **Step 4: Generate and inspect the migration**

Run: `dotnet ef migrations add CourseContentArchitecture --project server/server.csproj --context TrainingDbContext --output-dir Migrations/Training`

Add SQL in `Up` that inserts one chapter per legacy lecture and copies visible lecture-file links into `chapter_materials` without duplicates. Do not drop legacy tables in `Up` or `Down`.

- [ ] **Step 5: Run model tests and build**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj`

Run: `dotnet build DoAnKhoaHoc.sln`

Expected: both commands exit 0.

- [ ] **Step 6: Commit the domain slice**

```bash
git add server/Models/Training/CourseEntities.cs server/Models/Training/Entities.cs server/Data/TrainingDbContext.cs server/Migrations/Training server.CourseTests
git commit -m "feat: add course chapter material domain"
```

### Task 2: DTOs, Search Normalization, and Read API

**Files:**
- Create: `server/DTOs/CourseDtos.cs`
- Create: `server/Services/VietnameseSearchNormalizer.cs`
- Create: `server/Controllers/CoursesController.cs`
- Create: `server.CourseTests/VietnameseSearchNormalizerTests.cs`
- Create: `server.CourseTests/CourseReadModelTests.cs`

**Interfaces:**
- Consumes: `TrainingDbContext.Chapters` and `TrainingDbContext.ChapterMaterials` from Task 1.
- Produces: `GET /api/courses`, `GET /api/courses/{courseId}`, `GET /api/courses/{courseId}/chapters/{chapterId}`, and `GET /api/courses/{courseId}/materials/search`.
- Produces: `VietnameseSearchNormalizer.Normalize(string?) -> string`.

- [ ] **Step 1: Write failing normalization tests**

```csharp
[Theory]
[InlineData("KẾ HOẠCH GIẢNG DẠY", "ke hoach giang day")]
[InlineData("Đề cương môn học", "de cuong mon hoc")]
public void Normalize_removes_case_and_vietnamese_diacritics(string input, string expected)
{
    Assert.Equal(expected, VietnameseSearchNormalizer.Normalize(input));
}
```

- [ ] **Step 2: Verify the normalization test fails**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj --filter Normalize_removes_case`

Expected: fails because `VietnameseSearchNormalizer` is missing.

- [ ] **Step 3: Implement deterministic normalization**

Use Unicode FormD, discard `UnicodeCategory.NonSpacingMark`, explicitly convert `đ/Đ` to `d`, lower-case invariant, collapse whitespace, and return an empty string for null.

- [ ] **Step 4: Write failing read-model tests**

Seed one subject, two chapters, and PDF/video materials in the test context. Assert the course summary returns `ChapterCount = 2`, `MaterialCount = 2`, and formats `PDF`, `VIDEO`; assert a material DTO never sets `CanDownload` from client input.

- [ ] **Step 5: Implement DTOs and controller projections**

Create `CourseSummaryDto`, `CourseDetailDto`, `ChapterSummaryDto`, `ChapterDetailDto`, `CourseMaterialDto`, and `PagedCourseResultDto<T>`. Project only visible materials, order chapters by `DisplayOrder` then `ChapterNumber`, paginate all lists, and validate that a chapter belongs to the route course.

For MySQL search, apply `EF.Functions.Collate(column, "utf8mb4_0900_ai_ci")` with `%term%` matching to names, chapter text, file type, extension, and material group. Limit `q` to 200 characters and default `pageSize` to 20 with a maximum of 100.

- [ ] **Step 6: Verify read API tests and build**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj`

Run: `dotnet build server/server.csproj`

Expected: all pass and exit 0.

- [ ] **Step 7: Commit the read API slice**

```bash
git add server/DTOs/CourseDtos.cs server/Services/VietnameseSearchNormalizer.cs server/Controllers/CoursesController.cs server.CourseTests
git commit -m "feat: expose course catalog and material search api"
```

### Task 3: Course Mutation API, Audit, and NVCB2 Seed

**Files:**
- Modify: `server/DTOs/CourseDtos.cs`
- Modify: `server/Controllers/CoursesController.cs`
- Create: `server.CourseTests/CourseMutationTests.cs`
- Modify: `server/seed_data.php`
- Modify: `server/scripts/build_rich_seed.php`

**Interfaces:**
- Produces: `POST/PUT/DELETE /api/courses/{courseId}/chapters` and `POST/PUT/DELETE /api/courses/{courseId}/chapters/{chapterId}/materials`.
- Consumes: existing `IAuditService` and current user/role conventions.

- [ ] **Step 1: Write failing mutation authorization tests**

```csharp
[Theory]
[InlineData("STUDENT", false)]
[InlineData("TEACHER", true)]
[InlineData("SUPER_ADMIN", true)]
public async Task Chapter_mutation_requires_staff_role(string role, bool allowed)
{
    var result = await fixture.CreateChapterAs(role, new CreateChapterDto(1, "Hồ sơ môn học", null));
    Assert.Equal(allowed, result.IsSuccess);
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj --filter Chapter_mutation_requires_staff_role`

Expected: fails because mutation contracts/endpoints are absent.

- [ ] **Step 3: Implement validated mutations**

Validate non-empty title, positive chapter number, course/chapter ownership, existing active file, allowed material groups, and duplicate links. Server controls `IsDownloadable` and records create/update/delete operations through `IAuditService`. Student requests return 403; missing resources return 404; conflicts return 409.

- [ ] **Step 4: Add idempotent NVCB2 seed**

Seed subject code `NVCB2` and upsert these chapter titles by `(subject_id, chapter_number)`: Hồ sơ môn học; Chương trình và đề cương; Kế hoạch giảng dạy; Giáo án và bài giảng; Hoạt động học thuật; Hệ thống bài tập; Câu hỏi và đáp án; Học liệu và tư liệu.

- [ ] **Step 5: Verify tests and seed syntax**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj`

Run: `php -l server/seed_data.php`

Run: `php -l server/scripts/build_rich_seed.php`

Expected: all exit 0.

- [ ] **Step 6: Commit the mutation slice**

```bash
git add server/DTOs/CourseDtos.cs server/Controllers/CoursesController.cs server.CourseTests server/seed_data.php server/scripts/build_rich_seed.php
git commit -m "feat: manage course chapters and materials"
```

### Task 4: Frontend Course Utilities and Service

**Files:**
- Create: `client/src/courseSearch.js`
- Create: `client/src/courseSearch.test.js`
- Create: `client/src/services/courseService.js`
- Modify: `client/package.json`

**Interfaces:**
- Produces: `normalizeVietnamese`, `matchesCourseSearch`, `getMaterialFormat`, `formatFileSize`.
- Produces: `courseService.list`, `courseService.getDetail`, `courseService.getChapter`, `courseService.searchMaterials`, and chapter/material mutations.

- [ ] **Step 1: Write failing Node tests**

```javascript
test('accentless query matches Vietnamese material name', () => {
  assert.equal(matchesCourseSearch('KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf', 'ke hoach giang day'), true)
})

test('maps office extensions to requested labels', () => {
  assert.equal(getMaterialFormat({ extension: '.pptx' }), 'POWERPOINT')
  assert.equal(getMaterialFormat({ extension: '.docx' }), 'WORD')
})
```

- [ ] **Step 2: Verify tests fail**

Run: `cd client && node --test src/courseSearch.test.js`

Expected: module-not-found failure.

- [ ] **Step 3: Implement helpers and API service**

Normalize with NFD, remove combining marks, replace `đ`, lower-case, and collapse whitespace. Build Axios requests with only defined query parameters and pass an optional `AbortSignal` to list/search calls.

- [ ] **Step 4: Add a stable test script and verify**

Set `"test": "node --test src/**/*.test.js src/*.test.js"` in `client/package.json`.

Run: `cd client && npm test`

Expected: all existing and new Node tests pass.

- [ ] **Step 5: Commit the client foundation**

```bash
git add client/src/courseSearch.js client/src/courseSearch.test.js client/src/services/courseService.js client/package.json client/package-lock.json
git commit -m "feat: add course search utilities and api client"
```

### Task 5: Course Catalog, Course Detail, and Chapter Detail UI

**Files:**
- Create: `client/src/components/course/CourseCard.jsx`
- Create: `client/src/components/course/ChapterCard.jsx`
- Create: `client/src/components/course/CourseFilters.jsx`
- Create: `client/src/components/course/MaterialRow.jsx`
- Create: `client/src/pages/CoursesPage.jsx`
- Create: `client/src/pages/CourseDetailPage.jsx`
- Create: `client/src/pages/ChapterDetailPage.jsx`
- Create: `client/src/styles/courses.css`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `courseService` and helpers from Task 4.
- Produces: hash routes `#/mon-hoc`, `#/mon-hoc/:courseId`, and `#/mon-hoc/:courseId/chuong/:chapterId`.
- Reuses: `DirectMediaViewerModal` through `#/view/:fileId`.

- [ ] **Step 1: Add route/parser tests before UI code**

Extend `courseSearch.test.js` with pure `parseCourseRoute` assertions for the three valid route shapes and a null result for invalid nested IDs.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd client && npm test`

Expected: fails because `parseCourseRoute` is not exported.

- [ ] **Step 3: Implement route parser and page components**

Build semantic headings, labeled search inputs, live result counts, loading/error/empty states, Retry buttons, and server-backed filters. Use `useDeferredValue`, `AbortController`, and stable list keys. Material names use CSS ellipsis plus `title` and accessible text; download renders only when `canDownload` is true.

- [ ] **Step 4: Implement responsive and accessible styling**

Create navy/white/blue CSS tokens; 16px body copy; 44px controls; visible `:focus-visible`; one/two/three-column grids; mobile chapter select below 768px; no horizontal overflow; reduced-motion media query. Keep the course header compact enough that search and the first chapter row are visible at 768px desktop height.

- [ ] **Step 5: Wire routes and existing viewer**

Handle course routes before the general portal render in `App.jsx`. Pass `currentUser` where needed, preserve the shared header/navbar/footer, and make browser back navigation work through hash links.

- [ ] **Step 6: Run tests and production build**

Run: `cd client && npm test`

Run: `cd client && npm run build`

Expected: both exit 0.

- [ ] **Step 7: Commit the learner UI**

```bash
git add client/src/components/course client/src/pages/CoursesPage.jsx client/src/pages/CourseDetailPage.jsx client/src/pages/ChapterDetailPage.jsx client/src/styles/courses.css client/src/courseSearch.js client/src/courseSearch.test.js client/src/App.jsx
git commit -m "feat: add responsive course learning flow"
```

### Task 6: Primary Navigation and Legacy Lecture Retirement

**Files:**
- Modify: `client/src/components/layout/Navbar.jsx`
- Modify: `client/src/components/layout/Header.jsx`
- Modify: `client/src/components/layout/Footer.jsx`
- Modify: `client/index.html`
- Modify: `client/src/pages/HomePage.jsx`
- Modify: `client/src/pages/StudentPortalPage.jsx`
- Modify: `client/src/pages/TeacherPortalPage.jsx`
- Modify: `client/src/pages/AcademicPage.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: the three course routes from Task 5.
- Produces: a primary UI with no learner-facing “Bài giảng” navigation or calls to the lecture API.

- [ ] **Step 1: Add a terminology regression check**

Run before changes:

`rg -n "Bài giảng điện tử|Khám phá Bài giảng|Biên Soạn Bài Giảng" client/src/components/layout client/src/pages client/index.html`

Expected: matches show the legacy labels that must be removed from primary reachable pages.

- [ ] **Step 2: Replace primary navigation and portal calls-to-action**

Navbar links to `#/mon-hoc` with label “Môn học”. Homepage and student portal cards link into courses. Teacher/academic areas use “Quản lý môn học”, “Quản lý chương”, and “Tài liệu” language; do not relabel source code identifiers merely for appearance.

- [ ] **Step 3: Remove legacy routes from primary navigation**

Keep old components available for rollback but remove links to `/study/:id`, `/tao-bai-giang`, and lecture cards from learner navigation. Direct legacy hashes may show a migration notice with a link to `#/mon-hoc` rather than silently opening the old flow.

- [ ] **Step 4: Run terminology, tests, and build checks**

Run: `rg -n "Bài giảng điện tử|Khám phá Bài giảng|Biên Soạn Bài Giảng" client/src/components/layout client/src/pages client/index.html`

Expected: no matches in reachable primary copy; historical comments and legacy-only files may remain.

Run: `cd client && npm test && npm run build`

Expected: exit 0.

- [ ] **Step 5: Commit navigation retirement**

```bash
git add client/src/components/layout client/src/pages client/src/App.jsx client/index.html
git commit -m "refactor: make courses the primary learning experience"
```

### Task 7: Full Verification and Visual QA

**Files:**
- Modify only files found defective during verification.

**Interfaces:**
- Verifies all interfaces produced by Tasks 1–6.

- [ ] **Step 1: Run backend verification**

Run: `dotnet test server.CourseTests/server.CourseTests.csproj`

Run: `dotnet build DoAnKhoaHoc.sln`

Expected: zero failed tests and zero build errors.

- [ ] **Step 2: Run frontend verification**

Run: `cd client && npm test`

Run: `cd client && npm run build`

Expected: all tests pass and Vite production build succeeds.

- [ ] **Step 3: Verify migration SQL**

Run: `dotnet ef migrations script --project server/server.csproj --context TrainingDbContext --idempotent --output course-content-migration.sql`

Inspect that the script creates both new tables, transfers data without deleting legacy tables, uses foreign keys/indexes, and is idempotent at migration-history level. Remove the generated review artifact after inspection unless the repository already tracks migration scripts.

- [ ] **Step 4: Run the application and perform responsive QA**

Start backend and Vite using the repository launch scripts. Verify at 375×812, 768×1024, 1024×768, and 1440×900: no horizontal scroll; search/chapter access is immediate; focus rings are visible; every control is at least 44px; long names expose full text; filters and empty/error states remain usable.

- [ ] **Step 5: Verify the acceptance search and three-action flow**

Search `ke hoach giang day` and confirm `KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf` is returned. From `#/mon-hoc`, count exactly: “Xem môn học” → “Xem tài liệu” → “Mở tài liệu”. Confirm download is absent for a non-downloadable file and present for an authorized downloadable file.

- [ ] **Step 6: Run diff hygiene checks and commit fixes**

Run: `git diff --check`

Run: `git status --short`

Commit only verification fixes related to this feature:

If fixes were required, stage only the relevant feature source paths and commit them:

```bash
git add server/Models/Training/CourseEntities.cs server/DTOs/CourseDtos.cs server/Services/VietnameseSearchNormalizer.cs server/Controllers/CoursesController.cs server/Data/TrainingDbContext.cs server/Migrations/Training server.CourseTests client/src/courseSearch.js client/src/courseSearch.test.js client/src/services/courseService.js client/src/components/course client/src/pages/CoursesPage.jsx client/src/pages/CourseDetailPage.jsx client/src/pages/ChapterDetailPage.jsx client/src/styles/courses.css client/src/App.jsx client/src/components/layout client/index.html
git commit -m "fix: complete course content verification"
```
