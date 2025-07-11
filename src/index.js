import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

// Render the main App component
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
    <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../service-worker.js') // Path relative to this file's location in js/
    .then(registration => {
      console.log('Service worker registration succeeded:', registration);
    })
    .catch(error => {
      console.error(`Service worker registration failed: ${error}`);
    });
  });
} else {
  console.error('Service workers are not supported.');
}
