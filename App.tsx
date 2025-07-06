/// <reference lib="dom" />
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MediaPool } from './components/MediaPool';
import { Viewer } from './components/Viewer';
import { Timeline } from './components/Timeline';
import { AIPanel } from './components/AIPanel';
import { generateScriptCuesWithRetry } from './services/geminiService';
import type { ScriptCue, Track, VideoClip, AudioClip, TextClip, Clip, VideoTrack, AudioTrack, CustomTextTrack, MediaClip } from './types';
import { Toast } from './components/Toast';
import { ExportModal } from './components/ExportModal';
import ApiKeySettings from './components/ApiKeySettings';

const CLIP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function App(): React.ReactNode {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'video-track-0', type: 'video', clips: [] }
  ]);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [insertionTime, setInsertionTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [activeVideoClip, setActiveVideoClip] = useState<VideoClip | null>(null);
  const [activeAudioClips, setActiveAudioClips] = useState<AudioClip[]>([]);
  const [activeTextClips, setActiveTextClips] = useState<TextClip[]>([]);
  
  const [cues, setCues] = useState<ScriptCue[]>([]);
  const [activeCue, setActiveCue] = useState<ScriptCue | null>(null);

  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'Unsaved' | 'Saving' | 'Saved'>('Unsaved');
  const [error, setError] = useState<string | null>(null);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeySettingsOpen, setIsApiKeySettingsOpen] = useState(false);
  
  // Timeline playback state
  const [isTimelinePlayback, setIsTimelinePlayback] = useState(false);
  const timelinePlaybackRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide sidebar timer
  const sidebarTimerRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up audio elements...');
      audioRefs.current.forEach((audioEl, clipId) => {
        audioEl.pause();
        audioEl.src = '';
        audioEl.load(); // Reset the element
        console.log(`✨ Cleaned up audio element for clip: ${clipId}`);
      });
      audioRefs.current.clear();
    };
  }, []);

  // Derive total duration from the main video track
  useEffect(() => {
    const videoTrack = tracks.find(t => t.type === 'video') as VideoTrack | undefined;
    const newTotalDuration = videoTrack ? videoTrack.clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0) : 0;
    setTotalDuration(newTotalDuration);
  }, [tracks]);

  // Effect to determine active clips based on currentTime
  useEffect(() => {
    const allVideoClips = (tracks.filter(t => t.type === 'video') as VideoTrack[]).flatMap(t => t.clips);
    const allAudioClips = (tracks.filter(t => t.type === 'audio') as AudioTrack[]).flatMap(t => t.clips);
    const allTextClips = (tracks.filter(t => t.type === 'text') as CustomTextTrack[]).flatMap(t => t.clips);

    const currentVideo = allVideoClips.find(c => currentTime >= c.start && currentTime < c.start + c.duration) || null;
    const currentAudio = allAudioClips.filter(c => currentTime >= c.start && currentTime < c.start + c.duration);
    const currentText = allTextClips.filter(c => currentTime >= c.start && currentTime < c.start + c.duration);

    if (currentVideo?.id !== activeVideoClip?.id) {
        setActiveVideoClip(currentVideo);
    }
    setActiveAudioClips(currentAudio);
    setActiveTextClips(currentText);

    const currentActiveCue = cues.find(cue => Math.abs(cue.time - currentTime) < 0.5);
    setActiveCue(currentActiveCue || null);

  }, [currentTime, tracks, activeVideoClip]);

  // Imperative playback sync
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      if (videoEl.paused) videoEl.play().catch(console.error);
    } else {
      if (!videoEl.paused) videoEl.pause();
    }
    
    // Sync audio elements to video's state
    audioRefs.current.forEach((audioEl, clipId) => {
        const clipIsActive = activeAudioClips.some(c => c.id === clipId);
        if (clipIsActive) {
          if (isPlaying && audioEl.paused) audioEl.play().catch(console.error);
          else if (!isPlaying && !audioEl.paused) audioEl.pause();
        } else if (!audioEl.paused) {
           audioEl.pause();
        }
    });

  }, [isPlaying, activeAudioClips]);


  // Sync player times
  useEffect(() => {
    if (videoRef.current && activeVideoClip) {
        const localTime = currentTime - activeVideoClip.start;
        if (Math.abs(videoRef.current.currentTime - localTime) > 0.2) {
            videoRef.current.currentTime = localTime;
        }
    }
    
    activeAudioClips.forEach(clip => {
      const audioEl = audioRefs.current.get(clip.id);
      if (audioEl) {
          const localTime = currentTime - clip.start;
          if (Math.abs(audioEl.currentTime - localTime) > 0.2) {
              audioEl.currentTime = localTime;
          }
      }
    });
  }, [activeVideoClip, activeAudioClips, currentTime]);

  // Auto-hide sidebar functionality
  useEffect(() => {
    if (isSidebarOpen) {
      console.log('⏰ Sidebar opened - starting 3-second auto-hide timer');
      
      // Clear any existing timer
      if (sidebarTimerRef.current) {
        clearTimeout(sidebarTimerRef.current);
      }
      
      // Set new timer to auto-hide after 3 seconds
      sidebarTimerRef.current = setTimeout(() => {
        console.log('🔄 Auto-hiding sidebar after 3 seconds of inactivity');
        setIsSidebarOpen(false);
      }, 3000);
    } else {
      console.log('❌ Sidebar closed - clearing auto-hide timer');
      // Clear timer when sidebar is manually closed
      if (sidebarTimerRef.current) {
        clearTimeout(sidebarTimerRef.current);
        sidebarTimerRef.current = null;
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (sidebarTimerRef.current) {
        clearTimeout(sidebarTimerRef.current);
      }
    };
  }, [isSidebarOpen]);

  const getMediaDuration = (url: string, type: 'video' | 'audio'): Promise<number> => {
    return new Promise((resolve, reject) => {
      const mediaElement = document.createElement(type);
      mediaElement.preload = 'metadata';
      mediaElement.onloadedmetadata = () => resolve(mediaElement.duration);
      mediaElement.onerror = (e) => {
          console.error(`Error loading ${type} metadata:`, e);
          reject(`Error loading ${type} metadata.`);
      }
      mediaElement.src = url;
    });
  };

  const validateVideoFormat = (file: File): boolean => {
    const supportedFormats = ['video/mp4', 'video/webm'];
    return supportedFormats.includes(file.type);
  };

  const checkBrowserVideoSupport = (type: string): boolean => {
    const videoElement = document.createElement('video');
    return videoElement.canPlayType(type) !== '';
  };

  const validateAudioFormat = (file: File): boolean => {
    const supportedFormats = ['audio/mp3', 'audio/wav', 'audio/ogg'];
    return supportedFormats.includes(file.type);
  };

  const handleFilesChange = async (files: FileList | null) => {
    console.log('🔧 Upload triggered with', files?.length || 0, 'files');
    if (!files || files.length === 0) return;
    setError(null);
    setSaveStatus('Saving');

    // Validate file formats first
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        const isValidFormat = validateVideoFormat(file);
        const isSupportedInBrowser = checkBrowserVideoSupport(file.type);
        
        if (!isValidFormat) {
          invalidFiles.push(`${file.name} - Unsupported video format (${file.type})`);
          continue;
        }
        
        if (!isSupportedInBrowser) {
          invalidFiles.push(`${file.name} - Format not supported in this browser (${file.type})`);
          continue;
        }
      } else if (file.type.startsWith('audio/')) {
        const isValidFormat = validateAudioFormat(file);
        if (!isValidFormat) {
          invalidFiles.push(`${file.name} - Unsupported audio format (${file.type})`);
          continue;
        }
      } else {
        invalidFiles.push(`${file.name} - Not a video or audio file`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    // Show format validation errors
    if (invalidFiles.length > 0) {
      const errorMsg = `Unsupported files:\n${invalidFiles.join('\n')}\n\nSupported formats:\n• Video: MP4 (H.264), WebM (VP8/VP9)\n• Audio: MP3, WAV, OGG`;
      setError(errorMsg);
      
      if (validFiles.length === 0) {
        setSaveStatus('Unsaved');
        return;
      }
    }

    let accumulatedDuration = 0;
    const newVideoClips: VideoClip[] = [];
    const newAudioClips: AudioClip[] = [];
    
    for (const file of validFiles) {
      const url = URL.createObjectURL(file);
      // Generate unique IDs outside of state updates to prevent React.StrictMode duplication
      const timestamp = Date.now();
      const randomId = Math.random();
      
      try {
        if (file.type.startsWith('video/')) {
          const duration = await getMediaDuration(url, 'video');
          newVideoClips.push({
            id: `vclip-${timestamp}-${randomId}`,
            file, url, duration, type: 'video',
            start: 0, // placeholder
            color: CLIP_COLORS[Math.floor(Math.random() * CLIP_COLORS.length)]
          });
          accumulatedDuration += duration;
        } else if (file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(url, 'audio');
           newAudioClips.push({
            id: `aclip-${timestamp}-${randomId}`,
            file, url, duration, type: 'audio',
            start: 0, // placeholder
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read media metadata.');
        URL.revokeObjectURL(url);
      }
    }

    setTracks(prevTracks => {
      let newTracks = [...prevTracks];
      
      // Handle video clips
      if (newVideoClips.length > 0) {
        const videoTrackIndex = newTracks.findIndex(t => t.type === 'video');
        if (videoTrackIndex !== -1) {
          const videoTrack = newTracks[videoTrackIndex] as VideoTrack;
          const updatedClips = videoTrack.clips.map(c => c.start >= insertionTime ? { ...c, start: c.start + accumulatedDuration } : c);
          const positionedNewClips = newVideoClips.map((c, i) => ({ ...c, start: insertionTime + newVideoClips.slice(0, i).reduce((acc, curr) => acc + curr.duration, 0) }));
          newTracks[videoTrackIndex] = { ...videoTrack, clips: [...updatedClips, ...positionedNewClips].sort((a,b) => a.start - b.start) };
        }
      }

      // Handle audio clips
      if (newAudioClips.length > 0) {
        let audioTrackIndex = newTracks.findIndex(t => t.type === 'audio');
        if (audioTrackIndex === -1) {
          newTracks.push({ id: `atrack-${Date.now()}`, type: 'audio', clips: []});
          audioTrackIndex = newTracks.length - 1;
        }
        const audioTrack = newTracks[audioTrackIndex] as AudioTrack;
        const positionedNewClips = newAudioClips.map(c => ({...c, start: insertionTime}));
        newTracks[audioTrackIndex] = { ...audioTrack, clips: [...audioTrack.clips, ...positionedNewClips].sort((a,b) => a.start - b.start) };
      }
      
      return newTracks;
    });

    setInsertionTime(prev => prev + accumulatedDuration);
    setSaveStatus('Unsaved');
  };
  
  const handleAddTrack = (type: 'audio' | 'text') => {
      setTracks(prev => [...prev, {id: `${type}-track-${Date.now()}`, type, clips: []}]);
  };

  const handleRemoveTrack = (trackId: string) => {
      setTracks(prev => prev.filter(t => t.id !== trackId));
      // You might want to revoke URLs of clips on the removed track
  };

  const handleAddCueToTimeline = (cue: ScriptCue) => {
      // Generate unique ID outside of state update to prevent React.StrictMode duplication
      const clipId = `tclip-${Date.now()}-${Math.random()}`;
      const textClip: TextClip = {
          id: clipId,
          type: 'text',
          text: cue.text,
          start: currentTime,
          duration: 4, // default duration
          color: cue.color
      };

      setTracks(prev => {
          const newTracks = [...prev];
          let textTrackIndex = newTracks.findIndex(t => t.type === 'text');
          if (textTrackIndex === -1) {
              newTracks.push({ id: `ttrack-${Date.now()}`, type: 'text', clips: [] });
              textTrackIndex = newTracks.length - 1;
          }
          const textTrack = newTracks[textTrackIndex] as CustomTextTrack;
          newTracks[textTrackIndex] = {...textTrack, clips: [...textTrack.clips, textClip]};
          return newTracks;
      });
  };

  const handleGenerateCues = async (prompt: string) => {
    if (!totalDuration) {
      setError("Please load a video first to get its duration.");
      return;
    }
    setIsLoadingAI(true);
    setError(null);
    setSaveStatus('Saving');
    try {
      const newCues = await generateScriptCuesWithRetry(prompt, totalDuration);
      setCues(newCues);
      setSaveStatus('Saved');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`AI Generation Failed: ${errorMessage}`);
      setSaveStatus('Unsaved');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTimeUpdate = useCallback((localTime: number) => {
    // Only update time from media elements if not in timeline playback mode
    if (!isTimelinePlayback && activeVideoClip) {
      setCurrentTime(localTime + activeVideoClip.start);
    }
  }, [isTimelinePlayback, activeVideoClip]);

  const handleSeek = useCallback((time: number) => {
    const newTime = Math.max(0, Math.min(time, totalDuration));
    if (newTime !== currentTime) {
       setCurrentTime(newTime);
    }
  }, [totalDuration, currentTime]);
  
  const handleSetInsertionTime = useCallback((time: number) => {
    const newTime = Math.max(0, Math.min(time, totalDuration));
    setInsertionTime(newTime);
    handleSeek(newTime);
  }, [totalDuration, handleSeek]);

  const handleMoveClip = useCallback((clipId: string, fromTrackId: string, toTrackId: string, newStart: number) => {
    setTracks(prevTracks => {
      const fromTrackIndex = prevTracks.findIndex(t => t.id === fromTrackId);
      const toTrackIndex = prevTracks.findIndex(t => t.id === toTrackId);
  
      if (fromTrackIndex === -1 || toTrackIndex === -1) {
        return prevTracks;
      }
  
      const fromTrack = prevTracks[fromTrackIndex];
      const clipToMove = fromTrack.clips.find(c => c.id === clipId);
  
      if (!clipToMove) {
        return prevTracks;
      }
  
      const toTrack = prevTracks[toTrackIndex];
      if (clipToMove.type !== toTrack.type) {
        return prevTracks;
      }
  
      const recompact = <T extends Clip>(clips: readonly T[]): T[] => {
          const sortedClips = [...clips].sort((a, b) => a.start - b.start);
          let currentPos = 0;
          return sortedClips.map(c => {
              const updatedClip = { ...c, start: currentPos };
              currentPos += c.duration;
              return updatedClip;
          });
      };
  
      const newTracks = [...prevTracks];
  
      // Update source track
      if (fromTrack.type === 'video') {
        const updatedClips = recompact((fromTrack.clips as VideoClip[]).filter(c => c.id !== clipId));
        newTracks[fromTrackIndex] = { ...fromTrack, clips: updatedClips };
      } else if (fromTrack.type === 'audio') {
        const updatedClips = recompact((fromTrack.clips as AudioClip[]).filter(c => c.id !== clipId));
        newTracks[fromTrackIndex] = { ...fromTrack, clips: updatedClips };
      } else { // text
        const updatedClips = recompact((fromTrack.clips as TextClip[]).filter(c => c.id !== clipId));
        newTracks[fromTrackIndex] = { ...fromTrack, clips: updatedClips };
      }

      const destTrackForUpdate = newTracks[toTrackIndex];
  
      // Update destination track
      if (destTrackForUpdate.type === 'video') {
        const updatedClips = recompact([...(destTrackForUpdate.clips as VideoClip[]), { ...(clipToMove as VideoClip), start: newStart }]);
        newTracks[toTrackIndex] = { ...destTrackForUpdate, clips: updatedClips };
      } else if (destTrackForUpdate.type === 'audio') {
        const updatedClips = recompact([...(destTrackForUpdate.clips as AudioClip[]), { ...(clipToMove as AudioClip), start: newStart }]);
        newTracks[toTrackIndex] = { ...destTrackForUpdate, clips: updatedClips };
      } else { // text
        const updatedClips = recompact([...(destTrackForUpdate.clips as TextClip[]), { ...(clipToMove as TextClip), start: newStart }]);
        newTracks[toTrackIndex] = { ...destTrackForUpdate, clips: updatedClips };
      }
  
      return newTracks;
    });
  }, []);

  // Full movie playback functionality
  const handlePlayFullMovie = useCallback(() => {
    if (totalDuration === 0) {
      setError('No clips to play');
      return;
    }

    if (isPlaying) {
      // Stop timeline playback
      setIsPlaying(false);
      setIsTimelinePlayback(false);
      if (timelinePlaybackRef.current) {
        clearInterval(timelinePlaybackRef.current);
        timelinePlaybackRef.current = null;
      }
      // Pause all media
      if (videoRef.current) {
        videoRef.current.pause();
      }
      audioRefs.current.forEach(audio => {
        audio.pause();
      });
    } else {
      // Start timeline playback from beginning
      console.log('🎬 Starting full movie playback - Duration:', totalDuration + 's');
      setCurrentTime(0);
      setIsPlaying(true);
      setIsTimelinePlayback(true);
      
      // Create timeline playback interval
      const startTime = Date.now();
      timelinePlaybackRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed >= totalDuration) {
          // Playback complete
          console.log('🎬 Full movie playback complete');
          setIsPlaying(false);
          setIsTimelinePlayback(false);
          setCurrentTime(totalDuration);
          if (timelinePlaybackRef.current) {
            clearInterval(timelinePlaybackRef.current);
            timelinePlaybackRef.current = null;
          }
        } else {
          // Update timeline position
          setCurrentTime(elapsed);
        }
      }, 100); // Update every 100ms for smooth playback
    }
  }, [totalDuration, isPlaying]);

  // Cleanup timeline playback on unmount
  useEffect(() => {
    return () => {
      if (timelinePlaybackRef.current) {
        clearInterval(timelinePlaybackRef.current);
      }
    };
  }, []);

  const allClips: Clip[] = tracks.flatMap<Clip>(t => t.clips);
  const allMediaClips: MediaClip[] = (tracks.filter((t): t is VideoTrack | AudioTrack => t.type === 'video' || t.type === 'audio')).flatMap<MediaClip>(t => t.clips);

  return (
    <>
      <div className="flex h-screen bg-promptus-dark text-promptus-text-primary font-sans">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 bg-black/50 z-30" 
            aria-hidden="true" 
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            saveStatus={saveStatus} 
            isLoadingAI={isLoadingAI}
            onExportClick={() => setIsExportModalOpen(true)}
            isExportDisabled={allClips.length === 0}
            onMenuClick={() => setIsSidebarOpen(true)}
            onApiKeySettingsClick={() => setIsApiKeySettingsOpen(true)}
          />
          <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-y-auto">
            <div className="flex flex-col gap-6 flex-grow-[2] basis-0 min-w-0">
              <Viewer
                activeVideoClip={activeVideoClip}
                activeAudioClips={activeAudioClips}
                activeTextClips={activeTextClips}
                videoRef={videoRef}
                audioRefs={audioRefs}
                onTimeUpdate={handleTimeUpdate}
                onPlayStateChange={setIsPlaying}
                isPlaying={isPlaying}
              />
              <Timeline
                duration={totalDuration}
                currentTime={currentTime}
                cues={cues}
                tracks={tracks}
                onSeek={handleSeek}
                activeCue={activeCue}
                insertionTime={insertionTime}
                onSetInsertionTime={handleSetInsertionTime}
                onAddTrack={handleAddTrack}
                onRemoveTrack={handleRemoveTrack}
                onMoveClip={handleMoveClip}
                onPlayFullMovie={handlePlayFullMovie}
                isPlaying={isPlaying}
              />
            </div>
            <div className="flex flex-col gap-6 lg:w-[384px] lg:flex-shrink-0">
              <MediaPool onFilesChange={handleFilesChange} tracks={tracks} scriptCues={cues} />
              <AIPanel 
                onGenerate={handleGenerateCues} 
                isLoading={isLoadingAI} 
                isDisabled={allClips.length === 0}
                activeCue={activeCue}
                onAddCueToTimeline={handleAddCueToTimeline}
              />
            </div>
          </main>
      </div>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </div>
    {isExportModalOpen && (
        <ExportModal
          clips={allMediaClips}
          onClose={() => setIsExportModalOpen(false)}
          setGlobalError={setError}
        />
    )}
    
    <ApiKeySettings
      isOpen={isApiKeySettingsOpen}
      onClose={() => setIsApiKeySettingsOpen(false)}
    />
  </>
);
}
