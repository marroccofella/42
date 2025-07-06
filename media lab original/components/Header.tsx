import React from 'react';
import { SparklesIcon, SaveIcon, ExportIcon, MenuIcon } from './icons';

interface HeaderProps {
  saveStatus: 'Unsaved' | 'Saving' | 'Saved';
  isLoadingAI: boolean;
  onExportClick: () => void;
  isExportDisabled: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ saveStatus, isLoadingAI, onExportClick, isExportDisabled, onMenuClick }) => {
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'Saved': return 'text-green-400';
      case 'Saving': return 'text-yellow-400';
      case 'Unsaved': return 'text-promptus-text-secondary';
    }
  };

  return (
    <header className="flex-shrink-0 bg-promptus-dark border-b border-promptus-border px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button
                onClick={onMenuClick}
                className="lg:hidden text-promptus-text-secondary hover:text-white transition-colors"
                aria-label="Open sidebar"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-promptus-text-primary">
            Media Lab
            </h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {isLoadingAI && (
            <div className="hidden md:flex items-center gap-2 text-promptus-accent animate-pulse">
              <SparklesIcon className="w-5 h-5" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div className={`hidden md:flex items-center gap-2 ${getStatusColor()}`}>
            <SaveIcon className="w-5 h-5" />
            <span>{saveStatus}</span>
          </div>
          <button
            onClick={onExportClick}
            disabled={isExportDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-promptus-accent hover:bg-promptus-accent-hover rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-promptus-border"
          >
            <ExportIcon className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
