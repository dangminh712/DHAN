const extensions = {
  video: ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv'],
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

export function selectStudyMedia(files = []) {
  return {
    video: files.find(file => ['video', 'audio'].includes(getMediaKind(file))),
    slide: files.find(file => getMediaKind(file) === 'pdf') || files.find(file => getMediaKind(file) === 'slide'),
    documents: files.filter(file => ['pdf', 'document', 'slide'].includes(getMediaKind(file))),
    image: files.find(file => getMediaKind(file) === 'image'),
  };
}
