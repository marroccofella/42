/// <reference lib="dom" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Comprehensive React 18 createRoot management for HMR
const initializeReactRoot = () => {
  // Check if we already have a persisted root
  let root = (globalThis as any).__reactRoot;
  
  // Check if the container has any React fiber data
  const containerHasReactRoot = rootElement.hasChildNodes() || 
    (rootElement as any)._reactRootContainer ||
    (rootElement as any).__reactInternalInstance ||
    (rootElement as any).__reactContainer$ ||
    Object.keys(rootElement).some(key => key.startsWith('__react'));
  
  if (!root) {
    if (containerHasReactRoot) {
      console.log('🧹 Cleaning existing React data from container...');
      // Clear all React-related properties
      Object.keys(rootElement).forEach(key => {
        if (key.startsWith('__react') || key.startsWith('_react')) {
          delete (rootElement as any)[key];
        }
      });
      // Clear DOM content
      rootElement.innerHTML = '';
    }
    
    root = ReactDOM.createRoot(rootElement);
    (globalThis as any).__reactRoot = root;
    console.log('🚀 Created new React root');
  } else {
    console.log('♻️ Reusing existing React root for HMR');
  }
  
  return root;
};

const root = initializeReactRoot();
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);