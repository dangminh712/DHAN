using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Training
{
    /// <inheritdoc />
    public partial class LearningPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "last_pdf_page",
                table: "watch_history",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "learning_part_progress",
                columns: table => new
                {
                    id = table.Column<ulong>(type: "bigint unsigned", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    user_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    lecture_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    part_id = table.Column<int>(type: "int", nullable: false),
                    completed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_learning_part_progress", x => x.id);
                    table.ForeignKey(
                        name: "FK_learning_part_progress_lectures_lecture_id",
                        column: x => x.lecture_id,
                        principalTable: "lectures",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_learning_part_progress_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "pdf_notes",
                columns: table => new
                {
                    id = table.Column<ulong>(type: "bigint unsigned", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    user_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    file_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    pdf_page = table.Column<int>(type: "int", nullable: false),
                    content = table.Column<string>(type: "varchar(10000)", maxLength: 10000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pdf_notes", x => x.id);
                    table.ForeignKey(
                        name: "FK_pdf_notes_files_file_id",
                        column: x => x.file_id,
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pdf_notes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "quiz_attempts",
                columns: table => new
                {
                    id = table.Column<ulong>(type: "bigint unsigned", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    submission_id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    user_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    lecture_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    quiz_id = table.Column<ulong>(type: "bigint unsigned", nullable: false),
                    answers_json = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    result_json = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    score = table.Column<int>(type: "int", nullable: false),
                    completed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quiz_attempts", x => x.id);
                    table.ForeignKey(
                        name: "FK_quiz_attempts_lectures_lecture_id",
                        column: x => x.lecture_id,
                        principalTable: "lectures",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_quiz_attempts_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_learning_part_progress_lecture_id",
                table: "learning_part_progress",
                column: "lecture_id");

            migrationBuilder.CreateIndex(
                name: "IX_learning_part_progress_user_id_lecture_id_part_id",
                table: "learning_part_progress",
                columns: new[] { "user_id", "lecture_id", "part_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pdf_notes_file_id",
                table: "pdf_notes",
                column: "file_id");

            migrationBuilder.CreateIndex(
                name: "IX_pdf_notes_user_id_file_id_pdf_page",
                table: "pdf_notes",
                columns: new[] { "user_id", "file_id", "pdf_page" });

            migrationBuilder.CreateIndex(
                name: "IX_quiz_attempts_lecture_id",
                table: "quiz_attempts",
                column: "lecture_id");

            migrationBuilder.CreateIndex(
                name: "IX_quiz_attempts_user_id_lecture_id_submitted_at",
                table: "quiz_attempts",
                columns: new[] { "user_id", "lecture_id", "submitted_at" });

            migrationBuilder.CreateIndex(
                name: "IX_quiz_attempts_user_id_submission_id",
                table: "quiz_attempts",
                columns: new[] { "user_id", "submission_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "learning_part_progress");

            migrationBuilder.DropTable(
                name: "pdf_notes");

            migrationBuilder.DropTable(
                name: "quiz_attempts");

            migrationBuilder.DropColumn(
                name: "last_pdf_page",
                table: "watch_history");
        }
    }
}
