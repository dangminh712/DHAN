# Learning persistence operations

Use .NET SDK 8.0.424. On this development machine it is installed at `C:\Users\DangMinh\.dotnet`; add that directory to PATH and set DOTNET_ROOT to it.

## Database updates

The web application never creates or migrates schema at startup. It always uses MySQL.

For the existing training database, stop writes and back up first. Run from the repository root:

```powershell
dotnet run --project server.Tools -c Release -- check-baseline
dotnet run --project server.Tools -c Release -- adopt-baseline
dotnet ef database update --project server --context TrainingDbContext --configuration Release
```

Baseline adoption checks expected tables, column names and compatible storage type families; it preserves the existing schema's lengths, defaults, enum definitions and index names. It is not a claim of byte-for-byte schema identity. Do not run the baseline's CREATE TABLE statements against a populated database. New empty databases can apply all migrations normally.

`LearningPersistence` adds `pdf_notes`, `learning_part_progress`, `quiz_attempts` and `watch_history.last_pdf_page`. Existing part-level notes remain in `learning_progress.notes`; they cannot be reliably assigned to a PDF page and are retained as historical data. Existing aggregate progress is retained. New reads use page-scoped notes and structured part progress. One quiz belongs to each lecture; `quiz_id = lecture_id`, with questions in existing `quiz_questions`.

## Backup and restore

Run `server/scripts/Backup-System.ps1 -Destination <new-backup-folder> -MySqlBin <mysql-bin-directory>`. It streams mysqldump output directly to disk and copies the storage tree. Pause uploads/deletes and learning writes during the backup. Protect the backup directory because it contains user data. A failed script leaves an incomplete directory; use a new destination for the next attempt.

Restore into a new database and a new server/storage directory first. Import `database.sql` using the MySQL client's `source /absolute/path/database.sql` command. Copy the backed-up `Storage` tree to the restored server's `Storage` directory. Point the restored app's connection string at the new database, run `dotnet run --project server.Tools -c Release -- integrity`, and verify file sizes, API and Range responses before switching the app to the restored copy. Keep the original database and storage until verification passes. Restoring only one of the two sources is incomplete.

## Log retention and integrity

```powershell
dotnet run --project server.Tools -c Release -- retention-preview 180
dotnet run --project server.Tools -c Release -- retention-apply 180
dotnet run --project server.Tools -c Release -- integrity
```

Retention defaults to 180 days, refuses fewer than 30 days and deletes at most 500 audit rows plus 500 download rows per explicit invocation. Preview and back up before applying. There is no background loop. The integrity command reads file metadata in batches of 100 and checks existence/size, without reading the file payload or recalculating hashes. SHA-256 is already computed at upload.

## Request budget

PDF location saves after two seconds without navigation and on page hide/teardown. Video saves at most every 30 seconds during playback plus pause, completion and page hide. Note writes happen only on add/save/delete. Quiz drafts remain in per-user localStorage until submission; submission IDs make retries idempotent. Errors remain visible and failed saves are retried on a subsequent user action; no polling service runs.
