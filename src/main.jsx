import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { MultiplayerProvider } from './hooks/useMultiplayerGame';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <MultiplayerProvider>
        <App />
      </MultiplayerProvider>
    </AuthProvider>
  </React.StrictMode>,
);