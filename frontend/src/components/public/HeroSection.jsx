import React, { useEffect, useState } from 'react';

function HeroSection() {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/settings`);
        const ct = res.headers.get('content-type') || '';
        const text = await res.text();
        if (!res.ok) return;
        let json;
        if (ct.includes('application/json')) json = JSON.parse(text);
        else {
          try { json = JSON.parse(text); } catch { json = { success: true, data: text }; }
        }
        const data = json?.data || {};
        if (mounted) setLogoUrl(data.logoUrl || '');
      } catch (e) {
        console.error('Failed to fetch site settings', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative h-96 bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop")',
        }}
      ></div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
        {logoUrl && (
          <img src={logoUrl} alt="CLAN logo" className="h-20 w-auto mb-4 rounded shadow-md object-contain" />
        )}
        <h1 className="text-5xl font-bold text-white mb-4">Catholic Lectors Association of Nigeria - Benin Deanery</h1>
        <p className="text-xl text-gray-100 max-w-2xl">
          Uniting parishes in faith, fostering leadership, and building a vibrant community of service and spiritual growth.
        </p>
      </div>
    </div>
  );
}

export default HeroSection;
