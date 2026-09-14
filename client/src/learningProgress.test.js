import test from 'node:test';
import assert from 'node:assert/strict';
import * as pdf from './pdfViewer.js';

test('page navigation cannot cross the actual PDF bounds', () => {
  assert.equal(typeof pdf.clampPdfPage, 'function');
  assert.equal(pdf.clampPdfPage(43, 42), 42);
  assert.equal(pdf.clampPdfPage(-3, 42), 1);
  assert.equal(pdf.clampPdfPage('18', 42), 18);
});

test('jump rejects fractional, empty and out-of-range input', () => {
  assert.equal(typeof pdf.validPdfPage, 'function');
  for (const v of ['', '1.5', '2x', 0, 43]) assert.equal(pdf.validPdfPage(v, 42), false);
  assert.equal(pdf.validPdfPage('42', 42), true);
});
