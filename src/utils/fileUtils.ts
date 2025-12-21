// Image file extensions
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];

export function isImageFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return IMAGE_MIME_TYPES.includes(file.mimeType);
  }
  
  if (file.extension) {
    return IMAGE_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Video file extensions
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

export function isVideoFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return VIDEO_MIME_TYPES.includes(file.mimeType) || file.mimeType.startsWith('video/');
  }
  
  if (file.extension) {
    return VIDEO_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? VIDEO_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Audio file extensions
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'aac', 'm4a', 'flac', 'wma', 'opus', 'webm'];
const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/vorbis',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/wma',
  'audio/x-ms-wma',
  'audio/opus',
  'audio/webm',
];

export function isAudioFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return AUDIO_MIME_TYPES.includes(file.mimeType) || file.mimeType.startsWith('audio/');
  }
  
  if (file.extension) {
    return AUDIO_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? AUDIO_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Text file extensions
const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'log', 'text'];
const TEXT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/x-log',
  'text/x-csv',
];

// PDF file extensions
const PDF_EXTENSIONS = ['pdf'];
const PDF_MIME_TYPES = ['application/pdf'];

export function isPdfFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return PDF_MIME_TYPES.includes(file.mimeType);
  }
  
  if (file.extension) {
    return PDF_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? PDF_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Office file extensions
const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
const OFFICE_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
];

export function isOfficeFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return OFFICE_MIME_TYPES.includes(file.mimeType) || 
           file.mimeType.startsWith('application/vnd.ms-') ||
           file.mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
           file.mimeType.startsWith('application/vnd.oasis.opendocument');
  }
  
  if (file.extension) {
    return OFFICE_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? OFFICE_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Code file extensions
const CODE_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs',
  'swift', 'kt', 'scala', 'sh', 'bash', 'zsh', 'ps1', 'r', 'm', 'mm', 'pl', 'pm', 'lua',
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml', 'toml',
  'vue', 'svelte', 'dart', 'elm', 'clj', 'cljs', 'ex', 'exs', 'erl', 'hrl'
];
const CODE_MIME_TYPES = [
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'text/x-java-source',
  'text/x-c++src',
  'text/x-csrc',
  'text/x-php',
  'text/x-ruby',
  'text/x-go',
  'text/html',
  'text/css',
  'application/xml',
  'text/xml',
];

export function isCodeFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return CODE_MIME_TYPES.includes(file.mimeType) ||
           file.mimeType.startsWith('text/x-') ||
           file.mimeType === 'application/javascript' ||
           file.mimeType === 'text/javascript';
  }
  
  if (file.extension) {
    return CODE_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? CODE_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Markdown file extensions
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mkdn'];
const MARKDOWN_MIME_TYPES = ['text/markdown', 'text/x-markdown'];

export function isMarkdownFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  // Check extension first (most reliable for markdown files)
  if (file.extension) {
    if (MARKDOWN_EXTENSIONS.includes(file.extension.toLowerCase())) {
      return true;
    }
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && MARKDOWN_EXTENSIONS.includes(ext)) {
      return true;
    }
  }
  
  // Check MIME type last (many .md files have text/plain as mimeType)
  if (file.mimeType) {
    return MARKDOWN_MIME_TYPES.includes(file.mimeType);
  }
  
  return false;
}

// CSV file extensions
const CSV_EXTENSIONS = ['csv'];
const CSV_MIME_TYPES = ['text/csv', 'application/csv', 'text/x-csv', 'application/vnd.ms-excel'];

export function isCsvFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return CSV_MIME_TYPES.includes(file.mimeType);
  }
  
  if (file.extension) {
    return CSV_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? CSV_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

export function isTextFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  // Exclude markdown, csv, code, and audio files (they have their own previews or special handling)
  if (isMarkdownFile(file) || isCsvFile(file) || isCodeFile(file) || isAudioFile(file)) {
    return false;
  }
  
  if (file.mimeType) {
    return TEXT_MIME_TYPES.includes(file.mimeType) || 
           (file.mimeType.startsWith('text/') && 
            !file.mimeType.includes('markdown') && 
            !file.mimeType.includes('csv'));
  }
  
  if (file.extension) {
    return TEXT_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? TEXT_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIconName(file: { name: string; mimeType?: string; type: 'file' | 'folder' }): string {
  if (file.type === 'folder') {
    return 'folder';
  }
  
  if (!file.mimeType) {
    return 'file';
  }
  
  const mime = file.mimeType.toLowerCase();
  
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'music';
  if (mime.includes('pdf')) return 'file-text';
  if (mime.includes('word') || mime.includes('document')) return 'file-text';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'file-spreadsheet';
  if (mime.includes('zip') || mime.includes('archive')) return 'archive';
  
  return 'file';
}

