// client/tests/bieuMauEngine.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  transformDottedToInputs,
  createWordDocumentContent,
  getDraftKey,
} from '../src/utils/bieuMauEngine.js';

describe('bieuMauEngine', () => {
  it('replaces legacy table actions and removes event handlers that reference deleted scripts', () => {
    const result = transformDottedToInputs(`<table id="Table3"><tr><td contenteditable onkeyup="copy_ho_ten()"></td></tr></table><input type="button" value="Thêm dòng" onclick="addRow3('Table3')"><input type="button" value="Xóa dòng" onclick="deleteRow3('Table3');sum_to()">`);
    assert.match(result, /data-bm-action="add-row"/);
    assert.match(result, /data-bm-action="delete-row"/);
    assert.match(result, /data-bm-table="Table3"/);
    assert.doesNotMatch(result, /\son(?:click|keyup)=/);
  });
  it('removes document navigation and global styles from uploaded forms', () => {
    const result = transformDottedToInputs('<body><meta http-equiv="refresh" content="0;url=/#/mon-hoc"><base href="/"><style>body{display:none}</style><p contenteditable onfocus="location.hash=1">Nội dung</p></body>');
    assert.doesNotMatch(result, /<(?:meta|base|style)\b|\sonfocus=/);
    assert.match(result, /Nội dung/);
  });
  it('transformDottedToInputs converts dotted lines to interactive editable elements', () => {
    const sampleHtml = '<div>Tôi: ........................................ Cấp bậc: ..........</div>';
    const result = transformDottedToInputs(sampleHtml);
    assert.ok(result.includes('contenteditable="true"'), 'Should contain contenteditable elements');
    assert.ok(!result.includes('........................................'), 'Long dots should be replaced');
  });

  it('transformDottedToInputs cleans up hardcoded C:/ desktop script and image tags', () => {
    const rawHtml = `
      <html>
        <head><script src="C:/BieuMauHSNV/js/timkiem.js"></script></head>
        <body>
          <div>Nội dung biểu mẫu</div>
          <img src="C://BieuMauHSNV/Image/print.png" class="button_print" onclick="In_bieu_mau();">
        </body>
      </html>
    `;
    const result = transformDottedToInputs(rawHtml);
    assert.ok(!result.includes('C:/BieuMauHSNV/js/timkiem.js'), 'Should strip old absolute script tag');
    assert.ok(!result.includes('button_print'), 'Should strip old print button image');
  });

  it('createWordDocumentContent generates valid Word XML MIME document', () => {
    const doc = createWordDocumentContent('Mẫu B1', '<div>Nội dung quyết định</div>');
    assert.ok(doc.includes('urn:schemas-microsoft-com:office:word'), 'Must contain Word XML namespace');
    assert.ok(doc.includes('Times New Roman'), 'Must define Times New Roman typography');
    assert.ok(doc.includes('Nội dung quyết định'), 'Must preserve form body');
  });

  it('getDraftKey returns standard localStorage key', () => {
    assert.strictEqual(getDraftKey('B1'), 'dhan_bm_draft_B1');
    assert.strictEqual(getDraftKey('B20a'), 'dhan_bm_draft_B20a');
  });

  it('transformDottedToInputs extracts ghichu label into data-placeholder and title', () => {
    const rawHtml = `
      <span>Về việc: </span>
      <span class='o_nhap_0_5cm border' contenteditable>
        <label class='ghichu' id='lbl1'>Viết rõ lập hoặc kết thúc hồ sơ nghiệp vụ.</label>
      </span>
    `;
    const result = transformDottedToInputs(rawHtml);
    assert.ok(result.includes('data-placeholder="Viết rõ lập hoặc kết thúc hồ sơ nghiệp vụ."'), 'Must set placeholder from ghichu');
    assert.ok(result.includes('title="Viết rõ lập hoặc kết thúc hồ sơ nghiệp vụ."'), 'Must set title from ghichu');
    assert.ok(!result.includes('<label class=\'ghichu\''), 'Must remove inner label element to keep field empty');
  });

  it('transformDottedToInputs normalizes boolean contenteditable to contenteditable="true" and adds bm-fill-blank', () => {
    const rawHtml = `<span class='o_nhap_ngay border' contenteditable></span>`;
    const result = transformDottedToInputs(rawHtml);
    assert.ok(result.includes('contenteditable="true"'), 'Should set contenteditable="true"');
    assert.ok(result.includes('bm-fill-blank'), 'Should include bm-fill-blank class');
    assert.ok(result.includes('data-placeholder="..ngày.."'), 'Should set date placeholder');
  });

  it('transformDottedToInputs extracts body content if full HTML document provided', () => {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body class="font14 ta_jus">
          <div class="content">Nội dung mẫu</div>
        </body>
      </html>
    `;
    const result = transformDottedToInputs(fullHtml);
    assert.ok(!result.includes('<!DOCTYPE'), 'Should not contain doctype');
    assert.ok(!result.includes('<head>'), 'Should not contain head');
    assert.ok(result.includes('Nội dung mẫu'), 'Should preserve inner body content');
  });
});
