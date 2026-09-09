export function normalizePdfPage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function createPdfNoteKey(fileId, page) {
  return `dhan:pdf-note:${fileId}:page:${normalizePdfPage(page)}`;
}

export function createMediaViewerUrl(fileId, category, page = 1) {
  const streamUrl = `/api/media/stream/${fileId}`;
  return category === 'document'
    ? `${streamUrl}#page=${normalizePdfPage(page)}&zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`
    : streamUrl;
}
