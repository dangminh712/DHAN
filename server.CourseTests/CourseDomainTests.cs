using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Training;
using Server.Services;
using Xunit;

namespace Server.CourseTests;

public class CourseDomainTests
{
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
}
