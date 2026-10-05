using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Server.Data;

namespace Server.Migrations.Training;

[DbContext(typeof(TrainingDbContext))]
[Migration("20261004000000_DbmsQualityAndCourseResponsibility")]
public class DbmsQualityAndCourseResponsibility : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>("responsible_teacher_name", "subjects", type: "varchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<string>("responsibility_source", "subjects", type: "varchar(1000)", maxLength: 1000, nullable: true);
        migrationBuilder.CreateIndex("IX_audit_logs_created_at_id", "audit_logs", new[] { "created_at", "id" });
        migrationBuilder.CreateIndex("IX_security_alerts_created_at_id", "security_alerts", new[] { "created_at", "id" });
        migrationBuilder.CreateIndex("IX_user_sessions_last_activity_at_id", "user_sessions", new[] { "last_activity_at", "id" });
        migrationBuilder.AlterColumn<string>("status", "chapters", type: "varchar(32)", maxLength: 32, nullable: false, oldClrType: typeof(string), oldType: "longtext");
        migrationBuilder.CreateIndex("IX_chapters_published_order", "chapters", new[] { "subject_id", "status", "deleted_at", "display_order", "chapter_number" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("IX_chapters_published_order", "chapters");
        migrationBuilder.DropIndex("IX_user_sessions_last_activity_at_id", "user_sessions");
        migrationBuilder.DropIndex("IX_security_alerts_created_at_id", "security_alerts");
        migrationBuilder.DropIndex("IX_audit_logs_created_at_id", "audit_logs");
        migrationBuilder.DropColumn("responsibility_source", "subjects");
        migrationBuilder.DropColumn("responsible_teacher_name", "subjects");
    }
}
