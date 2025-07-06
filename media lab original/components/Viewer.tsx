/// <reference lib="dom" />
import React from 'react';
import { PlayIcon } from './icons';
import type { VideoClip, AudioClip, TextClip } from '../types';

interface ViewerProps {
  activeVideoClip: VideoClip | null;
  activeAudioClips: AudioClip[];
  activeTextClips: TextClip[];
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  isPlaying: boolean;
}

export const Viewer: React.FC<ViewerProps> = ({
  activeVideoClip,
  activeAudioClips,
  activeTextClips,
  videoRef,
  audioRefs,
  onTimeUpdate,
  onPlayStateChange,
  isPlaying,
}) => {
  // Effect to sync video element's paused state with the isPlaying prop
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(e => console.error("Video play failed:", e));
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, activeVideoClip, videoRef]);

  return (
    <div className="bg-black rounded-lg aspect-video w-full flex items-center justify-center relative overflow-hidden border border-promptus-border">
      {/* Render active audio clips - these are not visible but are controlled by App.tsx */}
      {activeAudioClips.map(clip => (
        <audio
          key={clip.id}
          ref={el => {
            if (el) {
              audioRefs.current.set(clip.id, el);
            } else {
              audioRefs.current.delete(clip.id);
            }
          }}
          src={clip.url}
          preload="auto"
          loop={false}
        />
      ))}

      {activeVideoClip ? (
        <video
          key={activeVideoClip.id}
          ref={videoRef}
          src={activeVideoClip.url}
          controls
          className="w-full h-full"
          onTimeUpdate={e => onTimeUpdate(e.currentTarget.currentTime)}
          onPlay={() => onPlayStateChange(true)}
          onPause={() => onPlayStateChange(false)}
          onSeeking={() => onPlayStateChange(false)}
        />
      ) : (
        <div className="text-center text-promptus-text-secondary">
          <PlayIcon className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-promptus-text-primary">Promptus Media Lab</h3>
          <p>Upload a video or audio file to begin</p>
        </div>
      )}

      {/* Render Text Overlays */}
      <div className="absolute inset-0 pointer-events-none p-8 flex items-end justify-center">
        {activeTextClips.map(clip => (
          <div
            key={clip.id}
            className="text-white text-4xl font-bold text-center mb-10"
            style={{
              textShadow: '2px 2px 5px rgba(0,0,0,0.8)',
              color: clip.color || '#FFFFFF',
            }}
          >
            {clip.text}
          </div>
        ))}
      </div>
    </div>
  );
};