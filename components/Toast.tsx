/// <reference lib="dom" />
import React, { useEffect, useState } from 'react';
import { XIcon, InformationCircleIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 6000); // Auto-dismiss after 6 seconds

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    // Allow for fade-out animation before calling onClose
    setTimeout(onClose, 300);
  };

  const baseClasses = "fixed bottom-5 right-5 max-w-sm w-full p-4 rounded-lg shadow-lg flex items-start gap-4 z-50 transition-all duration-300 border-l-4";
  const visibleClasses = "transform translate-y-0 opacity-100";
  const hiddenClasses = "transform translate-y-10 opacity-0";

  const typeStyles = {
    error: {
      borderColor: 'border-red-500',
      icon: <InformationCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />,
    },
    success: {
      borderColor: 'border-green-500',
      icon: <InformationCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />,
    },
    info: {
      borderColor: 'border-blue-500',
      icon: <InformationCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />,
    },
  };

  return (
    <div className={`${baseClasses} bg-promptus-surface/80 backdrop-blur-md ${typeStyles[type].borderColor} ${visible ? visibleClasses : hiddenClasses}`}>
      {typeStyles[type].icon}
      <div className="flex-grow text-sm">
        <p className="font-bold text-promptus-text-primary capitalize">{type}</p>
        <p className="text-promptus-text-secondary">{message}</p>
      </div>
      <button onClick={handleClose} className="text-promptus-text-secondary/70 hover:text-promptus-text-primary transition-colors">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};