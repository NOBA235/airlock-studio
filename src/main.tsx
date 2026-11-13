/**
 * AIRLOCK STUDIO - APPLICATION ENTRY POINT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@excalidraw/excalidraw/dist/excalidraw.min.css';
import App from './App';
import './index.css';

// Initialize Remote Config on app startup
import { initializeRemoteConfig } from './config/firebase';
initializeRemoteConfig().catch(console.error);

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
