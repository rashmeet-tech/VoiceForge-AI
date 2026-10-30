import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConversationProvider } from '@elevenlabs/react';
import App from './App';
import './index.css';
import './i18n';

import { DemoAuthProvider } from './context/DemoAuthContext';
import { VoiceCallProvider } from './context/VoiceCallContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConversationProvider>
        <VoiceCallProvider>
          <DemoAuthProvider>
            <App />
          </DemoAuthProvider>
        </VoiceCallProvider>
      </ConversationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
