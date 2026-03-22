import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { registerServiceWorker } from './lib/registerServiceWorker';
import './styles/index.css';

function applyRuntimePerformanceHints() {
  if (typeof window === 'undefined') {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('native-runtime');
  }
}

applyRuntimePerformanceHints();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
