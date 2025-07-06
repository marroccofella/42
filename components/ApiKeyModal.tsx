/// <reference lib="dom" />
import React, { useState, useEffect } from 'react';
import { XIcon, KeyIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  currentApiKey, 
  onApiKeyChange 
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [isValid, setIsValid] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const handleSave = () => {
    if (apiKey.trim()) {
      onApiKeyChange(apiKey.trim());
      onClose();
    }
  };

  const handleReset = () => {
    const defaultKey = 'AIzaSyDn7Xa2yLlJPmA585Po1-K9tqXHSS9HlG0';
    setApiKey(defaultKey);
    onApiKeyChange(defaultKey);
  };

  const validateApiKey = (key: string) => {
    // Basic validation for Gemini API key format
    const isValidFormat = key.startsWith('AIza') && key.length >= 35;
    setIsValid(isValidFormat);
    return isValidFormat;
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    validateApiKey(newKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-promptus-surface border border-promptus-border rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-promptus-border">
          <div className="flex items-center gap-3">
            <KeyIcon className="w-6 h-6 text-promptus-accent" />
            <h2 className="text-lg font-semibold text-promptus-text-primary">
              API Key Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-promptus-text-secondary hover:text-white transition-colors"
            title="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-promptus-text-primary mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={handleKeyChange}
                placeholder="Enter your Gemini API key"
                className={`w-full bg-promptus-dark border rounded-md px-3 py-2 pr-10 text-promptus-text-primary focus:outline-none focus:ring-2 focus:ring-promptus-accent transition-colors ${
                  isValid ? 'border-promptus-border' : 'border-red-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-promptus-text-secondary hover:text-white transition-colors"
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Validation Status */}
            <div className="flex items-center gap-2 mt-2">
              {isValid ? (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Valid API key format</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>Invalid API key format</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-promptus-dark/50 rounded-md p-3">
            <p className="text-sm text-promptus-text-secondary mb-2">
              <strong className="text-promptus-text-primary">How to get your API key:</strong>
            </p>
            <ol className="text-sm text-promptus-text-secondary space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-promptus-accent hover:underline">Google AI Studio</a></li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-promptus-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-promptus-text-secondary hover:text-white transition-colors"
          >
            Use Default Key
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-promptus-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || !apiKey.trim()}
              className="px-4 py-2 bg-promptus-accent hover:bg-promptus-accent-hover text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
