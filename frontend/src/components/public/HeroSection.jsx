import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
    <section aria-labelledby="public-hero-heading" className="relative isolate min-h-[30rem] overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-950 sm:min-h-[34rem]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop")',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-indigo-950/65 to-blue-900/70" />

      <div className="relative mx-auto flex min-h-[30rem] max-w-7xl flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[34rem] sm:px-6 lg:px-8">
        {logoUrl && (
          <img src={logoUrl} alt="CLAN Benin Deanery logo" className="mb-5 h-16 w-auto rounded-xl bg-white/95 p-2 object-contain shadow-lg sm:h-20" />
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200 sm:text-xs">Faith · Service · Community</p>
        <h1 id="public-hero-heading" className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Catholic Lectors Association of Nigeria
          <span className="mt-2 block text-indigo-200">Benin Deanery</span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-100 sm:text-lg">
          Uniting parishes in faith, fostering leadership, and building a vibrant community of service and spiritual growth.
        </p>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/30">
            Join the community
          </Link>
          <Link to="/events" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30">
            Explore events
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
