// PDF coordinates remain in points; no text reflow or inferred replacement template.
export function detectPdfBlanks(content, viewport, measure) {
  const candidates = [];
  const [a, b, c, d, e, f] = viewport.transform;
  for (const item of content.items) {
    if (!item.str || !item.width || !item.transform) continue;
    const [ta, tb, tc, td, tx, ty] = item.transform;
    const fontSize = Math.hypot(a * tc + c * td, b * tc + d * td);
    const angle = Math.atan2(b * ta + d * tb, a * ta + c * tb);
    const style = content.styles?.[item.fontName] || {};
    const measuredWidth = measure(item.str, fontSize, style, item.fontName);
    if (!measuredWidth || !fontSize) continue;
    const ratio = item.width * viewport.scale / measuredWidth;
    for (const match of item.str.matchAll(/[.\u2026_](?:[ \u00a0]*[.\u2026_])*/g)) {
      const offset = measure(item.str.slice(0, match.index), fontSize, style, item.fontName) * ratio;
      const width = measure(match[0], fontSize, style, item.fontName) * ratio;
      candidates.push({
        x: a * tx + c * ty + e + Math.cos(angle) * offset,
        baseline: b * tx + d * ty + f + Math.sin(angle) * offset,
        width, fontSize, angle: angle * 180 / Math.PI,
        marks: match[0].replace(/\s/g, '').replace(/\u2026/g, '...').length,
        underscore: match[0].includes('_'),
      });
    }
  }
  // Some generators emit every dot as a separate glyph. Join only adjacent,
  // collinear punctuation, never empty spaces between columns or labels.
  candidates.sort((u, v) => u.angle - v.angle || u.baseline - v.baseline || u.x - v.x);
  const joined = [];
  for (const field of candidates) {
    const previous = joined.at(-1);
    if (previous && Math.abs(previous.angle) < 0.1 && Math.abs(field.angle) < 0.1 &&
        Math.abs(previous.baseline - field.baseline) < 1 &&
        field.x - previous.x - previous.width >= -0.5 &&
        field.x - previous.x - previous.width <= field.fontSize * 0.4) {
      previous.width = field.x + field.width - previous.x;
      previous.marks += field.marks;
    } else joined.push({ ...field });
  }
  return joined.filter(field => field.marks >= 3 && field.width > 1);
}

export function fieldMarkup(field, id) {
  const { x, baseline, width, fontSize, angle = 0 } = field;
  return `<span class="pdf-form-field" data-field-id="${id}" data-baseline="${baseline}" data-font-size="${fontSize}" role="textbox" aria-label="Ô điền ${id}" aria-multiline="true" tabindex="0" contenteditable="plaintext-only" spellcheck="false" style="left:${x}pt;top:${baseline - fontSize}pt;width:${width}pt;height:${fontSize * 1.25}pt;font-size:${fontSize}pt;transform:rotate(${angle}deg);transform-origin:0 ${fontSize}pt"></span>`;
}

export function buildPdfFormHtml(pages, fingerprint = '') {
  const sizes = pages.map((page, i) => `@page pdfPage${i} { size: ${page.width}pt ${page.height}pt; margin: 0; }`).join('\n');
  return `<!doctype html><html lang="vi" data-pdf-fingerprint="${fingerprint}"><head><meta charset="utf-8"><style>
    ${sizes}
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: #64748b; }
    .pdf-form-page { position: relative; margin: 0 auto 16px; overflow: hidden; background: white; break-after: page; }
    .pdf-form-page:last-child { break-after: auto; }
    .pdf-form-background { position: absolute; inset: 0; width: 100%; height: 100%; user-select: none; pointer-events: none; }
    .pdf-form-field { position: absolute; z-index: 1; display: block; padding: 0; margin: 0; border: 0; white-space: pre; overflow: hidden; font-family: 'Times New Roman', serif; line-height: 1.25; color: black; background: transparent; outline: 1px dashed #2563eb; }
    .pdf-form-field[data-mask="true"]::before { content: ''; position: absolute; z-index: -1; left: 0; right: 0; top: var(--mask-top, 62.4%); height: var(--mask-height, 22.4%); background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .pdf-form-field:focus { outline: 2px solid #1d4ed8; background: #dbeafe80; }
    .preview .pdf-form-field { outline: none; }
    @media print {
      body { padding: 0; background: white; }
      .pdf-form-page { margin: 0; zoom: 1 !important; }
      .pdf-form-field, .pdf-form-field:focus { outline: none; background: transparent; }
    }
  </style></head><body>${pages.map((page, index) => `<div class="pdf-form-page" data-page="${index}" style="width:${page.width}pt;height:${page.height}pt;page:pdfPage${index}"><img class="pdf-form-background" alt="Trang ${index + 1} của biểu mẫu PDF" src="${page.image}">${page.fields.map((field, i) => fieldMarkup(field, `${index + 1}-${i + 1}`)).join('')}</div>`).join('')}</body></html>`;
}
