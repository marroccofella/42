import { useState, useEffect } from 'react';
import { testApiKey, setUserApiKey, getApiKeyInfo } from '../services/geminiService';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [currentKeyInfo, setCurrentKeyInfo] = useState<{ source: string; key: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const keyInfo = getApiKeyInfo();
        setCurrentKeyInfo(keyInfo);
        if (keyInfo.source === 'user') {
          setApiKey(keyInfo.key);
        }
      } catch (error) {
        console.error('Error getting API key info:', error);
      }
    }
  }, [isOpen]);

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) {
      // Remove user key and use default
      setUserApiKey('');
      setValidationResult({ valid: true });
      setCurrentKeyInfo(getApiKeyInfo());
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await testApiKey(apiKey);
      setValidationResult(result);
      
      if (result.valid) {
        setUserApiKey(apiKey);
        setCurrentKeyInfo(getApiKeyInfo());
      }
    } catch (error) {
      setValidationResult({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDefault = () => {
    setApiKey('');
    setUserApiKey('');
    setValidationResult({ valid: true });
    setCurrentKeyInfo(getApiKeyInfo());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">API Key Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Key Status */}
          {currentKeyInfo && (
            <div className="bg-gray-700 rounded p-3">
              <p className="text-sm text-gray-300 mb-1">Current API Key:</p>
              <p className="text-xs font-mono text-green-400">
                {currentKeyInfo.key.substring(0, 12)}...{currentKeyInfo.key.slice(-4)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Source: {currentKeyInfo.source === 'user' ? 'Custom' : 
                        currentKeyInfo.source === 'env' ? 'Environment' : 'Default'}
              </p>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (leave empty to use default)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
            </p>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-3 rounded ${validationResult.valid ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {validationResult.valid ? (
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  API key is valid and working!
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2">❌</span>
                    API key validation failed
                  </div>
                  {validationResult.error && (
                    <p className="text-sm">{validationResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleValidateAndSave}
              disabled={isValidating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isValidating ? 'Validating...' : 'Validate & Save'}
            </button>
            <button
              onClick={handleUseDefault}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Use Default
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Your custom API key is stored locally and never shared
          </div>
        </div>
      </div>
    </div>
  );
}
