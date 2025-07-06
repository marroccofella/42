/// <reference lib="dom" />
import React, { useState, useCallback, useMemo } from 'react';
import { UploadIcon, VideoIcon, AudioWaveformIcon, TextIcon, ImageIcon, GridIcon } from './icons';
import type { Track, VideoTrack, AudioTrack, CustomTextTrack, MediaClip, ScriptCue } from '../types';
import { formatDuration } from '../services/utils';

type MediaTab = 'all' | 'video' | 'audio' | 'images' | 'scripts';

interface MediaPoolProps {
  onFilesChange: (files: FileList) => void;
  tracks: Track[];
  scriptCues?: ScriptCue[];
}

export const MediaPool: React.FC<MediaPoolProps> = ({ onFilesChange, tracks, scriptCues = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaTab>('all');

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
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
  
  // Get all media clips organized by type
  const allMediaClips = useMemo(() => {
    const mediaTracks = tracks.filter((track): track is VideoTrack | AudioTrack => track.type === 'video' || track.type === 'audio');
    return mediaTracks.flatMap<MediaClip>(track => track.clips).sort((a, b) => a.start - b.start);
  }, [tracks]);

  const videoClips = useMemo(() => allMediaClips.filter(clip => clip.type === 'video'), [allMediaClips]);
  const audioClips = useMemo(() => allMediaClips.filter(clip => clip.type === 'audio'), [allMediaClips]);
  
  const textClips = useMemo(() => {
    const textTracks = tracks.filter((track): track is CustomTextTrack => track.type === 'text');
    return textTracks.flatMap(track => track.clips).sort((a, b) => a.start - b.start);
  }, [tracks]);

  // Get filtered content based on active tab
  const getFilteredContent = () => {
    switch (activeTab) {
      case 'video':
        return { clips: videoClips, scripts: [] };
      case 'audio':
        return { clips: audioClips, scripts: [] };
      case 'images':
        return { clips: [], scripts: [] }; // Future: image clips
      case 'scripts':
        return { clips: textClips, scripts: scriptCues };
      default:
        return { clips: allMediaClips, scripts: scriptCues };
    }
  };

  const { clips: filteredClips, scripts: filteredScripts } = getFilteredContent();

  // Tab configuration
  const tabs = [
    { id: 'all' as MediaTab, label: 'All', icon: GridIcon, count: allMediaClips.length + scriptCues.length },
    { id: 'video' as MediaTab, label: 'Video', icon: VideoIcon, count: videoClips.length },
    { id: 'audio' as MediaTab, label: 'Audio', icon: AudioWaveformIcon, count: audioClips.length },
    { id: 'images' as MediaTab, label: 'Images', icon: ImageIcon, count: 0 }, // Future feature
    { id: 'scripts' as MediaTab, label: 'Scripts', icon: TextIcon, count: textClips.length + scriptCues.length },
  ];

  return (
    <div className="bg-promptus-surface rounded-lg p-4 flex flex-col h-full border border-promptus-border">
      <h2 className="text-lg font-semibold mb-3 text-promptus-text-primary">Media Pool</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-promptus-dark/30 rounded-lg p-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-promptus-accent text-white shadow-sm'
                  : 'text-promptus-text-secondary hover:text-promptus-text-primary hover:bg-promptus-dark/50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-promptus-accent/20 text-promptus-accent'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Content Display */}
      {filteredClips.length > 0 || filteredScripts.length > 0 ? (
        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
          {/* Media Clips */}
          {filteredClips.map(clip => (
            <div key={clip.id} className="bg-promptus-dark/50 p-3 rounded-md flex items-center gap-3 hover:bg-promptus-dark/70 transition-colors group">
              {clip.type === 'video' && <VideoIcon className="w-6 h-6 text-promptus-accent flex-shrink-0" />}
              {clip.type === 'audio' && <AudioWaveformIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />}
              {clip.type === 'text' && <TextIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />}
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-promptus-text-primary truncate group-hover:text-white transition-colors">
                  {clip.type === 'text' ? (clip as any).text : clip.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-promptus-text-secondary">
                  <span>{formatDuration(clip.duration)}</span>
                  {clip.type !== 'text' && (
                    <span className="px-2 py-0.5 bg-promptus-accent/20 text-promptus-accent rounded-full uppercase font-medium">
                      {clip.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Script Cues */}
          {filteredScripts.map(cue => (
            <div key={cue.id} className="bg-promptus-dark/50 p-3 rounded-md flex items-center gap-3 hover:bg-promptus-dark/70 transition-colors group">
              <TextIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-promptus-text-primary truncate group-hover:text-white transition-colors">
                  {cue.text}
                </p>
                <div className="flex items-center gap-2 text-xs text-promptus-text-secondary">
                  <span>{formatDuration(cue.time)}</span>
                  <span 
                    className="px-2 py-0.5 rounded-full uppercase font-medium text-xs"
                    style={{ backgroundColor: `${cue.color}20`, color: cue.color }}
                  >
                    {cue.category}
                  </span>
                  {cue.speaker && (
                    <span className="px-2 py-0.5 bg-promptus-surface/50 text-promptus-text-secondary rounded-full">
                      {cue.speaker}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-center text-promptus-text-secondary">
          <div className="space-y-2">
            {activeTab === 'all' && <p>No media added yet.</p>}
            {activeTab === 'video' && <p>No video files added yet.</p>}
            {activeTab === 'audio' && <p>No audio files added yet.</p>}
            {activeTab === 'images' && <p>Image support coming soon!</p>}
            {activeTab === 'scripts' && <p>No scripts generated yet.</p>}
            <p className="text-xs">Upload files or generate AI scripts to get started.</p>
          </div>
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
