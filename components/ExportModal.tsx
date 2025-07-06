/// <reference lib="dom" />
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import type { MediaClip, ExportPreset, ExportState } from '../types';
import { loadFFmpeg, stitchAndExport } from '../services/ffmpegService';
import { XIcon } from './icons';

interface ExportModalProps {
  clips: MediaClip[];
  onClose: () => void;
  setGlobalError: (message: string) => void;
}

const PublishWizardLazy = lazy(() => import('./PublishWizard'));

const presets: ExportPreset[] = [
  { name: 'YouTube Shorts', width: 1080, height: 1920, format: 'mp4', vcodec: 'libx264', crf: 23, displayName: 'YouTube Shorts', description: '1080x1920 (9:16)' },
  { name: 'TikTok', width: 1080, height: 1920, format: 'mp4', vcodec: 'libx264', crf: 23, displayName: 'TikTok / Instagram Reels', description: '1080x1920 (9:16)' },
  { name: 'Standard HD', width: 1920, height: 1080, format: 'mp4', vcodec: 'libx264', crf: 20, displayName: 'Standard HD 1080p', description: '1920x1080 (16:9)' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ clips, onClose, setGlobalError }) => {
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle', progress: 0, message: '' });
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(presets[0]);
  const [showPublish, setShowPublish] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const handleLog = (message: string) => {
    setExportState(prev => ({ ...prev, message }));
  };

  const handleProgress = (progress: number) => {
    setExportState(prev => ({ ...prev, status: 'processing', progress }));
  };
  
  useEffect(() => {
    if(logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [exportState.message]);

  useEffect(() => {
    setExportState({ status: 'loading', progress: 0, message: 'Loading FFMPEG... Please wait.' });
    loadFFmpeg(handleLog)
      .then(() => setExportState({ status: 'idle', progress: 0, message: 'FFMPEG Loaded. Ready to export.' }))
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setExportState({ status: 'error', progress: 0, message: `Failed to load FFMPEG: ${msg}` });
      });
  }, []);

  const handleExport = async () => {
    if (!selectedPreset || exportState.status === 'processing' || exportState.status === 'loading') return;
    
    setExportState({ status: 'processing', progress: 0, message: 'Starting export...', outputUrl: undefined });
    try {
        const url = await stitchAndExport(clips, selectedPreset, handleProgress);
        const blob = await fetch(url).then(r => r.blob());
        setVideoBlob(blob);
        setExportState({ status: 'complete', progress: 1, message: 'Export finished!', outputUrl: url });
    } catch(err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setExportState({ status: 'error', progress: 0, message: `Export failed: ${msg}` });
        setGlobalError(`Export failed. Check console for details. Error: ${msg}`);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-promptus-surface w-full max-w-2xl rounded-lg shadow-2xl border border-promptus-border flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-promptus-border">
          <h2 className="text-xl font-bold text-promptus-text-primary">Export / Publish</h2>
          <button onClick={onClose} className="text-promptus-text-secondary hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-promptus-text-secondary mb-2">Select a Preset</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {presets.map(preset => (
                        <button 
                            key={preset.name}
                            onClick={() => setSelectedPreset(preset)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${selectedPreset.name === preset.name ? 'border-promptus-accent bg-promptus-accent/10' : 'border-promptus-border hover:border-promptus-border/70'}`}
                        >
                            <p className="font-bold text-promptus-text-primary">{preset.displayName}</p>
                            <p className="text-sm text-promptus-text-secondary">{preset.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="w-full bg-promptus-dark rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${exportState.progress * 100}%` }}></div>
                </div>
                <div ref={logContainerRef} className="text-xs text-promptus-text-secondary font-mono bg-promptus-dark rounded-md p-3 h-24 overflow-y-auto">
                    <p className="whitespace-pre-wrap break-all">{exportState.message || 'Waiting for process to start...'}</p>
                </div>
            </div>
        </main>
        
        <footer className="p-4 border-t border-promptus-border">
          {exportState.status === 'complete' && exportState.outputUrl ? (
              <>
                <a 
                   href={exportState.outputUrl} 
                   download={`promptus-export-${Date.now()}.${selectedPreset.format}`}
                   className="w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
               >
                   Download Video
                </a>
                <button
                   onClick={() => setShowPublish(true)}
                   className="mt-2 w-full text-center bg-promptus-accent hover:bg-promptus-accent-hover text-white font-bold py-3 px-4 rounded-md transition-colors"
                 >
                   Publish (Beta)
                 </button>
              </>
          ) : (
            <button
                onClick={handleExport}
                disabled={exportState.status === 'processing' || exportState.status === 'loading' || clips.length === 0}
                className="w-full bg-gradient-to-r from-promptus-accent to-promptus-accent-hover text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-promptus-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {exportState.status === 'processing' && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {exportState.status === 'loading' && 'Loading...'}
                {exportState.status === 'processing' && 'Exporting...'}
                {(exportState.status === 'idle' || exportState.status === 'error') && `Export as ${selectedPreset.displayName}`}
                {exportState.status === 'complete' && 'Export Again'}
            </button>
          )}
        </footer>

        {showPublish && videoBlob && (
          <Suspense fallback={null}>
            <PublishWizardLazy videoBlob={videoBlob} onClose={() => setShowPublish(false)} />
          </Suspense>
        )}
      </div>
    </div>
  );
};