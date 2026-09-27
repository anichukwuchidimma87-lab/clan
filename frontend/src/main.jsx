import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Ensure this line exists

// Fetch public settings once at startup to set favicon and title
(async function initApp() {
  const apiBase = import.meta.env.VITE_API_URL || '';
  try {
    const res = await fetch(`${apiBase}/api/public/settings`);
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    let json;
    if (ct.includes('application/json')) json = JSON.parse(text);
    else {
      try { json = JSON.parse(text); } catch { json = { success: true, data: text }; }
    }
    const data = json?.data || {};
    if (data.name) document.title = data.name;
    const logo = data.logoUrl;
    if (logo) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = logo;
    }
  } catch (e) {
    console.error('Could not fetch site settings', e);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();