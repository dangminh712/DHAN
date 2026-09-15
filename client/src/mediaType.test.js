import test from 'node:test';
import assert from 'node:assert/strict';

const media = await import('./mediaType.js').catch(() => ({}));

test('uploaded video metadata never falls back to a document', () => {
  assert.equal(typeof media.getMediaKind, 'function');
  for (const file of [
    { fileType: 'VIDEO' }, { fileType: ' video/mp4; codecs=avc1 ' },
    { fileType: 'MP4' }, { category: 'document', originalName: 'Bài giảng.MP4' },
    { fileType: 'OTHER', originalFileName: 'lecture.webm?version=2' },
  ]) assert.equal(media.getMediaKind(file), 'video');
});

test('MIME, category and filename variants select the correct viewer', () => {
  assert.equal(typeof media.getMediaKind, 'function');
  for (const [file, expected] of [
    [{ contentType: 'application/pdf' }, 'pdf'], [{ fileType: 'DOCUMENT', originalName: 'slide.PDF' }, 'pdf'],
    [{ fileType: 'AUDIO' }, 'audio'], [{ mimeType: 'audio/ogg' }, 'audio'],
    [{ category: 'IMAGE' }, 'image'], [{ originalFileName: 'diagram.JPEG' }, 'image'],
    [{ fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }, 'slide'],
    [{ fileType: 'DOCX' }, 'document'], [{}, 'document'],
  ]) assert.equal(media.getMediaKind(file), expected);
});

test('a video-only lecture has no document or slide fallback', () => {
  assert.equal(typeof media.selectStudyMedia, 'function');
  const video = { fileId: 24, originalName: 'Giang bai.mp4', fileType: 'VIDEO' };
  const result = media.selectStudyMedia([video]);
  assert.equal(result.video, video);
  assert.equal(result.slide, undefined);
  assert.deepEqual(result.documents, []);
});
