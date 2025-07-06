/// <reference lib="dom" />
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ScriptCue, Track, Clip } from '../types';
import { PlusCircleIcon, PlusIcon, VideoIcon, AudioWaveformIcon, TypeIcon, XIcon } from './icons';

const formatTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds || 0);
  return date.toISOString().substr(14, 5);
};

interface ClipComponentProps {
  clip: Clip;
  duration: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, clip: Clip, trackId: string) => void;
}

const ClipComponent: React.FC<ClipComponentProps> = ({ clip, duration, onDragStart }) => {
  const left = (clip.start / duration) * 100;
  const width = (clip.duration / duration) * 100;
  const bgColor = 'color' in clip ? clip.color : '#60a5fa'; // Default for audio

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, clip, '')}
      className="absolute top-1/2 -translate-y-1/2 h-10 rounded overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: bgColor }}
    >
      <div className="w-full h-full bg-black/20 backdrop-blur-sm p-1">
        <p className="text-white text-xs font-medium truncate pointer-events-none">
          {'file' in clip ? clip.file.name : clip.text}
        </p>
      </div>
    </div>
  );
};

interface TimelineProps {
  duration: number;
  currentTime: number;
  cues: ScriptCue[];
  tracks: Track[];
  onSeek: (time: number) => void;
  activeCue: ScriptCue | null;
  insertionTime: number;
  onSetInsertionTime: (time: number) => void;
  onAddTrack: (type: 'audio' | 'text') => void;
  onRemoveTrack: (trackId: string) => void;
  onMoveClip: (clipId: string, fromTrackId: string, toTrackId: string, newStart: number) => void;
}

export const Timeline: React.FC<TimelineProps> = (props) => {
  const { duration, currentTime, cues, tracks, onSeek, activeCue, insertionTime, onSetInsertionTime, onAddTrack, onRemoveTrack, onMoveClip } = props;
  const rulerRef = useRef<HTMLDivElement>(null);
  const trackLanesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggedClipInfo, setDraggedClipInfo] = useState<{ clip: Clip, fromTrackId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ trackId: string, start: number } | null>(null);

  const getSeekTime = useCallback((clientX: number): number | null => {
    if (!duration || !rulerRef.current) return null;
    const rect = rulerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (newX / rect.width) * duration;
  }, [duration]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest('[draggable="true"]')) return;
    const seekTime = getSeekTime(e.clientX);
    if (seekTime !== null) {
      onSetInsertionTime(seekTime);
      onSeek(seekTime);
    }
    setIsDraggingPlayhead(true);
  };
  
  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = getSeekTime(e.clientX);
    setHoverTime(time);
  };

  useEffect(() => {
    if (!isDraggingPlayhead) return;
    let animationFrameRequest: number | null = null;
    let lastClientX: number;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      lastClientX = e.clientX;
      if (animationFrameRequest) return;
      animationFrameRequest = requestAnimationFrame(() => {
        const seekTime = getSeekTime(lastClientX);
        if (seekTime !== null) onSeek(seekTime);
        animationFrameRequest = null;
      });
    };
    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        if (animationFrameRequest) cancelAnimationFrame(animationFrameRequest);
        setIsDraggingPlayhead(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        if (animationFrameRequest) cancelAnimationFrame(animationFrameRequest);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, getSeekTime, onSeek]);


  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, clip: Clip, trackId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', clip.id); // Necessary for Firefox
    setDraggedClipInfo({ clip, fromTrackId: trackId });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, trackId: string) => {
    e.preventDefault();
    if (!draggedClipInfo) return;

    const trackLane = trackLanesRef.current.get(trackId);
    if (!trackLane) return;

    const rect = trackLane.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const start = (x / rect.width) * duration;
    
    setDropTarget({ trackId, start });
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, trackId: string) => {
    e.preventDefault();
    if (draggedClipInfo && dropTarget) {
      const { clip, fromTrackId } = draggedClipInfo;
      const targetTrack = tracks.find(t => t.id === trackId);
      if (targetTrack && targetTrack.type === clip.type) {
         onMoveClip(clip.id, fromTrackId, trackId, dropTarget.start);
      }
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    setDraggedClipInfo(null);
    setDropTarget(null);
  };


  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  const insertionPosition = duration > 0 ? (insertionTime / duration) * 100 : 0;
  const timeMarkers = duration > 0 ? Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5) : [];

  return (
    <div className="bg-promptus-surface rounded-lg p-4 flex flex-col gap-2 border border-promptus-border overflow-x-auto">
      <div className="flex justify-between items-center text-sm font-mono text-promptus-text-secondary">
        <span>{formatTime(currentTime)}</span>
        <button onClick={() => onAddTrack('audio')} className="flex items-center gap-2 text-xs px-2 py-1 bg-promptus-border hover:bg-promptus-border/70 rounded-md"> <PlusIcon className="w-4 h-4"/> Add Audio Track</button>
        <button onClick={() => onAddTrack('text')} className="flex items-center gap-2 text-xs px-2 py-1 bg-promptus-border hover:bg-promptus-border/70 rounded-md"> <PlusIcon className="w-4 h-4"/> Add Text Track</button>
        <span>{formatTime(duration)}</span>
      </div>
      <div
        ref={rulerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleHover}
        onMouseLeave={() => setHoverTime(null)}
        className={`relative w-full h-8 bg-promptus-dark rounded-t-md group overflow-hidden ${isDraggingPlayhead ? 'cursor-grabbing' : 'cursor-pointer'}`}
      >
        {timeMarkers.map(time => (
             <div key={time} className="absolute h-full text-xs text-promptus-text-secondary/50 flex flex-col justify-end" style={{left: `${(time / duration) * 100}%`}}>
                <div className="h-2/3 w-px bg-promptus-text-secondary/50"></div>
                <span className="-translate-x-1/2 mt-px">{formatTime(time).substring(1)}</span>
             </div>
        ))}
        <div className="absolute inset-0 z-10">
            {cues.map((cue) => {
                const cuePosition = (cue.time / duration) * 100;
                const isCueActive = activeCue?.id === cue.id;
                return (
                    <div
                        key={cue.id}
                        className={`absolute top-0 h-full w-2 rounded-sm transition-all duration-200 ease-in-out ${isCueActive ? 'animate-glow' : ''}`}
                        style={{ left: `${cuePosition}%`, backgroundColor: cue.color, '--glow-color': cue.color } as React.CSSProperties}
                        onClick={(e) => { e.stopPropagation(); onSeek(cue.time); }}
                    >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-promptus-dark text-promptus-text-primary text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {cue.text}
                        </div>
                    </div>
                );
            })}
        </div>
        {duration > 0 && (
            <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${insertionPosition}%`}}>
                <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-promptus-accent"></div>
                <PlusCircleIcon className="absolute -top-3 -left-3 w-6 h-6 text-promptus-accent bg-promptus-dark rounded-full" />
            </div>
        )}
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none" style={{ left: `${playheadPosition}%` }}>
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-red-500 border-2 border-promptus-surface"></div>
        </div>
        {hoverTime !== null && !isDraggingPlayhead && (
            <div className="absolute top-0 bottom-0 w-px bg-promptus-text-secondary/50 z-5 pointer-events-none" style={{ left: `${(hoverTime/duration)*100}%`}}>
                 <div className="absolute bottom-full mb-2 left-0 -translate-x-1/2 w-max bg-promptus-dark text-white text-xs rounded py-1 px-2 shadow-lg">
                    {formatTime(hoverTime)}
                 </div>
            </div>
        )}
      </div>
      <div className="w-full space-y-1" onDragEnd={handleDragEnd}>
          {tracks.map(track => {
              const Icon = { video: VideoIcon, audio: AudioWaveformIcon, text: TypeIcon }[track.type];
              return (
              <div key={track.id} className="w-full flex relative">
                  <div className="w-32 flex-shrink-0 bg-promptus-dark/50 p-2 flex flex-col justify-center items-start border-r border-b border-promptus-border relative">
                      <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-promptus-text-secondary" />
                          <span className="font-semibold capitalize">{track.type}</span>
                      </div>
                      {track.type !== 'video' && (
                           <button onClick={() => onRemoveTrack(track.id)} className="absolute top-1 right-1 text-promptus-text-secondary/50 hover:text-white transition-colors">
                              <XIcon className="w-4 h-4" />
                           </button>
                      )}
                  </div>
                  <div 
                    ref={el => {
                      if (el) {
                        trackLanesRef.current.set(track.id, el);
                      } else {
                        trackLanesRef.current.delete(track.id);
                      }
                    }}
                    className="flex-grow relative h-14 bg-promptus-dark border-b border-promptus-border"
                    onDragOver={(e) => handleDragOver(e, track.id)}
                    onDrop={(e) => handleDrop(e, track.id)}
                    onDragLeave={() => setDropTarget(null)}
                  >
                    {track.clips.map((clip) => {
                         const isBeingDragged = draggedClipInfo?.clip.id === clip.id;
                         return (
                            <div key={clip.id} style={{ opacity: isBeingDragged ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                               <ClipComponent clip={clip} duration={duration} onDragStart={(e) => handleDragStart(e, clip, track.id)} />
                            </div>
                         )
                    })}
                    {dropTarget?.trackId === track.id && draggedClipInfo && (
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 h-10 rounded bg-promptus-accent/30 pointer-events-none"
                            style={{
                                left: `${(dropTarget.start / duration) * 100}%`,
                                width: `${(draggedClipInfo.clip.duration / duration) * 100}%`,
                            }}
                        />
                    )}
                  </div>
              </div>
          )})}
      </div>
    </div>
  );
};
