import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Point to the root-level re-export file to start the canonical import chain.
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);