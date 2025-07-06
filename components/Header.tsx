import React from 'react';
import { SparklesIcon, SaveIcon, ExportIcon, MenuIcon, PromptusLogoIcon } from './icons';

interface HeaderProps {
  saveStatus: 'Unsaved' | 'Saving' | 'Saved';
  isLoadingAI: boolean;
  onExportClick: () => void;
  isExportDisabled: boolean;
  onMenuClick: () => void;
  onApiKeySettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ saveStatus, isLoadingAI, onExportClick, isExportDisabled, onMenuClick, onApiKeySettingsClick }) => {
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'Saved': return 'text-green-400';
      case 'Saving': return 'text-yellow-400';
      case 'Unsaved': return 'text-promptus-text-secondary';
    }
  };

  return (
    <header className="flex-shrink-0 bg-promptus-dark border-b border-promptus-border px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={onMenuClick}
                className="text-promptus-text-secondary hover:text-white transition-colors p-1"
                aria-label="Open sidebar"
            >
                <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
                <PromptusLogoIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-promptus-text-primary truncate">
                    <span className="hidden sm:inline">Promptus AI Media Lab</span>
                    <span className="sm:hidden">Promptus</span>
                </h1>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
          {isLoadingAI && (
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-promptus-accent animate-pulse">
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden md:inline">AI is thinking...</span>
              <span className="md:hidden">AI...</span>
            </div>
          )}
          <div className={`hidden sm:flex items-center gap-1 sm:gap-2 ${getStatusColor()}`}>
            <SaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">{saveStatus}</span>
            <span className="md:hidden text-xs">Saved</span>
          </div>
          <button
            onClick={onApiKeySettingsClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-promptus-text-secondary hover:text-white hover:bg-promptus-border rounded-md transition-all"
            title="API Key Settings"
          >
            <span className="text-base sm:text-lg">🔑</span>
            <span className="hidden lg:inline">API</span>
          </button>
          <button
            onClick={onExportClick}
            disabled={isExportDisabled}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-promptus-accent hover:bg-promptus-accent-hover rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-promptus-border text-xs sm:text-sm"
          >
            <ExportIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
