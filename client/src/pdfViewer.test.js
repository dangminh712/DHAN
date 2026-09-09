import test from 'node:test';
import assert from 'node:assert/strict';

let viewer;
try {
  viewer = await import('./pdfViewer.js');
} catch {
  viewer = {};
}

test('ghi chú được tách riêng theo tài liệu và số trang hợp lệ', () => {
  assert.equal(typeof viewer.createPdfNoteKey, 'function');
  assert.equal(viewer.createPdfNoteKey(18, 3), 'dhan:pdf-note:18:page:3');
  assert.equal(viewer.createPdfNoteKey(18, 0), 'dhan:pdf-note:18:page:1');
});

test('số trang nhập vào luôn được chuẩn hóa thành số nguyên dương', () => {
  assert.equal(typeof viewer.normalizePdfPage, 'function');
  assert.equal(viewer.normalizePdfPage('7.8'), 7);
  assert.equal(viewer.normalizePdfPage('-4'), 1);
  assert.equal(viewer.normalizePdfPage('không hợp lệ'), 1);
});

test('đường dẫn PDF chứa trang cần mở còn video giữ nguyên đường dẫn stream', () => {
  assert.equal(typeof viewer.createMediaViewerUrl, 'function');
  assert.equal(
    viewer.createMediaViewerUrl(24, 'document', 6),
    '/api/media/stream/24#page=6&zoom=page-width&toolbar=0&navpanes=0&scrollbar=0'
  );
  assert.equal(viewer.createMediaViewerUrl(24, 'video', 6), '/api/media/stream/24');
});
