/// <reference lib="dom" />
import React, { useState } from 'react';
import type { ScriptCue } from '../types';
import { SparklesIcon, InformationCircleIcon } from './icons';

interface AIPanelProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  activeCue: ScriptCue | null;
  onAddCueToTimeline: (cue: ScriptCue) => void;
}

const examplePrompts = [
    "Create a short advert for Promptus.",
    "A fast-paced trailer for a sci-fi movie.",
    "A calm, instructional cooking video.",
    "An emotional monologue for a dramatic scene.",
];

export const AIPanel: React.FC<AIPanelProps> = ({ onGenerate, isLoading, isDisabled, activeCue, onAddCueToTimeline }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerateClick = () => {
    if (prompt && !isLoading) {
      onGenerate(prompt);
    }
  };
  
  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="bg-promptus-surface rounded-lg p-4 flex-grow flex flex-col border border-promptus-border min-h-0">
      <h2 className="text-lg font-semibold mb-2 text-promptus-text-primary flex items-center gap-2">
        <SparklesIcon className="w-6 h-6 text-promptus-accent"/>
        AI Studio
      </h2>
      
      <div className="flex-grow flex flex-col gap-4 min-h-0">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video's theme or desired script. e.g., 'A dramatic documentary intro about space exploration.'"
          className="w-full flex-grow bg-promptus-dark border border-promptus-border rounded-md p-2 text-promptus-text-primary focus:outline-none focus:ring-2 focus:ring-promptus-accent resize-none disabled:opacity-50"
          disabled={isDisabled || isLoading}
        />

        {!isDisabled && (
            <div>
                <p className="text-xs text-promptus-text-secondary mb-2">Or try an example:</p>
                <div className="flex flex-wrap gap-2">
                    {examplePrompts.map(p => (
                        <button 
                            key={p} 
                            onClick={() => handleExampleClick(p)}
                            className="text-xs bg-promptus-border hover:bg-promptus-border/70 text-promptus-text-secondary rounded-full px-3 py-1 transition-colors"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <button
          onClick={handleGenerateClick}
          disabled={!prompt || isLoading || isDisabled}
          className="w-full bg-gradient-to-r from-promptus-accent to-promptus-accent-hover text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-promptus-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Cues...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Generate Script
            </>
          )}
        </button>
      </div>

      <div className="mt-4 h-28 flex-shrink-0">
        {activeCue && (
             <div className="bg-promptus-dark/50 rounded-lg p-3 border border-promptus-border">
                <p className="text-sm font-semibold flex items-center gap-2" style={{color: activeCue.color}}>
                    <InformationCircleIcon className="w-5 h-5" />
                    Active Cue at {activeCue.time.toFixed(1)}s
                </p>
                <p className="text-sm text-promptus-text-primary mt-1 pl-7">{activeCue.text}</p>
                <button
                    onClick={() => onAddCueToTimeline(activeCue)}
                    className="mt-2 w-full text-sm bg-promptus-accent/20 hover:bg-promptus-accent/40 text-promptus-accent font-semibold py-1.5 px-3 rounded-md transition-colors"
                >
                    Add to Timeline
                </button>
             </div>
        )}
      </div>
    </div>
  );
};