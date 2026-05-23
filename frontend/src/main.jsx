import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Explicit extension to prevent loading errors

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Failed to find the root element. Make sure id='root' exists in index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}