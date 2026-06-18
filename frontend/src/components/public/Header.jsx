import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const galleryItems = [
  { label: 'Event Chronicles', value: 'event-chronicles' },
  { label: 'Executives', value: 'executives' },
  { label: 'VOALC', value: 'voalc' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Orphanage Visitation', value: 'orphanage-visitation' },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setGalleryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setGalleryDropdownOpen(false);
  }, [location.pathname]);

  const goTo = (path) => {
    navigate(path);
    setGalleryDropdownOpen(false);
    setMobileOpen(false);
  };

  const handleGallerySelect = (category) => {
    navigate(`/gallery/${category}`);
    setGalleryDropdownOpen(false);
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo('/')}
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            CLAN Premium
          </button>
          <span className="hidden text-sm text-slate-500 md:inline">Community Portal</span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={() => goTo('/')}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            Home
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setGalleryDropdownOpen((open) => !open)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Gallery
              <span className={`text-xs transition-transform duration-300 ${galleryDropdownOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            {galleryDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-3 w-60 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                {galleryItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleGallerySelect(item.value)}
                    className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => goTo('/financials')}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            Financials
          </button>

          <button
            type="button"
            onClick={() => goTo('/leadership')}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            Leadership
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => goTo('/login')}
                className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition md:inline"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => goTo('/register')}
                className="hidden rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition md:inline"
              >
                Register
              </button>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => goTo('/')}
              className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Home
            </button>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => setGalleryDropdownOpen((open) => !open)}
                className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Gallery
                <span>{galleryDropdownOpen ? '−' : '+'}</span>
              </button>
              {galleryDropdownOpen && (
                <div className="mt-2 space-y-2 px-2">
                  {galleryItems.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleGallerySelect(item.value)}
                      className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-white transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => goTo('/financials')}
              className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Financials
            </button>
            <button
              type="button"
              onClick={() => goTo('/leadership')}
              className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Leadership
            </button>
            {!isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => goTo('/login')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/register')}
                  className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-blue-800 transition"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Header;
