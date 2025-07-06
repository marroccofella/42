/// <reference lib="dom" />
export interface ScriptCue {
  id: string;
  time: number; // in seconds
  text: string;
  speaker?: string; // Optional speaker
  category: 'dialogue' | 'audio' | 'visual' | 'effect';
  color: string; // hex color string
}

// --- Base Clip and Track Interfaces ---

interface BaseClip {
  id: string;
  start: number; // in seconds, relative to timeline start
  duration: number; // in seconds
}

export interface VideoClip extends BaseClip {
  type: 'video';
  file: File;
  url: string;
  color: string;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  file: File;
  url: string;
}

export interface TextClip extends BaseClip {
  type: 'text';
  text: string;
  color: string;
}

export type Clip = VideoClip | AudioClip | TextClip;
export type MediaClip = VideoClip | AudioClip;

export interface VideoTrack {
  id:string;
  type: 'video';
  clips: VideoClip[];
}
export interface AudioTrack {
  id: string;
  type: 'audio';
  clips: AudioClip[];
}
export interface CustomTextTrack {
  id: string;
  type: 'text';
  clips: TextClip[];
}

export type Track = VideoTrack | AudioTrack | CustomTextTrack;


// --- Export-related types ---

export interface ExportPreset {
  name: string;
  width: number;
  height: number;
  format: 'mp4';
  vcodec: 'libx264';
  crf: number;
  displayName: string;
  description: string;
}

export interface ExportState {
  status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-1
  message: string;
  outputUrl?: string;
}