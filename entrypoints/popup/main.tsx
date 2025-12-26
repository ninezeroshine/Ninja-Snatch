/**
 * Popup Entry Point
 * 
 * Mounts the React application to the popup container.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Root element not found');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
