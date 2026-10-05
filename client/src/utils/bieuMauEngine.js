// client/src/utils/bieuMauEngine.js
// Engine xử lý biểu mẫu nghiệp vụ CAND:
// 1. Tự động biến dấu "...." và ô trống thành ô nhập liệu tương tác
// 2. Lưu trữ / khôi phục nháp từ localStorage trình duyệt
// 3. Đóng gói xuất file Word (.doc) và in ấn A4 chuẩn CAND

export const DRAFT_STORAGE_PREFIX = 'dhan_bm_draft_';

export function getDraftKey(formCode) {
  return `${DRAFT_STORAGE_PREFIX}${formCode}`;
}

// Legacy forms used inline scripts. Keep supported actions as data, never code.
export function cleanFormHtml(html) {
  return html
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(?:meta|base|link|embed)\b[^>]*>/gi, '')
    .replace(/\sonclick\s*=\s*(["'])([\s\S]*?)\1/gi, (attribute, quote, code) => {
      const action = code.match(/\b(add|delete)Row\d*\(\s*(['"])([\w-]+)\2\s*\)/i);
      return action ? ` data-bm-action="${action[1].toLowerCase()}-row" data-bm-table="${action[3]}"` : '';
    })
    .replace(/\son[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|action|formaction)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '');
}

/**
 * Tự động tìm kiếm các chuỗi dấu chấm hoặc ô trống và biến thành ô nhập liệu có thể gõ chữ
 * Đồng thời dọn dẹp các đường dẫn file desktop cũ và nút in ảnh cũ
 */
export function transformDottedToInputs(rawHtml) {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Nếu là toàn bộ trang HTML (có <body>), trích xuất nội dung bên trong body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // 2. Dọn dẹp tất cả các script cũ
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 3. Dọn dẹp các thẻ nút in ảnh cũ (<img class="button_print"...>) và ảnh desktop cũ
  html = html.replace(/<img[^>]*class=["']button_(?:print|save|reload)["'][^>]*>/gi, '');
  html = html.replace(/<img[^>]*onclick=["'][^"']*["'][^>]*>/gi, '');
  html = html.replace(/onclick=["'](?:In_bieu_mau|save)\(\);?["']/gi, '');
  html = html.replace(/onload=["'][^"']*["']/gi, '');

  // 4. Trích xuất các nhãn ghi chú hướng dẫn (<label class="ghichu">...</label>) vào placeholder
  html = html.replace(
    /<span([^>]*)>\s*<label[^>]*class=["']ghichu["'][^>]*>([\s\S]*?)<\/label>\s*<\/span>/gi,
    (match, attrs, noteText) => {
      const cleanNote = noteText.replace(/<[^>]+>/g, '').trim().replace(/"/g, '&quot;');
      return `<span${attrs} data-placeholder="${cleanNote}" title="${cleanNote}"></span>`;
    }
  );

  // 5. Thay thế các thẻ span chứa dấu chấm tĩnh
  // Ví dụ: <span class='bolder o_nhap_1cm font9' style='display:unset'>..........................</span>
  html = html.replace(
    /<span([^>]*)>(\.{3,}|…{2,}|_{4,})<\/span>/gi,
    (match, attrs) => {
      let finalAttrs = attrs;
      if (/class=["']([^"']*)["']/i.test(finalAttrs)) {
        finalAttrs = finalAttrs.replace(/class=["']([^"']*)["']/i, (m, cls) => {
          return cls.includes('bm-fill-blank') ? m : `class="${cls} bm-fill-blank"`;
        });
      } else {
        finalAttrs += ' class="bm-fill-blank"';
      }
      return `<span${finalAttrs} contenteditable="true" data-placeholder="Nhấp để điền..." title="Bấm vào để nhập nội dung"></span>`;
    }
  );

  // 6. Thay thế các chuỗi dấu chấm độc lập nằm trực tiếp trong văn bản (ví dụ "Tôi: ............")
  html = html.replace(
    /(?<=>)([^<]*?)(\.{4,}|…{3,}|_{4,})([^<]*?)(?=<)/g,
    (match, before, dots, after) => {
      return `${before}<span class="bm-fill-blank" contenteditable="true" data-placeholder="Nhấp để điền..." title="Bấm vào để nhập nội dung"></span>${after}`;
    }
  );

  // 7. Chuẩn hóa TẤT CẢ các thẻ có contenteditable hoặc thuộc tính o_nhap_...
  // Đảm bảo có class bm-fill-blank, contenteditable="true" và data-placeholder trực quan
  html = html.replace(/<([a-z0-9]+)([^>]*?(?:contenteditable|o_nhap_)[^>]*)>/gi, (match, tag, attrs) => {
    let newAttrs = attrs;

    // Chuẩn hóa contenteditable="true"
    if (/contenteditable(=["']?[^"'\s>]*["']?)?/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/contenteditable(=["']?[^"'\s>]*["']?)?/i, 'contenteditable="true"');
    } else {
      newAttrs += ' contenteditable="true"';
    }

    // Bổ sung class bm-fill-blank
    if (/class=["']([^"']*)["']/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/class=["']([^"']*)["']/i, (m, cls) => {
        if (!cls.includes('bm-fill-blank')) {
          return `class="${cls} bm-fill-blank"`;
        }
        return m;
      });
    } else {
      newAttrs += ' class="bm-fill-blank"';
    }

    // Bổ sung data-placeholder trực quan nếu chưa có
    if (!/data-placeholder=/i.test(newAttrs)) {
      let ph = 'Nhấp để điền...';
      if (/o_nhap_ngay/i.test(newAttrs)) ph = '..ngày..';
      else if (/o_nhap_thang/i.test(newAttrs)) ph = '..tháng..';
      else if (/o_nhap_nam/i.test(newAttrs)) ph = '..năm..';
      else if (/dia_danh/i.test(newAttrs)) ph = 'Địa danh...';
      else if (/co_quan/i.test(newAttrs)) ph = 'Tên cơ quan / đơn vị...';
      else if (tag === 'div') ph = 'Nhập nội dung bảng...';

      newAttrs += ` data-placeholder="${ph}" title="Bấm vào để nhập nội dung"`;
    }

    return `<${tag}${newAttrs}>`;
  });

  return cleanFormHtml(html);
}

/**
 * Lưu bản nháp biểu mẫu vào localStorage
 */
export function saveFormDraft(formCode, contentHtml) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = getDraftKey(formCode);
    const data = {
      formCode,
      savedAt: new Date().toISOString(),
      html: contentHtml,
    };
    window.localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Không thể lưu nháp vào localStorage:', err);
    return false;
  }
}

/**
 * Lấy bản nháp từ localStorage
 */
export function getFormDraft(formCode) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const key = getDraftKey(formCode);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi khi đọc nháp từ localStorage:', err);
    return null;
  }
}

/**
 * Xóa bản nháp khỏi localStorage
 */
export function clearFormDraft(formCode) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = getDraftKey(formCode);
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Tạo nội dung tài liệu Word MIME XML chuẩn A4 với font Times New Roman
 */
export function createWordDocumentContent(title, bodyContent) {
  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${title || 'Biểu mẫu nghiệp vụ CAND'}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 595.3pt 841.9pt; /* A4 */
  margin: 56.7pt 42.5pt 56.7pt 70.9pt; /* Trên 2cm, Phải 1.5cm, Dưới 2cm, Trái 2.5cm */
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.Section1 { page: Section1; }
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 14pt;
  line-height: 1.35;
  color: #000000;
}
table { border-collapse: collapse; width: 100%; }
td, th { font-family: 'Times New Roman', Times, serif; }
.bm-fill-blank {
  border-bottom: 1px dotted #000;
  display: inline-block;
  min-width: 50px;
}
.border { border: none !important; }
.ghichu, .no-print { display: none !important; }
</style>
</head>
<body>
<div class="Section1">
${bodyContent}
</div>
</body>
</html>`;
}

/**
 * Tải tài liệu dạng file Word (.doc)
 */
export function exportToWord(filename, htmlContent) {
  const fullHtml = createWordDocumentContent(filename, htmlContent);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'BieuMau_CAND'}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Tải file HTML đã điền
 */
export function exportToHtml(filename, htmlContent) {
  const blob = new Blob(['<!DOCTYPE html>\n', htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'BieuMau_CAND'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
