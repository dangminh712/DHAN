using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Training;
using Server.Services;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Server.Controllers;
using Server.DTOs;

namespace Server.CourseTests;

public class CourseDomainTests
{
    [Fact]
    public async Task Course_totals_and_formats_only_include_active_materials_in_published_chapters()
    {
        var options = new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using var db = new TrainingDbContext(options);
        var level = new ClassificationLevel { Id = 1, Code = "PUBLIC", LevelOrder = 1 };
        var subject = new Subject { Id = 1, Code = "TEST", Name = "Test course", ResponsibleTeacherName = "Verified lecturer", ResponsibilitySource = "Course plan, page 6" };
        var published = new Chapter { Id = 1, Subject = subject, ChapterNumber = 1, Status = "PUBLISHED" };
        var draft = new Chapter { Id = 2, Subject = subject, ChapterNumber = 2, Status = "DRAFT" };
        db.ChapterMaterials.AddRange(
            new ChapterMaterial { Id = 1, Chapter = published, File = new FileRecord { Id = 1, FileType = "PDF", Status = "ACTIVE", ClassificationLevel = level } },
            new ChapterMaterial { Id = 2, Chapter = draft, File = new FileRecord { Id = 2, FileType = "VIDEO", Status = "ACTIVE", ClassificationLevel = level } },
            new ChapterMaterial { Id = 3, Chapter = published, File = new FileRecord { Id = 3, FileType = "IMAGE", Status = "DELETED", ClassificationLevel = level } }
        );
        await db.SaveChangesAsync();
        var controller = new CoursesController(db, new AuditService(db));
        var listResult = Assert.IsType<OkObjectResult>(await controller.GetCourses(null, null));
        var summary = Assert.Single(Assert.IsType<List<CourseSummaryDto>>(listResult.Value));
        Assert.Equal(1, summary.ChapterCount);
        Assert.Equal(1, summary.MaterialCount);
        Assert.Equal(new[] { "PDF" }, summary.Formats);
        var detailResult = Assert.IsType<OkObjectResult>(await controller.GetCourse(1, null));
        var detail = Assert.IsType<CourseDetailDto>(detailResult.Value);
        Assert.Equal(1, detail.MaterialCount);
        Assert.Equal(new[] { "PDF" }, detail.Formats);
        Assert.Equal(detail.MaterialCount, detail.Chapters.Sum(chapter => chapter.MaterialCount));
        Assert.Equal("Verified lecturer", detail.ResponsibleTeacherName);
        Assert.Equal("Course plan, page 6", detail.ResponsibilitySource);
    }

    [Theory]
    [InlineData("KẾ HOẠCH GIẢNG DẠY", "ke hoach giang day")]
    [InlineData("Đề cương môn học", "de cuong mon hoc")]
    public void Search_normalization_ignores_vietnamese_accents_and_case(string input, string expected)
    {
        Assert.Equal(expected, VietnameseSearchNormalizer.Normalize(input));
    }

    [Fact]
    public void Course_model_enforces_unique_chapter_numbers_and_material_links()
    {
        var options = new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase("course-model").Options;
        using var db = new TrainingDbContext(options);
        var chapter = db.Model.FindEntityType(typeof(Chapter))!;
        Assert.Contains(chapter.GetIndexes(), index => index.IsUnique && index.Properties.Select(p => p.Name).SequenceEqual(new[] { "SubjectId", "ChapterNumber" }));
        var material = db.Model.FindEntityType(typeof(ChapterMaterial))!;
        Assert.Contains(material.GetIndexes(), index => index.IsUnique && index.Properties.Select(p => p.Name).SequenceEqual(new[] { "ChapterId", "FileId" }));
    }

    [Fact]
    public void Growing_history_tables_have_sort_indexes_and_chapters_have_a_published_lookup_index()
    {
        var options = new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase("sort-index-model").Options;
        using var db = new TrainingDbContext(options);
        void HasIndex(Type type, params string[] names) => Assert.Contains(db.Model.FindEntityType(type)!.GetIndexes(),
            index => index.Properties.Select(property => property.Name).SequenceEqual(names));
        HasIndex(typeof(AuditLog), "CreatedAt", "Id");
        HasIndex(typeof(SecurityAlert), "CreatedAt", "Id");
        HasIndex(typeof(UserSession), "LastActivityAt", "Id");
        HasIndex(typeof(Chapter), "SubjectId", "Status", "DeletedAt", "DisplayOrder", "ChapterNumber");
    }
    [Fact]
    public void Quality_migration_generates_indexable_status_and_valid_mysql_index_name()
    {
        using var db = new TrainingDbContext(new DbContextOptionsBuilder<TrainingDbContext>()
            .UseMySql("server=localhost;database=unused;user=unused", new MySqlServerVersion(new Version(8, 0, 43))).Options);
        var migration = new Server.Migrations.Training.DbmsQualityAndCourseResponsibility();
        var operations = migration.UpOperations;
        var status = Assert.Single(operations.OfType<Microsoft.EntityFrameworkCore.Migrations.Operations.AlterColumnOperation>());
        Assert.Equal("varchar(32)", status.ColumnType);
        var chapterIndex = Assert.Single(operations.OfType<Microsoft.EntityFrameworkCore.Migrations.Operations.CreateIndexOperation>(), i => i.Table == "chapters");
        Assert.True(chapterIndex.Name.Length <= 64);
        Assert.True(operations.ToList().IndexOf(status) < operations.ToList().IndexOf(chapterIndex));
        var generator = Microsoft.EntityFrameworkCore.Infrastructure.AccessorExtensions.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrationsSqlGenerator>(db);
        var commands = generator.Generate(operations, db.Model);
        Assert.Contains(commands, command => command.CommandText.Contains("IX_chapters_published_order"));
        var snapshot = Microsoft.EntityFrameworkCore.Infrastructure.AccessorExtensions.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrationsAssembly>(db).ModelSnapshot!;
        Assert.Equal(32, snapshot.Model.FindEntityType(typeof(Chapter).FullName!)!.FindProperty("Status")!.GetMaxLength());
    }

}
