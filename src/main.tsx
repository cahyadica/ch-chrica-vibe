import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import ReactDOM from 'react-dom';
import App from './App.tsx';
import './index.css';

// --- Polyfills and Shims ---

// 0. window.fetch fix for environments where window.fetch is a getter-only property
// and libraries attempt to overwrite it.
if (typeof window !== 'undefined') {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch') || 
                      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
    
    // If it's a getter-only property, we need to make it writable
    if (descriptor && (descriptor.get && !descriptor.set) && descriptor.configurable) {
      const originalFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {}
}

// 1. react-dom.findDOMNode fix for React 19 / Libraries like react-quill
// @ts-ignore
if (!ReactDOM.findDOMNode) {
  // @ts-ignore
  ReactDOM.findDOMNode = (instance: any) => {
    if (!instance) return null;
    if (instance instanceof HTMLElement) return instance;
    return instance.el || instance.container || null;
  };
}

// --- End Shims ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
