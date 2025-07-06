// File format and validation constants
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'ogg', 'm4a'];
export const SUPPORTED_FORMATS = [...SUPPORTED_VIDEO_FORMATS, ...SUPPORTED_AUDIO_FORMATS];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// Default values
export const DEFAULT_CLIP_DURATION = 10; // seconds
export const FALLBACK_DURATION = 10; // seconds for failed metadata loading
export const METADATA_TIMEOUT = 5000; // 5 seconds

// Browser compatibility
export const BROWSER_SUPPORTED_FORMATS = {
  chrome: ['mp4', 'webm', 'ogg'],
  firefox: ['mp4', 'webm', 'ogg'],
  safari: ['mp4', 'mov'],
  edge: ['mp4', 'webm', 'mov', 'avi']
};

// Timeline constants
export const MIN_CLIP_DURATION = 0.1; // seconds
export const TIMELINE_ZOOM_LEVELS = [0.1, 0.25, 0.5, 1, 2, 4, 8];
export const DEFAULT_ZOOM_LEVEL = 1;

// Export presets
export const EXPORT_PRESETS = {
  YOUTUBE_SHORTS: { name: 'YouTube Shorts', width: 1080, height: 1920, format: 'mp4' as const },
  TIKTOK: { name: 'TikTok', width: 1080, height: 1920, format: 'mp4' as const },
  INSTAGRAM_REELS: { name: 'Instagram Reels', width: 1080, height: 1920, format: 'mp4' as const },
  STANDARD_HD: { name: 'Standard HD', width: 1920, height: 1080, format: 'mp4' as const },
  STANDARD_4K: { name: '4K', width: 3840, height: 2160, format: 'mp4' as const }
};

// AI service constants
export const AI_RETRY_ATTEMPTS = 3;
export const AI_RETRY_DELAY = 1000; // milliseconds
export const AI_REQUEST_TIMEOUT = 30000; // 30 seconds

// UI constants
export const TOAST_DURATION = 5000; // milliseconds
export const DEBOUNCE_DELAY = 300; // milliseconds
export const ANIMATION_DURATION = 200; // milliseconds
