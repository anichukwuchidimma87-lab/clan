import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const galleryItems = [
  { label: 'Event Chronicles', value: 'event-chronicles' },
  { label: 'Executives', value: 'executives' },
  { label: 'VOALC', value: 'voalc' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Orphanage Visitation', value: 'orphanage-visitation' }
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const legacyToken = !localStorage.getItem('clan_token')
    ? localStorage.getItem('authToken') || localStorage.getItem('token')
    : null;
  if (legacyToken) {
    localStorage.setItem('clan_token', legacyToken);
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
  }
  const isAuthenticated = Boolean(localStorage.getItem('clan_token'));

  useEffect(() => {
    setMobileOpen(false);
    setGalleryOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeDropdown = (event) => {
      if (
        !menuRef.current?.contains(event.target) &&
        !mobileMenuRef.current?.contains(event.target)
      ) {
        setGalleryOpen(false);
      }
    };
    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/public/settings`);
        const result = await response.json();
        if (active && response.ok) setLogoUrl(result.data?.logoUrl || '');
      } catch (error) {
        console.error('Failed to load the public header logo:', error);
      }
    };
    fetchSettings();
    return () => { active = false; };
  }, []);

  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
    setGalleryOpen(false);
  };

  const handleLogout = () => {
    ['clan_token', 'authToken', 'token', 'role', 'isLoggedIn'].forEach((key) => localStorage.removeItem(key));
    goTo('/login');
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const desktopLinkClass = (path) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
      isActive(path)
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
    }`;

  const mobileLinkClass = (path) =>
    `w-full rounded-xl px-4 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
      isActive(path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => goTo('/')} className="flex min-w-0 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label="Go to CLAN home">
          {logoUrl ? (
            <img src={logoUrl} alt="CLAN Benin Deanery" className="h-11 w-11 rounded-xl object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black tracking-wide text-indigo-700">CLAN</span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-tight text-slate-950 sm:text-base">CLAN Benin Deanery</span>
            <span className="hidden text-xs text-slate-500 md:block">Catholic Lectors Association</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          <button type="button" onClick={() => goTo('/')} className={desktopLinkClass('/')}>Home</button>
          {isAuthenticated && <button type="button" onClick={() => goTo('/dashboard')} className={desktopLinkClass('/dashboard')}>Workspace</button>}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setGalleryOpen((open) => !open)}
              aria-expanded={galleryOpen}
              aria-haspopup="true"
              className={`${desktopLinkClass('/gallery')} flex items-center gap-1`}
            >
              Gallery <span className={`text-[10px] transition ${galleryOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {galleryOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {galleryItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => goTo(`/gallery/${item.value}`)}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={() => goTo('/events')} className={desktopLinkClass('/events')}>Events</button>
          <button type="button" onClick={() => goTo('/financials')} className={desktopLinkClass('/financials')}>Financials</button>
          <button type="button" onClick={() => goTo('/leadership')} className={desktopLinkClass('/leadership')}>Leadership</button>
        </nav>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <button type="button" onClick={() => goTo('/login')} className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:inline-flex">
                Sign in
              </button>
              <button type="button" onClick={() => goTo('/register')} className="hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:inline-flex">
                Register
              </button>
            </>
          ) : (
            <button type="button" onClick={handleLogout} className="hidden rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 sm:inline-flex">
              Sign out
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-public-navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav id="mobile-public-navigation" ref={mobileMenuRef} className="mx-auto max-w-7xl space-y-1" aria-label="Mobile public navigation">
            <button type="button" onClick={() => goTo('/')} className={mobileLinkClass('/')}>Home</button>
            {isAuthenticated && <button type="button" onClick={() => goTo('/dashboard')} className={mobileLinkClass('/dashboard')}>Workspace</button>}
            <button type="button" onClick={() => setGalleryOpen((open) => !open)} aria-expanded={galleryOpen} aria-haspopup="true" className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              Gallery <span>{galleryOpen ? '−' : '+'}</span>
            </button>
            {galleryOpen && (
              <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                {galleryItems.map((item) => (
                  <button key={item.value} type="button" onClick={() => goTo(`/gallery/${item.value}`)} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => goTo('/events')} className={mobileLinkClass('/events')}>Events</button>
            <button type="button" onClick={() => goTo('/financials')} className={mobileLinkClass('/financials')}>Financials</button>
            <button type="button" onClick={() => goTo('/leadership')} className={mobileLinkClass('/leadership')}>Leadership</button>

            <div className="grid grid-cols-2 gap-2 pt-3">
              {!isAuthenticated ? (
                <>
                  <button type="button" onClick={() => goTo('/login')} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Sign in</button>
                  <button type="button" onClick={() => goTo('/register')} className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Register</button>
                </>
              ) : (
                <button type="button" onClick={handleLogout} className="col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">Sign out</button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
