import type { ExportPreset } from '../types';

/*
 * publishingService
 *  -----------------
 *  Abstraction layer for uploading videos (and related metadata) to external
 *  platforms such as YouTube, TikTok, Instagram, etc.  The initial MVP
 *  implements YouTube upload using the Data API v3.
 *
 *  NOTE: This file currently contains only *stub* implementations so the build
 *  succeeds while UI work progresses.  Real implementations should replace the
 *  placeholders in a later sprint.
 */

export interface PlatformAuth {
  platform: 'youtube' | 'tiktok' | 'instagram';
  /** OAuth access token */
  accessToken: string;
  /** OAuth refresh token (if the platform supports it) */
  refreshToken?: string;
  /** Expiration epoch millis of the access token */
  expiresAt?: number;
}

export interface PublishTarget {
  platform: 'youtube' | 'tiktok' | 'instagram';
  /** File blob or URL of the rendered/exported video */
  video: Blob;
  /** Text data (title/description/hashtags) depending on platform */
  text: Record<string, string>;
  /** Optional schedule time (ISO string). If omitted, publish immediately */
  scheduleAt?: string;
  /** Export preset that generated the video (aspect ratio etc.) */
  preset: ExportPreset;
}

/**
 * Initialise platform OAuth flow.
 * For MVP this just opens the auth URL in a new window and waits for redirect.
 */
export async function authenticatePlatform(platform: PlatformAuth['platform']): Promise<PlatformAuth> {
  // TODO: implement real OAuth dance
  console.info(`[publishingService] authenticatePlatform(${platform}) - stub`);
  throw new Error('OAuth flow not implemented yet');
}

/**
 * Publish a rendered video to a social platform.
 */
export async function publish(target: PublishTarget): Promise<void> {
  console.info('[publishingService] publish() stub', target);
  // TODO: implement real upload logic
  return;
}
