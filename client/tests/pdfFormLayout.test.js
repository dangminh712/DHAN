import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPdfBlanks, buildPdfFormHtml } from '../src/utils/pdfFormLayout.js';

const viewport = { width: 600, height: 800, scale: 1, transform: [1, 0, 0, -1, 0, 800] };
const item = (str, x, y, width) => ({ str, width, transform: [12, 0, 0, 12, x, y], fontName: 'f1' });
const measure = text => [...text].reduce((n, c) => n + (c === '.' ? 3 : 6), 0);

test('places multiple blanks at measured offsets without turning labels or column gaps into fields', () => {
  const fields = detectPdfBlanks({ items: [item('Tên: .... Ngày: ....', 40, 700, 96), item('Nhãn', 450, 700, 24)], styles: {} }, viewport, measure);
  assert.equal(fields.length, 2);
  assert.equal(fields[0].x, 70);
  assert.equal(fields[0].width, 12);
  assert.equal(fields[1].x, 124);
  assert.equal(fields[0].baseline, 100);
});

test('joins dot glyphs split into adjacent PDF text items', () => {
  const fields = detectPdfBlanks({ items: [0, 1, 2, 3, 4].map(i => item('.', 40 + i * 3, 700, 3)), styles: {} }, viewport, measure);
  assert.equal(fields.length, 1);
  assert.equal(fields[0].width, 15);
});

test('accounts for crop/rotation through the viewport transform', () => {
  const fields = detectPdfBlanks({ items: [item('....', 40, 700, 12)], styles: {} }, { ...viewport, transform: [0, 1, 1, 0, -20, -10] }, measure);
  assert.equal(fields[0].x, 680);
  assert.equal(fields[0].baseline, 30);
  assert.equal(fields[0].angle, 90);
});

test('retains image-only and blank pages, mixed paper sizes, and fixed field dimensions', () => {
  const html = buildPdfFormHtml([
    { width: 600, height: 800, image: 'data:image/png;base64,abc', fields: [{ x: 50, baseline: 90, width: 100, fontSize: 12, angle: 0 }] },
    { width: 842, height: 595, image: 'data:image/png;base64,def', fields: [] },
  ]);
  assert.equal((html.match(/class="pdf-form-page"/g) || []).length, 2);
  assert.match(html, /size: 842pt 595pt/);
  assert.match(html, /width:100pt/);
  assert.match(html, /contenteditable="plaintext-only"/);
  assert.match(html, /margin: 0/);
  assert.doesNotMatch(html, /bm-fill-blank/);
});
