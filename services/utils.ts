import { SUPPORTED_FORMATS, MAX_FILE_SIZE, BROWSER_SUPPORTED_FORMATS } from '../constants';

export const formatDuration = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 5);

export function formatTimelineTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// File validation functions
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidFileFormat(file: File): boolean {
  const extension = getFileExtension(file.name);
  return SUPPORTED_FORMATS.includes(extension);
}

export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isValidFileFormat(file)) {
    const extension = getFileExtension(file.name);
    return {
      valid: false,
      error: `Unsupported file format: .${extension}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    };
  }

  if (!isValidFileSize(file)) {
    return {
      valid: false,
      error: `File size too large: ${formatFileSize(file.size)}. Maximum allowed: ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  return { valid: true };
}

// Browser compatibility check
export function getBrowserName(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari')) return 'safari';
  if (userAgent.includes('edge')) return 'edge';
  return 'unknown';
}

export function isBrowserCompatible(filename: string): boolean {
  const extension = getFileExtension(filename);
  const browser = getBrowserName();
  const supportedFormats = BROWSER_SUPPORTED_FORMATS[browser as keyof typeof BROWSER_SUPPORTED_FORMATS] || [];
  return supportedFormats.includes(extension);
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
};
