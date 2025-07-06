/// <reference lib="dom" />
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ScriptCue, Track, Clip } from '../types';
import { PlusCircleIcon, PlusIcon, VideoIcon, AudioWaveformIcon, TypeIcon, XIcon } from './icons';

import { formatTimelineTime } from '../services/utils';
import { generateClipThumbnail } from '../utils/thumbnailGenerator';

interface ClipComponentProps {
  clip: Clip;
  duration: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, clip: Clip, trackId: string) => void;
}

const ClipComponent: React.FC<ClipComponentProps> = ({ clip, duration, onDragStart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  const left = (clip.start / duration) * 100;
  const width = (clip.duration / duration) * 100;
  
  // Generate thumbnail when hovered
  useEffect(() => {
    if (isHovered && !thumbnailUrl && !thumbnailLoading) {
      console.log('Starting thumbnail generation for clip:', clip.id, clip.type);
      setThumbnailLoading(true);
      generateClipThumbnail(clip)
        .then(url => {
          console.log('Thumbnail generated successfully for clip:', clip.id);
          setThumbnailUrl(url);
          setThumbnailLoading(false);
        })
        .catch(error => {
          console.error('Failed to generate thumbnail for clip:', clip.id, error);
          setThumbnailLoading(false);
        });
    }
  }, [isHovered, thumbnailUrl, thumbnailLoading, clip]);
  
  // Get media type specific styling
  const getClipStyling = () => {
    switch (clip.type) {
      case 'video':
        return {
          bgColor: clip.color || '#ef4444', // Red for video
          pattern: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: '🎥',
          borderColor: 'border-red-400'
        };
      case 'audio':
        return {
          bgColor: '#10b981', // Green for audio
          pattern: 'bg-gradient-to-r from-green-500 to-emerald-600',
          icon: '🎵',
          borderColor: 'border-green-400'
        };
      case 'text':
        return {
          bgColor: clip.color || '#8b5cf6', // Purple for text
          pattern: 'bg-gradient-to-r from-purple-500 to-violet-600',
          icon: '📝',
          borderColor: 'border-purple-400'
        };
      default:
        return {
          bgColor: '#6b7280', // Gray fallback
          pattern: 'bg-gradient-to-r from-gray-500 to-gray-600',
          icon: '📄',
          borderColor: 'border-gray-400'
        };
    }
  };
  
  const styling = getClipStyling();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, clip, '')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 ${styling.borderColor} shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group`}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      <div className={`w-full h-full ${styling.pattern} relative`}>
        {/* Pattern overlay for texture */}
        <div className="absolute inset-0 opacity-20">
          {clip.type === 'audio' && (
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
          )}
          {clip.type === 'video' && (
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(255,255,255,0.1)_3px,rgba(255,255,255,0.1)_6px)]" />
          )}
          {clip.type === 'text' && (
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:8px_8px]" />
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10 w-full h-full bg-black/10 backdrop-blur-sm p-1 flex items-center gap-1">
          <span className="text-xs flex-shrink-0">{styling.icon}</span>
          <p className="text-white text-xs font-medium truncate pointer-events-none flex-1">
            {'file' in clip ? clip.file.name : clip.text}
          </p>
        </div>
        
        {/* Thumbnail Preview */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-promptus-dark border border-promptus-border rounded-lg shadow-xl p-2 min-w-[160px]">
              {thumbnailLoading ? (
                <div className="w-40 h-24 bg-promptus-surface rounded flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-promptus-accent"></div>
                </div>
              ) : thumbnailUrl ? (
                <div className="space-y-2">
                  <img 
                    src={thumbnailUrl} 
                    alt={`${clip.type} preview`}
                    className="w-40 h-auto rounded border border-promptus-border/50"
                    style={{ maxHeight: '120px', objectFit: 'cover' }}
                  />
                  <div className="text-xs text-promptus-text-secondary">
                    <div className="font-medium text-promptus-text-primary truncate">
                      {'file' in clip ? clip.file.name : clip.text}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="capitalize">{clip.type}</span>
                      <span>{(clip.duration).toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-40 h-24 bg-promptus-surface rounded flex items-center justify-center text-promptus-text-secondary">
                  <span className="text-2xl">{styling.icon}</span>
                </div>
              )}
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-promptus-border"></div>
          </div>
        )}
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
        <span>{formatTimelineTime(currentTime)}</span>
        <button onClick={() => onAddTrack('audio')} className="flex items-center gap-2 text-xs px-2 py-1 bg-promptus-border hover:bg-promptus-border/70 rounded-md"> <PlusIcon className="w-4 h-4"/> Add Audio Track</button>
        <button onClick={() => onAddTrack('text')} className="flex items-center gap-2 text-xs px-2 py-1 bg-promptus-border hover:bg-promptus-border/70 rounded-md"> <PlusIcon className="w-4 h-4"/> Add Text Track</button>
        <span>{formatTimelineTime(duration)}</span>
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
                <span className="-translate-x-1/2 mt-px">{formatTimelineTime(time).substring(1)}</span>
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
                    {formatTimelineTime(hoverTime)}
                 </div>
            </div>
        )}
      </div>
      <div className="w-full space-y-1" onDragEnd={handleDragEnd}>
          {tracks.map(track => {
              const Icon = { video: VideoIcon, audio: AudioWaveformIcon, text: TypeIcon }[track.type];
              
              // Get track-specific styling
              const getTrackStyling = () => {
                switch (track.type) {
                  case 'video':
                    return {
                      bgColor: 'bg-red-500/10',
                      borderColor: 'border-red-400/30',
                      iconColor: 'text-red-400',
                      textColor: 'text-red-300',
                      emoji: '🎥'
                    };
                  case 'audio':
                    return {
                      bgColor: 'bg-green-500/10',
                      borderColor: 'border-green-400/30',
                      iconColor: 'text-green-400',
                      textColor: 'text-green-300',
                      emoji: '🎵'
                    };
                  case 'text':
                    return {
                      bgColor: 'bg-purple-500/10',
                      borderColor: 'border-purple-400/30',
                      iconColor: 'text-purple-400',
                      textColor: 'text-purple-300',
                      emoji: '📝'
                    };
                  default:
                    return {
                      bgColor: 'bg-gray-500/10',
                      borderColor: 'border-gray-400/30',
                      iconColor: 'text-gray-400',
                      textColor: 'text-gray-300',
                      emoji: '📄'
                    };
                }
              };
              
              const styling = getTrackStyling();
              
              return (
              <div key={track.id} className="w-full flex relative">
                  <div className={`w-32 flex-shrink-0 ${styling.bgColor} p-2 flex flex-col justify-center items-start border-r border-b ${styling.borderColor} relative transition-all duration-200 hover:bg-opacity-20`}>
                      <div className="flex items-center gap-2">
                          <span className="text-sm">{styling.emoji}</span>
                          <Icon className={`w-4 h-4 ${styling.iconColor}`} />
                          <span className={`font-semibold capitalize text-xs ${styling.textColor}`}>{track.type}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
                      </div>
                      {track.type !== 'video' && (
                           <button onClick={() => onRemoveTrack(track.id)} className="absolute top-1 right-1 text-promptus-text-secondary/50 hover:text-red-400 transition-colors">
                              <XIcon className="w-3 h-3" />
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
