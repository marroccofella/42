/// <reference lib="dom" />
import React, { useState, useCallback, useMemo } from 'react';
import { UploadIcon, VideoIcon, AudioWaveformIcon } from './icons';
import type { Track, VideoTrack, AudioTrack, MediaClip } from '../types';
import { formatDuration } from '../services/utils';

interface MediaPoolProps {
  onFilesChange: (files: FileList) => void;
  tracks: Track[];
}

export const MediaPool: React.FC<MediaPoolProps> = ({ onFilesChange, tracks }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [onFilesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange(e.target.files);
    }
  };
  
  const allMediaClips = useMemo(() => {
    const mediaTracks = tracks.filter((track): track is VideoTrack | AudioTrack => track.type === 'video' || track.type === 'audio');
    return mediaTracks.flatMap<MediaClip>(track => track.clips).sort((a, b) => a.start - b.start);
  }, [tracks]);

  return (
    <div className="bg-promptus-surface rounded-lg p-4 flex flex-col h-full border border-promptus-border">
      <h2 className="text-lg font-semibold mb-2 text-promptus-text-primary">Media Pool</h2>
      {allMediaClips.length > 0 ? (
        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
            {allMediaClips.map(clip => (
                <div key={clip.id} className="bg-promptus-dark/50 p-2 rounded-md flex items-center gap-3">
                    {clip.type === 'video' && <VideoIcon className="w-6 h-6 text-promptus-accent flex-shrink-0" />}
                    {clip.type === 'audio' && <AudioWaveformIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />}
                    <div className="flex-grow overflow-hidden">
                        <p className="font-semibold text-sm text-promptus-text-primary truncate">{clip.file.name}</p>
                        <p className="text-xs text-promptus-text-secondary">{formatDuration(clip.duration)}</p>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-center text-promptus-text-secondary">
          <p>No clips added yet.</p>
        </div>
      )}

      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative mt-4 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-md transition-colors h-24 cursor-pointer ${
          isDragging ? 'border-promptus-accent bg-promptus-dark' : 'border-promptus-border'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept="video/*,audio/*"
          multiple
          aria-label="Upload video or audio files"
          title="Upload video or audio files"
          placeholder="Select video or audio files to upload"
        />
        <div className="text-center text-promptus-text-secondary pointer-events-none">
            <UploadIcon className="w-8 h-8 mx-auto mb-2" />
            <p>
            <span className="font-semibold text-promptus-accent">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">Add video or audio files</p>
        </div>
      </label>
    </div>
  );
};
