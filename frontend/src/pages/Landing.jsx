import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/public/HeroSection';
import LeadershipShowcase from '../components/public/LeadershipShowcase';
import FeaturedGallery from '../components/public/FeaturedGallery';

function Landing() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearOptions = [2024, 2025, 2026, 2027];

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-blue-700">CLAN Benin Deanery</h1>
            <p className="text-sm text-gray-600">Leadership & Community Portal</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-blue-700 border border-blue-700 rounded hover:bg-blue-50 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Leadership Showcase Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Leadership Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Meet the visionary leaders and patrons guiding the CLAN Benin Deanery toward greater heights of service and spiritual growth.
          </p>
          <LeadershipShowcase />
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

      {/* Featured Gallery Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Live Community Gallery</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Every refresh brings a new combination of leadership, award, event, and community images pulled straight from the gallery engine.
          </p>
          <FeaturedGallery items={loadingGallery ? [] : galleryItems} />
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
