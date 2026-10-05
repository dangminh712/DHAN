import React, { useEffect, useRef, useState } from 'react';
import { Printer, Download, Plus, X, Eye, RotateCcw } from 'lucide-react';
import { fieldMarkup } from '../../utils/pdfFormLayout';
import { printFormDocument } from '../../utils/formEditorDom';
import FormModalShell from './FormModalShell';

export default function PdfFormEditorModal({ formItem, onClose }) {
  const frameRef = useRef(null);
  const dialogRef = useRef(null);
  const addRef = useRef(false);
  const cleanupRef = useRef(() => {});
  const selectedRef = useRef(null);
  const [status, setStatus] = useState('');
  const [count, setCount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fieldWidth, setFieldWidth] = useState(140);
  const [fontSize, setFontSize] = useState(12);
  const [mask, setMask] = useState(false);
  const storageKey = `dhan_pdf_form_v1_${formItem.pdfFingerprint}`;
  const doc = () => frameRef.current?.contentDocument;

  function fitField(field) {
    let size = Number(field.dataset.fontSize) || 12;
    const multiline = /\n/.test(field.textContent);
    field.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';
    field.style.fontSize = `${size}pt`;
    while (!multiline && field.scrollWidth > field.clientWidth + 1 && size > 6) {
      size -= 0.25;
      field.style.fontSize = `${size}pt`;
    }
    field.style.top = `${Number(field.dataset.baseline) - size}pt`;
    field.style.height = `${size * 1.25}pt`;
    if (multiline) {
      const available = parseFloat(field.parentElement.style.height) - parseFloat(field.style.top);
      field.style.height = `${Math.min(available, Math.max(size * 1.25, field.scrollHeight * 0.75))}pt`;
    }
    field.style.setProperty('--mask-top', `${size * 0.78}pt`);
    field.style.setProperty('--mask-height', `${size * 0.28}pt`);
    field.style.transformOrigin = `0 ${size}pt`;
    field.dataset.overflow = String(field.scrollWidth > field.clientWidth + 1 || field.scrollHeight > field.clientHeight + 1);
  }

  function save() {
    const fields = [...(doc()?.querySelectorAll('.pdf-form-field') || [])];
    fields.forEach(fitField);
    setCount(fields.length);
    try {
      // Save values/geometry only. Page images never consume localStorage quota.
      const values = fields.map(field => ({ id: field.dataset.fieldId,
        page: field.parentElement.dataset.page, text: field.textContent,
        style: field.getAttribute('style'), fontSize: field.dataset.fontSize, baseline: field.dataset.baseline, mask: field.dataset.mask,
      }));
      localStorage.setItem(storageKey, JSON.stringify(values));
      setStatus(fields.some(field => field.dataset.overflow === 'true')
        ? 'Có ô quá dài. Hãy rút gọn nội dung hoặc tăng chiều rộng ô trước khi in.' : 'Đã lưu nội dung trên trình duyệt');
    } catch {
      setStatus('Không lưu được trên trình duyệt. Hãy tải bản điền để giữ nội dung.');
    }
  }

  async function print() {
    const document = doc();
    if (!document) return;
    save();
    if (document.querySelector('[data-overflow="true"]')) return;
    try { await printFormDocument(`<!doctype html>${document.documentElement.outerHTML}`); }
    catch (error) { setStatus(error.message); }
  }

  function onLoad() {
    cleanupRef.current();
    const document = doc();
    if (!document) return;
    try {
      const saved = formItem.fromSavedLayout ? [] : JSON.parse(localStorage.getItem(storageKey) || '[]');
      for (const value of saved) {
        const page = [...document.querySelectorAll('.pdf-form-page')].find(p => p.dataset.page === value.page);
        if (!page) continue;
        let field = [...page.querySelectorAll('.pdf-form-field')].find(f => f.dataset.fieldId === value.id);
        if (!field && /^manual-\d+$/.test(value.id)) {
          page.insertAdjacentHTML('beforeend', fieldMarkup({ x: 0, baseline: 20, width: 140, fontSize: 12 }, value.id));
          field = page.lastElementChild;
        }
        if (field) {
          field.textContent = value.text;
          field.setAttribute('style', value.style);
          field.dataset.fontSize = value.fontSize;
          field.dataset.baseline = value.baseline;
          field.dataset.mask = value.mask || 'false';
          fitField(field);
        }
      }
      if (saved.length) setStatus('Đã khôi phục nội dung đã điền');
    } catch { setStatus('Không thể khôi phục bản nháp'); }
    const fields = document.querySelectorAll('.pdf-form-field');
    setCount(fields.length);
    if (!fields.length) setStatus('Chưa nhận diện được dấu chấm. Dùng “Thêm ô điền”, rồi bấm vào vị trí cần gõ trên trang.');
    const click = event => {
      const field = event.target.closest('.pdf-form-field');
      if (field) {
        selectedRef.current = field;
        setFieldWidth(Math.round(parseFloat(field.style.width)));
        setFontSize(Number(field.dataset.fontSize));
        setMask(field.dataset.mask === 'true');
        return;
      }
      const page = event.target.closest('.pdf-form-page');
      if (!addRef.current || !page) return;
      const rect = page.getBoundingClientRect();
      const pageWidth = parseFloat(page.style.width);
      const pageHeight = parseFloat(page.style.height);
      const x = Math.max(0, Math.min(pageWidth - 20, (event.clientX - rect.left) / rect.width * pageWidth));
      const baseline = Math.max(12, Math.min(pageHeight - 3, (event.clientY - rect.top) / rect.height * pageHeight));
      page.insertAdjacentHTML('beforeend', fieldMarkup({ x, baseline, width: Math.min(140, pageWidth - x), fontSize: 12 }, `manual-${Date.now()}`));
      const added = page.lastElementChild;
      added.dataset.mask = 'true';
      selectedRef.current = added;
      added.focus();
      addRef.current = false;
      setAdding(false);
      save();
    };
    const keydown = event => {
      if (event.key === 'Tab') {
        const inputs = [...document.querySelectorAll('.pdf-form-field')];
        if ((!event.shiftKey && event.target === inputs.at(-1)) || (event.shiftKey && event.target === inputs[0])) {
          event.preventDefault();
          const controls = [...dialogRef.current.querySelectorAll('button, input, select')];
          (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
          return;
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault(); print();
      } else if (event.key === 'Escape') onClose();
      else if (event.key === 'Enter' && event.target.matches('.pdf-form-field') && !event.isComposing) {
        event.preventDefault();
        document.execCommand('insertText', false, '\n');
      }
    };
    const focus = event => {
      if (event.target.matches('.pdf-form-field')) click(event);
    };
    const paste = event => {
      if (!event.target.matches('.pdf-form-field')) return;
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n'));
    };
    document.addEventListener('input', save);
    document.addEventListener('click', click);
    document.addEventListener('focusin', focus);
    document.addEventListener('keydown', keydown);
    document.addEventListener('paste', paste);
    cleanupRef.current = () => {
      document.removeEventListener('input', save);
      document.removeEventListener('click', click);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('paste', paste);
    };
    fields[0]?.focus();
  }

  useEffect(() => {
    dialogRef.current?.focus();
    const keydown = event => {
      if (event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        print();
      } else if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
      cleanupRef.current();
    };
  }, [formItem]);

  function download() {
    save();
    const copy = doc().documentElement.cloneNode(true);
    copy.querySelector('body').style.zoom = '';
    copy.querySelector('body').classList.remove('preview');
    copy.querySelectorAll('.pdf-form-page').forEach(page => { page.style.zoom = ''; });
    const url = URL.createObjectURL(new Blob(['<!doctype html>', copy.outerHTML], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formItem.name.replace(/\.pdf$/i, '')}_ban_dien.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <FormModalShell><div className="bm-modal-overlay pdf-editor-modal" role="dialog" aria-modal="true" aria-label="Bản đánh máy giữ bố cục PDF" tabIndex={-1} ref={dialogRef}
    onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = [...dialogRef.current.querySelectorAll('button, input, select')];
        if ((!event.shiftKey && event.target === controls.at(-1)) || (event.shiftKey && event.target === controls[0])) {
          event.preventDefault();
          const inputs = [...(doc()?.querySelectorAll('.pdf-form-field') || [])];
          (event.shiftKey ? inputs.at(-1) : inputs[0])?.focus();
          if (!inputs.length) (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
        }
      }
      if (event.key === 'Escape') onClose();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') { event.preventDefault(); print(); }
    }}>
    <div className="bm-top-toolbar">
      <div className="bm-toolbar-title"><span className="bm-badge-code">PDF</span><span className="bm-title-text">{formItem.name}</span><span>{count} ô điền</span></div>
      <div className="bm-toolbar-actions">
        <button className="bm-btn bm-btn-secondary" aria-pressed={adding} onClick={() => { addRef.current = !adding; setAdding(!adding); }}><Plus size={16} />{adding ? 'Bấm vị trí trên trang' : 'Thêm ô điền'}</button>
        <button className="bm-btn bm-btn-secondary" aria-pressed={preview} onClick={() => { doc()?.body.classList.toggle('preview', !preview); setPreview(!preview); }}><Eye size={16} />Xem bản in</button>
        <button className="bm-btn bm-btn-print" onClick={print}><Printer size={16} />In / Lưu PDF</button>
        <button className="bm-btn bm-btn-secondary" onClick={download}><Download size={16} />Tải bản điền</button>
        <button className="bm-btn bm-btn-close" onClick={onClose} aria-label="Đóng bản đánh máy"><X size={22} /></button>
      </div>
    </div>
    <div className="pdf-editor-options">
      <label>Thu phóng <select value={zoom} onChange={event => {
        const value = Number(event.target.value); setZoom(value);
        doc()?.querySelectorAll('.pdf-form-page').forEach(page => { page.style.zoom = `${value}%`; });
      }}>{[50, 70, 85, 100, 125, 150].map(value => <option key={value} value={value}>{value}%</option>)}</select></label>
      <label>Rộng ô (pt) <input type="number" min="10" max="1000" value={fieldWidth} onChange={event => {
        const value = Number(event.target.value); setFieldWidth(value);
        const field = selectedRef.current;
        if (field && value >= 10) {
          const max = parseFloat(field.parentElement.style.width) - parseFloat(field.style.left);
          field.style.width = `${Math.min(value, max)}pt`; save();
        }
      }} /></label>
      <label>Cỡ chữ <input type="number" min="6" max="36" value={fontSize} onChange={event => {
        const value = Number(event.target.value); setFontSize(value);
        const field = selectedRef.current;
        if (field && value >= 6 && value <= 36) { field.dataset.fontSize = String(value); save(); }
      }} /></label>
      <button className="pdf-editor-clear" onClick={() => {
        const field = selectedRef.current;
        if (field) {
          if (field.dataset.fieldId.startsWith('manual-')) { field.remove(); selectedRef.current = null; }
          else field.textContent = '';
          save();
        }
      }}><RotateCcw size={14} />Xóa ô đang chọn</button>
      <label><input type="checkbox" checked={mask} onChange={event => {
        setMask(event.target.checked);
        if (selectedRef.current) { selectedRef.current.dataset.mask = String(event.target.checked); save(); }
      }} />Che dấu chấm dưới ô</label>
      <span role="status">{status || 'Bấm vào ô để điền, Enter để xuống dòng, Tab để chuyển ô. Bố cục trang giữ cố định.'}</span>
    </div>
    <iframe ref={frameRef} title="Trang PDF để điền thông tin" className="pdf-editor-frame" sandbox="allow-same-origin allow-modals" srcDoc={formItem.customHtml} onLoad={onLoad} />
  </div></FormModalShell>;
}
