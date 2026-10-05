// client/tests/documentFormParser.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findMatchingHtmlForPdf } from '../src/utils/documentFormParser.js';

describe('documentFormParser', () => {
  it('reopens downloaded PDF layouts without transforming their geometry', async () => {
    const { parseDocumentForm } = await import('../src/utils/documentFormParser.js');
    const html = '<!doctype html><html data-pdf-fingerprint="100-200-300"><body><div class="pdf-form-page">...</div></body></html>';
    const result = await parseDocumentForm({ name: 'saved.html', text: async () => html });
    assert.strictEqual(result.htmlContent, html);
    assert.strictEqual(result.isPdfLayout, true);
    assert.strictEqual(result.pdfFingerprint, '100-200-300');
  });
  it('findMatchingHtmlForPdf locates catalog match by code or filename', () => {
    const catalog = [
      { id: 'hsan_db_b1', code: 'B1', name: 'Quyết định lập hồ sơ', htmlPath: '/bieumau/html/B1.html' },
      { id: 'hsan_db_b20', code: 'B20', name: 'Kế hoạch điều tra cơ bản', htmlPath: '/bieumau/html/B20.html' }
    ];

    const matchB1 = findMatchingHtmlForPdf('B1.pdf', catalog);
    assert.ok(matchB1, 'Should find match for B1.pdf');
    assert.strictEqual(matchB1.code, 'B1');

    const matchB20 = findMatchingHtmlForPdf('b20.pdf', catalog);
    assert.ok(matchB20, 'Should find match case-insensitively');
    assert.strictEqual(matchB20.code, 'B20');

    const matchNone = findMatchingHtmlForPdf('unknown_file.pdf', catalog);
    assert.strictEqual(matchNone, null, 'Should return null for non-existing');
  });

  it('findMatchingHtmlForPdf matches codes with hyphens flexibly', () => {
    const catalog = [
      { id: 'hsan_ll_bl5a', code: 'BL5-a', name: 'Bản tự nguyện cộng tác', htmlPath: '/bieumau/html/BL5a.html' },
      { id: 'hsan_cn_b19a', code: 'B19-a', name: 'Danh sách đối tượng', htmlPath: '/bieumau/html/B19a.html' },
    ];

    const matchHyphen = findMatchingHtmlForPdf('BL5a.pdf', catalog);
    assert.ok(matchHyphen, 'Should match BL5a.pdf to BL5-a');
    assert.strictEqual(matchHyphen.code, 'BL5-a');

    const matchB19 = findMatchingHtmlForPdf('b19-a.pdf', catalog);
    assert.ok(matchB19, 'Should match b19-a.pdf');
  });

  it('findMatchingHtmlForPdf returns null if catalog item has only PDF (no HTML)', () => {
    const catalog = [
      { id: 'hsan_ll_bl5a', code: 'BL5-a', name: 'Bản tự nguyện', htmlPath: null, pdfPath: '/bieumau/pdf/BL5a.pdf', isHandwritingOnly: true }
    ];

    const match = findMatchingHtmlForPdf('BL5a.pdf', catalog);
    assert.strictEqual(match, null, 'Should return null when no typed HTML version exists');
  });

  it('parseDocumentForm parses HTML documents and transforms dotted lines', async () => {
    const { parseDocumentForm } = await import('../src/utils/documentFormParser.js');
    const mockFile = {
      name: 'Mau_B1.html',
      text: async () => '<html><body><p>Họ và tên: .................... Cấp bậc: ........</p></body></html>'
    };

    const res = await parseDocumentForm(mockFile);
    assert.strictEqual(res.format, 'html');
    assert.strictEqual(res.title, 'Mau_B1');
    assert.ok(res.htmlContent.includes('bm-fill-blank'), 'Dotted lines should be converted to fill blanks');
  });

  it('parseDocumentForm parses Word HTML (.doc) and creates interactive inputs', async () => {
    const { parseDocumentForm } = await import('../src/utils/documentFormParser.js');
    const mockDoc = {
      name: 'Mau_BaoCao.doc',
      text: async () => '<html xmlns:w="urn:schemas-microsoft-com:office:word"><body><p>Kính gửi: ..............................</p></body></html>'
    };

    const res = await parseDocumentForm(mockDoc);
    assert.strictEqual(res.format, 'doc');
    assert.strictEqual(res.title, 'Mau_BaoCao');
    assert.ok(res.htmlContent.includes('bm-fill-blank'), 'Word HTML dotted lines should become bm-fill-blank');
  });

  it('extractTextFromBinaryDoc extracts UTF-16LE lines from binary buffer', async () => {
    const { extractTextFromBinaryDoc } = await import('../src/utils/documentFormParser.js');
    // Tạo chuỗi UTF-16LE giả lập
    const text = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\nBÁO CÁO KẾT QUẢ XÁC MINH';
    const buffer = new ArrayBuffer(text.length * 2);
    const view = new Uint16Array(buffer);
    for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i);
    }

    const extracted = extractTextFromBinaryDoc(buffer);
    assert.ok(extracted.includes('CỘNG HÒA'), 'Should extract Vietnamese UTF-16 string');
    assert.ok(extracted.includes('BÁO CÁO'), 'Should extract all text lines');
  });

  it('parseDocumentForm handles PDF files without throwing', async () => {
    const { parseDocumentForm } = await import('../src/utils/documentFormParser.js');
    const mockPdf = {
      name: 'Don_Khieu_Nai.pdf',
      arrayBuffer: async () => new ArrayBuffer(0)
    };

    const res = await parseDocumentForm(mockPdf);
    assert.strictEqual(res.format, 'pdf');
    assert.strictEqual(res.title, 'Don_Khieu_Nai');
  });
});
