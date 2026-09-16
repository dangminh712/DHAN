using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Server.Data;

#nullable disable

namespace Server.Migrations.Training;

[DbContext(typeof(TrainingDbContext))]
[Migration("20260916000000_CourseContentArchitecture")]
public partial class CourseContentArchitecture : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "chapters",
            columns: table => new
            {
                id = table.Column<ulong>(type: "bigint unsigned", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                subject_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                chapter_number = table.Column<int>(type: "int", nullable: false),
                title = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                description = table.Column<string>(type: "text", nullable: true),
                display_order = table.Column<int>(type: "int", nullable: false),
                status = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false, defaultValue: "PUBLISHED"),
                created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                deleted_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_chapters", x => x.id);
                table.ForeignKey("FK_chapters_subjects_subject_id", x => x.subject_id, "subjects", "id", onDelete: ReferentialAction.Cascade);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateTable(
            name: "chapter_materials",
            columns: table => new
            {
                id = table.Column<ulong>(type: "bigint unsigned", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                chapter_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                file_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                material_group = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false, defaultValue: "OTHER"),
                display_order = table.Column<int>(type: "int", nullable: false),
                is_visible = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                is_downloadable = table.Column<bool>(type: "tinyint(1)", nullable: false),
                is_printable = table.Column<bool>(type: "tinyint(1)", nullable: false),
                created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_chapter_materials", x => x.id);
                table.ForeignKey("FK_chapter_materials_chapters_chapter_id", x => x.chapter_id, "chapters", "id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_chapter_materials_files_file_id", x => x.file_id, "files", "id", onDelete: ReferentialAction.Restrict);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex("IX_chapters_subject_id_chapter_number", "chapters", new[] { "subject_id", "chapter_number" }, unique: true);
        migrationBuilder.CreateIndex("IX_chapters_subject_id_display_order", "chapters", new[] { "subject_id", "display_order" });
        migrationBuilder.CreateIndex("IX_chapter_materials_chapter_id_file_id", "chapter_materials", new[] { "chapter_id", "file_id" }, unique: true);
        migrationBuilder.CreateIndex("IX_chapter_materials_chapter_id_display_order", "chapter_materials", new[] { "chapter_id", "display_order" });
        migrationBuilder.CreateIndex("IX_chapter_materials_file_id", "chapter_materials", "file_id");

        migrationBuilder.Sql(@"
            INSERT INTO chapters (subject_id, chapter_number, title, description, display_order, status, created_at, updated_at)
            SELECT l.subject_id,
                   ROW_NUMBER() OVER (PARTITION BY l.subject_id ORDER BY l.created_at, l.id),
                   l.title, l.description,
                   ROW_NUMBER() OVER (PARTITION BY l.subject_id ORDER BY l.created_at, l.id),
                   CASE WHEN l.status IN ('PUBLISHED', 'CLOSED') THEN 'PUBLISHED' ELSE 'DRAFT' END,
                   l.created_at, l.updated_at
            FROM lectures l
            WHERE l.deleted_at IS NULL;

            INSERT IGNORE INTO chapter_materials
                (chapter_id, file_id, material_group, display_order, is_visible, is_downloadable, is_printable, created_at, updated_at)
            SELECT c.id, lf.file_id,
                   CASE
                     WHEN LOWER(f.original_name) LIKE '%giao an%' THEN 'LESSON_PLAN'
                     WHEN LOWER(f.original_name) LIKE '%bai tap%' THEN 'EXERCISE'
                     WHEN LOWER(f.original_name) LIKE '%dap an%' OR LOWER(f.original_name) LIKE '%cau hoi%' THEN 'QA'
                     WHEN LOWER(f.original_name) LIKE '%tham khao%' THEN 'REFERENCE'
                     ELSE 'LECTURE'
                   END,
                   lf.display_order, lf.is_visible, lf.is_downloadable, lf.is_printable, lf.created_at, lf.updated_at
            FROM lecture_files lf
            JOIN lectures l ON l.id = lf.lecture_id
            JOIN chapters c ON c.subject_id = l.subject_id AND c.title = l.title
            JOIN files f ON f.id = lf.file_id;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "chapter_materials");
        migrationBuilder.DropTable(name: "chapters");
    }
}
