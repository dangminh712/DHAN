export function serializeForm(root) {
  const copy = root.cloneNode(true);
  const originalControls = root.querySelectorAll('input, select, textarea');
  copy.querySelectorAll('input, select, textarea').forEach((control, i) => {
    const original = originalControls[i];
    if (control.tagName === 'SELECT') [...control.options].forEach((option, j) => option.toggleAttribute('selected', original.options[j].selected));
    else if (control.tagName === 'TEXTAREA') control.textContent = original.value;
    else {
      control.setAttribute('value', original.value);
      control.toggleAttribute('checked', original.checked);
    }
  });
  return copy.innerHTML;
}

export function prepareFormTables(root) {
  // Indentation and old hint labels are template markup, not user-entered lines.
  // Leaving them in a pre-wrap editor makes otherwise empty rows very tall.
  root.querySelectorAll('[contenteditable]').forEach(field => {
    field.querySelectorAll('.ghichu').forEach(hint => {
      if (hint.textContent.trim()) field.title = hint.textContent.trim();
      hint.remove();
    });
    if (!field.textContent.trim() && !field.querySelector('input, select, textarea, img')) field.replaceChildren();
  });
  root.querySelectorAll('table').forEach(table => {
    if (table.tHead) return;
    const first = table.rows[0];
    if (!first || first.querySelector('[contenteditable], input, select, textarea')) return;
    // Only promote a real heading row, not a signature/layout table.
    if (!first.querySelector('th, .Table_TH')) return;
    table.createTHead().appendChild(first);
  });
}

export function handleFormTableAction(root, button) {
  const table = [...root.querySelectorAll('table')].find(item => item.id === button.dataset.bmTable);
  if (!table) return false;
  const rows = [...table.rows].filter(row => row.querySelector('[contenteditable], input:not([type="button"]), select, textarea'));
  const last = rows.at(-1);
  if (!last) return false;
  if (button.dataset.bmAction === 'delete-row') {
    if (rows.length <= 1) return false;
    last.remove();
  } else {
    const row = last.cloneNode(true);
    row.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    row.removeAttribute('id');
    row.querySelectorAll('[contenteditable]').forEach(element => {
      // A cell can contain another editable div: clear the outer editor once.
      if (!element.parentElement.closest('[contenteditable]')) element.replaceChildren();
    });
    row.querySelectorAll('input, textarea').forEach(element => { element.value = ''; element.removeAttribute('value'); });
    row.querySelectorAll('select').forEach(element => { element.selectedIndex = 0; });
    const numberCell = row.cells[0];
    if (numberCell && /^\s*\d+\s*$/.test(numberCell.textContent)) numberCell.textContent = String(rows.length + 1);
    last.after(row);
    row.querySelector('[contenteditable], input, select, textarea')?.focus();
  }
  return true;
}

// Printing is always performed in a fresh, isolated document. The live app,
// menus, catalog, zoom and modal positioning are never included in the job.
export async function printFormDocument(html) {
  const frame = document.createElement('iframe');
  frame.title = 'Bản in biểu mẫu';
  frame.dataset.bmPrintFrame = 'true';
  frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:800px;border:0';
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Không tải được bản in. Vui lòng thử lại.')), 15000);
    frame.onload = () => { clearTimeout(timeout); resolve(); };
  });
  frame.srcdoc = html;
  document.body.appendChild(frame);
  try {
    await ready;
    const printDoc = frame.contentDocument;
    await printDoc.fonts.ready;
    await Promise.all([...printDoc.images].map(img => img.decode().catch(() => {})));
    // Leave the frame alive until the browser has completed its print job.
    frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
    frame.contentWindow.focus();
    frame.contentWindow.print();
  } catch (error) {
    frame.remove();
    throw error;
  }
}
