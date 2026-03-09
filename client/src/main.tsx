import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './premium-overrides.css';
import './editorial-theme.css';

import { BrowserRouter } from 'react-router-dom';

import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './hooks/useAuth';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <AuthProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </AuthProvider>
        </HelmetProvider>
    </React.StrictMode>,
);
