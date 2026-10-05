// client/src/utils/documentFormParser.js
// Xử lý đọc và chuyển đổi biểu mẫu khi nguồn tài liệu là DOC, DOCX hoặc PDF

import mammoth from 'mammoth';
import { transformDottedToInputs } from './bieuMauEngine.js';
import { detectPdfBlanks, buildPdfFormHtml } from './pdfFormLayout.js';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Render the original pages and place fixed inputs only over detected leaders. */
export async function convertPdfToEditableHtml(source, onProgress = () => {}) {
  const buffer = source instanceof ArrayBuffer ? source : await source.arrayBuffer();
  // Full-file identity also works on HTTP intranets without SubtleCrypto.
  let hashA = 2166136261;
  let hashB = 5381;
  for (const byte of new Uint8Array(buffer)) {
    hashA = Math.imul(hashA ^ byte, 16777619);
    hashB = Math.imul(hashB, 33) ^ byte;
  }
  const fingerprint = `${buffer.byteLength}-${hashA >>> 0}-${hashB >>> 0}`;
  // Lazy imports keep Word/catalog parsing independent of the PDF worker.
  const [{ getDocument, GlobalWorkerOptions }, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = workerUrl;
  const task = getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const pages = [];
  try {
    const pdf = await task.promise;
    for (let n = 1; n <= pdf.numPages; n++) {
      onProgress(n, pdf.numPages);
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 1 });
      // 216 dpi background, bounded for unusually large pages.
      const scale = Math.min(3, Math.sqrt(16000000 / (viewport.width * viewport.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * scale);
      canvas.height = Math.ceil(viewport.height * scale);
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: page.getViewport({ scale }) }).promise;
      const content = await page.getTextContent();
      const measure = (text, size, style, fontName) => {
        // Use the actual PDF font loaded by rendering whenever available.
        const font = page.commonObjs.has(fontName) ? page.commonObjs.get(fontName) : null;
        context.font = `${size}px "${font?.loadedName || style.fontFamily || 'Times New Roman'}"`;
        return context.measureText(text).width;
      };
      const fields = detectPdfBlanks(content, viewport, measure);
      for (const field of fields) {
        // Erase only the leader strip, leaving the surrounding labels/borders intact.
        context.save();
        context.scale(scale, scale);
        context.translate(field.x, field.baseline);
        context.rotate(field.angle * Math.PI / 180);
        context.fillStyle = '#ffffff';
        const top = field.underscore ? 0 : -field.fontSize * 0.22;
        context.fillRect(0, top, field.width, field.fontSize * 0.28);
        context.restore();
      }
      pages.push({ width: viewport.width, height: viewport.height, image: canvas.toDataURL('image/png'), fields });
      canvas.width = canvas.height = 0;
      page.cleanup();
    }
    return buildPdfFormHtml(pages, fingerprint);
  } finally {
    await task.destroy();
  }
}

/** Extract UTF-16 text from legacy binary Word files. */
export function extractTextFromBinaryDoc(arrayBuffer) {
  if (!arrayBuffer) return '';
  const bytes = new Uint8Array(arrayBuffer);
  const chars = [];

  // Quét luồng ký tự UTF-16LE 2-byte
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (code === 10 || code === 13) {
      if (chars.length > 0 && chars[chars.length - 1] !== '\n') {
        chars.push('\n');
      }
    } else if ((code >= 32 && code <= 126) || (code >= 0x00A0 && code <= 0x1EF9)) {
      chars.push(String.fromCharCode(code));
    } else if (chars.length > 0 && chars[chars.length - 1] !== '\n') {
      chars.push('\n');
    }
  }

  const utf16Lines = chars
    .join('')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length >= 3);

  if (utf16Lines.length >= 3) {
    return utf16Lines.join('\n');
  }

  // Quét dự phòng theo chuỗi ký tự ANSI 8-bit
  const asciiChars = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10 || b === 13) {
      if (asciiChars.length > 0 && asciiChars[asciiChars.length - 1] !== '\n') {
        asciiChars.push('\n');
      }
    } else if (b >= 32 && b <= 126) {
      asciiChars.push(String.fromCharCode(b));
    } else if (asciiChars.length > 0 && asciiChars[asciiChars.length - 1] !== '\n') {
      asciiChars.push('\n');
    }
  }

  return asciiChars
    .join('')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length >= 3)
    .join('\n');
}

/**
 * Phân tích tệp DOC/DOCX, HTML hoặc PDF được kéo thả/tải lên
 * @param {File|Blob} file 
 * @returns {Promise<{ title: string, htmlContent?: string, format: 'doc'|'pdf'|'html', fileUrl?: string }>}
 */
export async function parseDocumentForm(file) {
  if (!file) throw new Error('Không có tệp tin được cung cấp');

  const name = file.name || 'Bieu_mau';
  const ext = name.split('.').pop().toLowerCase();

  // 1. Xử lý tệp HTML / HTM
  if (ext === 'html' || ext === 'htm') {
    const rawText = await file.text();
    const fingerprint = rawText.match(/<html\b[^>]*data-pdf-fingerprint="(\d+-\d+-\d+)"/i)?.[1];
    if (fingerprint && rawText.includes('class="pdf-form-page"')) {
      return { title: name.replace(/\.[^/.]+$/, ''), htmlContent: rawText,
        format: 'html', isPdfLayout: true, pdfFingerprint: fingerprint, fromSavedLayout: true };
    }
    const transformed = transformDottedToInputs(rawText);
    return {
      title: name.replace(/\.[^/.]+$/, ''),
      htmlContent: transformed,
      format: 'html'
    };
  }

  // 2. Xử lý tệp DOC hoặc DOCX
  if (ext === 'doc' || ext === 'docx') {
    // 2a. Thử chuyển đổi bằng mammoth (chuẩn cho .docx OpenXML)
    try {
      if (typeof file.arrayBuffer === 'function') {
        const arrayBuffer = await file.arrayBuffer();
        const convertToHtml = mammoth.convertToHtml || mammoth.default?.convertToHtml;
        if (convertToHtml) {
          const result = await convertToHtml({ arrayBuffer });
          if (result && result.value && result.value.trim().length > 10) {
            const wrappedHtml = `
              <div class="wrapper border font14 ta_jus" style="font-family: 'Times New Roman', serif; line-height: 1.5;">
                ${result.value}
              </div>
            `;
            const transformed = transformDottedToInputs(wrappedHtml);
            return {
              title: name.replace(/\.[^/.]+$/, ''),
              htmlContent: transformed,
              format: 'doc'
            };
          }
        }
      }
    } catch (docxErr) {
      console.warn('Mammoth conversion note (trying fallback):', docxErr?.message);
    }

    // 2b. Kiểm tra nếu là tệp Word HTML MIME / Web page (.doc tạo bởi MS Word)
    if (typeof file.text === 'function') {
      try {
        const rawText = await file.text();
        if (rawText.includes('<html') || rawText.includes('<body') || rawText.includes('xmlns:w=') || rawText.includes('mso-')) {
          const transformed = transformDottedToInputs(rawText);
          return {
            title: name.replace(/\.[^/.]+$/, ''),
            htmlContent: transformed,
            format: 'doc'
          };
        }
      } catch {
        // Tiếp tục phương án nhị phân
      }
    }

    // 2c. Nếu là tệp Word nhị phân cũ (.doc OLE2 Compound File), trích xuất văn bản thực tế
    if (typeof file.arrayBuffer === 'function') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = extractTextFromBinaryDoc(arrayBuffer);
        if (extractedText && extractedText.trim().length > 0) {
          const lines = extractedText.split(/\n+/).filter(line => line.trim());
          const wrappedHtml = `
            <div class="wrapper border font14 ta_jus" style="font-family: 'Times New Roman', serif; line-height: 1.6;">
              <h2 style="text-align: center; text-transform: uppercase; font-size: 15pt; margin-bottom: 20px;">
                ${escapeHtml(name.replace(/\.[^/.]+$/, ''))}
              </h2>
              ${lines.map(line => `<p style="margin-bottom: 10px;">${escapeHtml(line)}</p>`).join('')}
            </div>
          `;
          const transformed = transformDottedToInputs(wrappedHtml);
          return {
            title: name.replace(/\.[^/.]+$/, ''),
            htmlContent: transformed,
            format: 'doc'
          };
        }
      } catch (binErr) {
        console.warn('Binary doc parse note:', binErr?.message);
      }
    }

    // 2d. Khung biểu mẫu dự phòng có thể điền thông tin nếu tệp rỗng hoặc không trích xuất được
    return {
      title: name.replace(/\.[^/.]+$/, ''),
      htmlContent: `
        <div class="wrapper border font14 ta_jus" style="font-family: 'Times New Roman', serif; line-height: 1.5;">
          <h2 style="text-align: center; text-transform: uppercase; font-size: 16pt;">BIỂU MẪU NGHIỆP VỤ CAND (TỆP WORD)</h2>
          <p style="text-align: center; font-style: italic; margin-bottom: 20px;">Tệp tải lên: ${escapeHtml(name)}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #94a3b8;" />
          <div style="margin-bottom: 16px;">
            <strong>Cơ quan/Đơn vị:</strong> <span class="bm-fill-blank" contenteditable="true" data-placeholder="Nhập tên cơ quan..."></span>
          </div>
          <div style="margin-bottom: 16px;">
            <strong>Cán bộ thụ lý:</strong> <span class="bm-fill-blank" contenteditable="true" data-placeholder="Nhập họ và tên..."></span>
          </div>
          <div style="margin-bottom: 16px;">
            <strong>Nội dung nghiệp vụ:</strong>
            <div class="bm-fill-blank" contenteditable="true" style="min-height: 140px; display: block; border: 1px dashed #94a3b8; padding: 12px; margin-top: 8px;" data-placeholder="Nhập chi tiết nội dung biểu mẫu tại đây..."></div>
          </div>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <strong>CÁN BỘ ĐỀ XUẤT</strong><br/><em>(Ký, ghi rõ họ tên)</em>
            </div>
            <div style="text-align: center; width: 45%;">
              <strong>CHỈ HUY PHÊ DUYỆT</strong><br/><em>(Ký, đóng dấu)</em>
            </div>
          </div>
        </div>
      `,
      format: 'doc'
    };
  }

  // 3. Xử lý tệp PDF
  if (ext === 'pdf') {
    let fileUrl = '';
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        fileUrl = URL.createObjectURL(file);
      }
    } catch {
      fileUrl = '';
    }

    return {
      title: name.replace(/\.[^/.]+$/, ''),
      format: 'pdf',
      fileUrl
    };
  }

  throw new Error(`Định dạng tệp .${ext} chưa được hỗ trợ. Vui lòng chọn tệp Word (.doc, .docx), PDF (.pdf) hoặc HTML (.html, .htm)`);
}

/**
 * Tìm mã biểu mẫu tương ứng để chuyển đổi giữa PDF và HTML trong kho biểu mẫu CAND
 * @param {string} pdfFilename 
 * @param {Array} catalog 
 * @returns {object|null}
 */
export function findMatchingHtmlForPdf(pdfFilename, catalog = []) {
  if (!pdfFilename) return null;
  const base = pdfFilename.replace(/\.pdf$/i, '').trim().toLowerCase();
  const cleanBase = base.replace(/[-_\s]/g, '');

  return catalog.find(item => {
    if (!item.htmlPath) return false;
    const itemCode = (item.code || '').toLowerCase();
    const cleanItemCode = itemCode.replace(/[-_\s]/g, '');
    const itemId = (item.id || '').toLowerCase();

    return (
      itemCode === base ||
      cleanItemCode === cleanBase ||
      itemId === base ||
      itemId.endsWith('_' + cleanBase)
    );
  }) || null;
}
