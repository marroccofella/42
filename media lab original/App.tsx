/// <reference lib="dom" />
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MediaPool } from './components/MediaPool';
import { Viewer } from './components/Viewer';
import { Timeline } from './components/Timeline';
import { AIPanel } from './components/AIPanel';
import { generateScriptCues } from './services/geminiService';
import type { ScriptCue, Track, VideoClip, AudioClip, TextClip, Clip, VideoTrack, AudioTrack, CustomTextTrack, MediaClip } from './types';
import { Toast } from './components/Toast';
import { ExportModal } from './components/ExportModal';

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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

  const handleFilesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSaveStatus('Saving');

    let accumulatedDuration = 0;
    const newVideoClips: VideoClip[] = [];
    const newAudioClips: AudioClip[] = [];
    
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      try {
        if (file.type.startsWith('video/')) {
          const duration = await getMediaDuration(url, 'video');
          newVideoClips.push({
            id: `vclip-${Date.now()}-${Math.random()}`,
            file, url, duration, type: 'video',
            start: 0, // placeholder
            color: CLIP_COLORS[Math.floor(Math.random() * CLIP_COLORS.length)]
          });
          accumulatedDuration += duration;
        } else if (file.type.startsWith('audio/')) {
          const duration = await getMediaDuration(url, 'audio');
           newAudioClips.push({
            id: `aclip-${Date.now()}-${Math.random()}`,
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
      const textClip: TextClip = {
          id: `tclip-${Date.now()}`,
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
      const newCues = await generateScriptCues(prompt, totalDuration);
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

  const handleTimeUpdate = (localTime: number) => {
    if (activeVideoClip) {
        setCurrentTime(localTime + activeVideoClip.start);
    }
  };
  
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

  const allClips = tracks.flatMap(t => t.clips);
  const allMediaClips: MediaClip[] = (tracks.filter(t => t.type === 'video' || t.type === 'audio') as (VideoTrack | AudioTrack)[]).flatMap(t => t.clips);

  return (
    <>
      <div className="flex h-screen bg-promptus-dark text-promptus-text-primary font-sans">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" aria-hidden="true" />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            saveStatus={saveStatus} 
            isLoadingAI={isLoadingAI}
            onExportClick={() => setIsExportModalOpen(true)}
            isExportDisabled={allClips.length === 0}
            onMenuClick={() => setIsSidebarOpen(true)}
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
              />
            </div>
            <div className="flex flex-col gap-6 lg:w-[384px] lg:flex-shrink-0">
              <MediaPool onFilesChange={handleFilesChange} tracks={tracks} />
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
    </>
  );
}
