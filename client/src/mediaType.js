const extensions = {
  video: ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv', 'flv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'],
  pdf: ['pdf'],
  slide: ['ppt', 'pptx', 'odp'],
};

function kindOf(value) {
  const type = String(value || '').trim().toLowerCase().split(';')[0].replace(/^\./, '');
  for (const kind of ['video', 'audio', 'image']) {
    if (type === kind || type.startsWith(`${kind}/`)) return kind;
  }
  if (type === 'application/pdf') return 'pdf';
  if (type.includes('presentation') || type === 'application/vnd.ms-powerpoint' || type === 'slide') return 'slide';
  return Object.keys(extensions).find(kind => extensions[kind].includes(type));
}

// Prefer specific MIME/format metadata and filename evidence over broad legacy categories.
export function getMediaKind(file = {}) {
  if (!file) return 'document';
  for (const value of [file.mimeType, file.contentType, file.fileType]) {
    const kind = kindOf(value);
    if (kind) return kind;
  }
  const name = file.originalName || file.originalFileName || file.fileName || file.name || '';
  const extension = String(name).split(/[?#]/)[0].split('.').pop();
  return kindOf(extension) || kindOf(file.category) || kindOf(file.type) || 'document';
}

export function getViewerKind(file = {}) {
  if (!file) return 'other';

  const name = file.originalName || file.originalFileName || file.fileName || file.name || '';
  const extension = String(name).split(/[?#]/)[0].split('.').pop().toLowerCase();
  const mime = String(file.mimeType || file.contentType || file.type || '').toLowerCase();
  const fileType = String(file.fileType || '').toLowerCase();

  // Excel / Spreadsheets
  if (
    ['xlsx', 'xls', 'csv', 'ods'].includes(extension) ||
    mime.includes('spreadsheet') ||
    mime.includes('ms-excel') ||
    mime === 'text/csv' ||
    fileType === 'excel' ||
    fileType === 'xlsx' ||
    fileType === 'xls'
  ) {
    return 'excel';
  }

  // Word documents
  if (
    ['docx', 'doc', 'odt', 'rtf'].includes(extension) ||
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    fileType === 'word' ||
    fileType === 'docx' ||
    fileType === 'doc'
  ) {
    return 'word';
  }

  // PDF
  if (extension === 'pdf' || mime === 'application/pdf' || fileType === 'pdf') {
    return 'pdf';
  }

  // Presentation / Slides
  if (
    ['ppt', 'pptx', 'odp'].includes(extension) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    fileType === 'slide' ||
    fileType === 'powerpoint'
  ) {
    return 'slide';
  }

  // Plain Text & Code
  if (
    ['txt', 'log', 'md', 'json', 'xml'].includes(extension) ||
    mime.startsWith('text/plain') ||
    fileType === 'text'
  ) {
    return 'text';
  }

  // Video
  if (
    extensions.video.includes(extension) ||
    mime.startsWith('video/') ||
    fileType === 'video' ||
    extensions.video.includes(fileType)
  ) {
    return 'video';
  }

  // Audio
  if (
    extensions.audio.includes(extension) ||
    mime.startsWith('audio/') ||
    fileType === 'audio' ||
    extensions.audio.includes(fileType)
  ) {
    return 'audio';
  }

  // Image
  if (
    extensions.image.includes(extension) ||
    mime.startsWith('image/') ||
    fileType === 'image' ||
    extensions.image.includes(fileType)
  ) {
    return 'image';
  }

  // Archive
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || mime.includes('zip') || mime.includes('compressed')) {
    return 'archive';
  }

  return 'other';
}

export function selectStudyMedia(files = []) {
  return {
    video: files.find(file => ['video', 'audio'].includes(getMediaKind(file))),
    slide: files.find(file => getMediaKind(file) === 'pdf') || files.find(file => getMediaKind(file) === 'slide'),
    documents: files.filter(file => ['pdf', 'document', 'slide'].includes(getMediaKind(file))),
    image: files.find(file => getMediaKind(file) === 'image'),
  };
}

