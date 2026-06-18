import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/public/HeroSection';
import LeadershipShowcase from '../components/public/LeadershipShowcase';
import FeaturedGallery from '../components/public/FeaturedGallery';
import CommunityEvents from '../components/public/CommunityEvents';

function Landing() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);

  const yearOptions = [2024, 2025, 2026, 2027];
  const isAuthenticated = Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'));

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
    setGalleryDropdownOpen(false);
  };

  useEffect(() => {
    const apiRoot = import.meta.env.VITE_API_URL || '';

    const fetchGallery = async () => {
      try {
        setLoadingGallery(true);
        const response = await axios.get(`${apiRoot}/api/public/random-gallery`);
        console.log('Public random gallery response:', response.data);
        setGalleryItems(response.data.data || []);
      } catch (error) {
        console.error('Could not fetch gallery items:', error);
        setGalleryItems([]);
      } finally {
        setLoadingGallery(false);
      }
    };

    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const response = await axios.get(`${apiRoot}/api/public/stats?year=${selectedYear}`);
        console.log('Public ledger stats response for year', selectedYear, ':', response.data);
        setFinancialSummary(response.data.data || null);
      } catch (error) {
        console.error('Could not fetch public ledger summary:', error);
        setFinancialSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchGallery();
    fetchSummary();
  }, [selectedYear]);

  return (
    <div id="top" className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { navigate('/'); setMobileOpen(false); }}
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                CLAN Premium
              </button>
              <span className="hidden text-sm text-slate-500 md:inline">Community Portal</span>
            </div>

            <div className="hidden items-center gap-6 md:flex">
              <button
                type="button"
                onClick={() => { navigate('/'); scrollToSection('top'); }}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                Home
              </button>

              <div
                className="relative"
                onMouseEnter={() => setGalleryDropdownOpen(true)}
                onMouseLeave={() => setGalleryDropdownOpen(false)}
              >
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
                  <div className="absolute left-0 top-full mt-3 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                    {['Executives', 'VOALC', 'Seminar', 'Orphanage Visitation'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => scrollToSection('gallery')}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { navigate('/ledger'); setMobileOpen(false); }}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                Financials
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('leadership')}
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
                    onClick={() => { navigate('/login'); setMobileOpen(false); }}
                    className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition md:inline"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { navigate('/register'); setMobileOpen(false); }}
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
                  onClick={() => { navigate('/'); setMobileOpen(false); }}
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
                      {['Executives', 'VOALC', 'Seminar', 'Orphanage Visitation'].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => scrollToSection('gallery')}
                          className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-white transition"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { navigate('/ledger'); setMobileOpen(false); }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Financials
                </button>
                <button
                  type="button"
                  onClick={() => { scrollToSection('leadership'); setMobileOpen(false); }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Leadership
                </button>
                {!isAuthenticated && (
                  <>
                    <button
                      type="button"
                      onClick={() => { navigate('/login'); setMobileOpen(false); }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigate('/register'); setMobileOpen(false); }}
                      className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-blue-800 transition"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Community Events Section */}
      <CommunityEvents />

      {/* Featured Gallery Section */}
      <section id="gallery" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <h2 className="text-4xl font-bold text-gray-800">Live Community Gallery</h2>
            <p className="text-gray-600 max-w-2xl">
              Experience our premium portal gallery with the newest event chronicles leading into executive leadership highlights.
            </p>
          </div>
          <FeaturedGallery items={loadingGallery ? [] : galleryItems} />
        </div>
      </section>

      {/* Public Ledger Summary Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-gray-800">Public Ledger Snapshot</h2>
              <p className="text-gray-600 max-w-2xl">
                The Deanery publishes a transparent summary of parish compliance and community strength without exposing sensitive amounts.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Financial Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border-2 border-blue-700 rounded-lg font-semibold text-blue-700 bg-white hover:bg-blue-50 transition cursor-pointer"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-gray-400 mb-3">Total Parishes</p>
              <p className="text-4xl font-extrabold text-blue-700">{loadingSummary ? '—' : financialSummary?.totalParishes ?? 'N/A'}</p>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-gray-400 mb-3">Compliant Parishes</p>
              <p className="text-4xl font-extrabold text-emerald-600">{loadingSummary ? '—' : financialSummary?.compliantParishes ?? 'N/A'}</p>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-gray-400 mb-3">Outstanding Parishes</p>
              <p className="text-4xl font-extrabold text-amber-600">{loadingSummary ? '—' : financialSummary?.outstandingParishes ?? 'N/A'}</p>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-gray-400 mb-3">Registered Lectors</p>
              <p className="text-4xl font-extrabold text-slate-800">{loadingSummary ? '—' : financialSummary?.totalLectors ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Showcase Section */}
      <section id="leadership" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Leadership Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Meet the visionary leaders and patrons guiding the CLAN Benin Deanery toward greater heights of service and spiritual growth.
          </p>
          <LeadershipShowcase />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8 text-blue-100">
            Whether you're looking to connect with fellow members, access resources, or stay updated with the latest developments, we welcome you to be part of our growing network.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-white text-blue-700 font-semibold rounded hover:bg-gray-100 transition"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 CLAN Benin Deanery. Dedicated to the service of faith and community.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
