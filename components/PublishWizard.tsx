/// <reference lib="dom" />
import React, { useState } from 'react';
import { generatePlatformCaptions } from '../services/captionService';
import type { CaptionResult } from '../services/captionService';
import { XIcon } from './icons';

interface PublishWizardProps {
  videoBlob: Blob;
  onClose: () => void;
}

const platforms: CaptionResult['platform'][] = ['youtube', 'tiktok'];

export default function PublishWizard({ videoBlob, onClose }: PublishWizardProps) {
  // MOCK transcript for AI caption generation. Real implementation should pass actual transcript.
  const transcript = '';

    const [step, setStep] = useState<'formats' | 'captions' | 'schedule' | 'done'>('formats');
  const [selectedPlatforms, setSelectedPlatforms] = useState<CaptionResult['platform'][]>([]);
  const [captions, setCaptions] = useState<CaptionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCaption = <K extends keyof CaptionResult>(platform: CaptionResult['platform'], key: K, value: CaptionResult[K]) => {
    setCaptions(prev => prev.map(c => c.platform === platform ? { ...c, [key]: value } as CaptionResult : c));
  };

  const handleNext = async () => {
    if (step === 'formats') {
      setLoading(true);
      setStep('captions');
      try {
        const results: CaptionResult[] = [];
        for (const p of selectedPlatforms) {
          const res = await generatePlatformCaptions('Video content', transcript, p);
          results.push(res);
        }
        setCaptions(results);
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    } else if (step === 'captions') {
      setStep('schedule');
    } else if (step === 'schedule') {
      setStep('done');
    }
  };

  // Step renderers
  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-promptus-surface w-full max-w-lg rounded-lg shadow-2xl border border-promptus-border flex flex-col p-6 space-y-4">
          <h2 className="text-xl font-bold text-promptus-text-primary">Publish Scheduled!</h2>
          <button onClick={onClose} className="bg-promptus-accent w-full rounded-md py-2 font-semibold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-promptus-surface w-full max-w-2xl rounded-lg shadow-2xl border border-promptus-border flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-promptus-border">
          <h2 className="text-xl font-bold text-promptus-text-primary">Publish Wizard (Prototype)</h2>
          <button onClick={onClose} className="text-promptus-text-secondary hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 text-promptus-text-secondary">
          {step === 'formats' && (
            <div>
              <p className="mb-4">Select platforms to generate captions for:</p>
              <div className="space-y-2">
                {platforms.map(p => (
                  <label key={p} className="flex items-center gap-2 text-promptus-text-primary">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p)}
                      onChange={e => {
                        setSelectedPlatforms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p));
                      }}
                    />
                    {p.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'captions' && (
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              {loading && <p>Generating captions...</p>}
              {error && <p className="text-red-400">{error}</p>}
              {captions.map(c => (
                <div key={c.platform} className="border border-promptus-border rounded-md p-3">
                  <h3 className="font-semibold text-promptus-accent mb-2">{c.platform.toUpperCase()}</h3>
                  {c.title && <div className="mb-2"><label className="text-sm">Title</label><input className="w-full bg-promptus-dark border border-promptus-border rounded p-1" value={c.title} onChange={e=>updateCaption(c.platform,'title',e.target.value)} /></div>}
                  {c.description && <div className="mb-2"><label className="text-sm">Description</label><textarea className="w-full bg-promptus-dark border border-promptus-border rounded p-1" value={c.description} onChange={e=>updateCaption(c.platform,'description',e.target.value)} /></div>}
                  {c.caption && <div className="mb-2"><label className="text-sm">Caption</label><textarea className="w-full bg-promptus-dark border border-promptus-border rounded p-1" value={c.caption} onChange={e=>updateCaption(c.platform,'caption',e.target.value)} /></div>}
                  {c.hashtags && <div className="mb-2"><label className="text-sm">Hashtags</label><input className="w-full bg-promptus-dark border border-promptus-border rounded p-1" value={c.hashtags.join(' ')} onChange={e=>updateCaption(c.platform,'hashtags',e.target.value.split(/\s+/))} /></div>}
                </div>
              ))}
            </div>
          )}

          {step === 'schedule' && (
            <div>
              <p className="mb-4">Upload/publish requires API keys. This step is disabled in the prototype.</p>
            </div>
          )}
        </main>
        <footer className="p-4 border-t border-promptus-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-promptus-border hover:bg-promptus-border/70 text-promptus-text-primary">Close</button>
          {step !== 'done' && (
            <button
              onClick={handleNext}
              disabled={
                (step === 'formats' && selectedPlatforms.length === 0) ||
                (step === 'captions' && loading)
              }
              className="px-4 py-2 rounded-md bg-promptus-accent text-white disabled:opacity-50"
            >
              {step === 'schedule' ? 'Finish' : 'Next'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
