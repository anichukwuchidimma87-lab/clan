import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import HeroSection from '../components/public/HeroSection';
import LeadershipShowcase from '../components/public/LeadershipShowcase';
import FeaturedGallery from '../components/public/FeaturedGallery';
import CommunityEvents from '../components/public/CommunityEvents';

function Landing() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [galleryReload, setGalleryReload] = useState(0);
  const [summaryReload, setSummaryReload] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);

  useEffect(() => {
    let active = true;
    const apiRoot = import.meta.env.VITE_API_URL || '';

    const fetchGallery = async () => {
      setLoadingGallery(true);
      setGalleryError(false);
      try {
        const response = await axios.get(`${apiRoot}/api/public/random-gallery`);
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Public gallery response was not successful.');
        }
        if (active) {
          setGalleryItems(response.data.data);
          setGalleryError(false);
        }
      } catch (error) {
        console.error('Could not fetch gallery items:', error);
        if (active) {
          setGalleryItems([]);
          setGalleryError(true);
        }
      } finally {
        if (active) setLoadingGallery(false);
      }
    };

    fetchGallery();
    return () => { active = false; };
  }, [galleryReload]);

  useEffect(() => {
    let active = true;
    const apiRoot = import.meta.env.VITE_API_URL || '';

    const fetchSummary = async () => {
      setLoadingSummary(true);
      setSummaryError(false);
      try {
        const response = await axios.get(`${apiRoot}/api/public/stats?year=${selectedYear}`);
        if (!response.data?.success || !response.data.data) {
          throw new Error('Public ledger summary response was not successful.');
        }
        if (active) {
          setFinancialSummary(response.data.data);
          setSummaryError(false);
        }
      } catch (error) {
        console.error('Could not fetch public ledger summary:', error);
        if (active) {
          setFinancialSummary(null);
          setSummaryError(true);
        }
      } finally {
        if (active) setLoadingSummary(false);
      }
    };

    fetchSummary();
    return () => { active = false; };
  }, [selectedYear, summaryReload]);

  const summaryCards = [
    { label: 'Total parishes', value: financialSummary?.totalParishes ?? 0, tone: 'text-indigo-700' },
    { label: 'Compliant parishes', value: financialSummary?.compliantParishes ?? 0, tone: 'text-emerald-700' },
    { label: 'Outstanding parishes', value: financialSummary?.outstandingParishes ?? 0, tone: 'text-amber-700' },
    { label: 'Registered lectors', value: financialSummary?.totalLectors ?? 0, tone: 'text-slate-800' }
  ];

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-800">
      <main>
        <HeroSection />
        <CommunityEvents />

        <section id="gallery" aria-labelledby="gallery-heading" className="bg-white py-14 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Life in our community"
              title="Community gallery"
              description="Explore moments from our events, service, and leadership across the deanery."
            />
            <FeaturedGallery
              items={galleryItems}
              loading={loadingGallery}
              error={galleryError}
              onRetry={() => setGalleryReload((current) => current + 1)}
            />
          </div>
        </section>

        <section id="ledger" aria-labelledby="ledger-heading" className="bg-slate-50 py-14 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="Open and accountable"
                title="Public ledger snapshot"
                description="A year-by-year view of parish participation and compliance, without exposing sensitive financial amounts."
                className="mb-0"
              />
              <label className="flex shrink-0 flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                Financial year
                <select
                  aria-label="Select financial year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className="min-w-36 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </div>

            {summaryError ? (
              <div role="alert" className="rounded-3xl border border-amber-200 bg-white p-6 text-sm text-amber-900 shadow-sm">
                <p>The public ledger summary is unavailable right now.</p>
                <button type="button" onClick={() => setSummaryReload((current) => current + 1)} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
                  Retry summary
                </button>
              </div>
            ) : loadingSummary ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading public ledger summary" role="status">
                {summaryCards.map((card) => (
                  <div key={card.label} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="mt-5 h-9 w-1/3 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : !financialSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                No public ledger summary is available for {selectedYear}.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
                  <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                    <p className={`mt-3 text-3xl font-black sm:text-4xl ${card.tone}`}>{Number(card.value).toLocaleString()}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">Financial year {selectedYear}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="leadership" aria-labelledby="leadership-heading" className="bg-white py-14 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="People who serve"
              title="Leadership team"
              description="Meet the leaders and patrons guiding the CLAN Benin Deanery in faith, service, and community."
            />
            <LeadershipShowcase />
          </div>
        </section>

        <section id="join" aria-labelledby="join-heading" className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-800 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Be part of the community</p>
              <h2 id="join-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Join CLAN Benin Deanery</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                Connect with fellow lectors, access community resources, and stay informed about upcoming activities.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-900 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/30">
                  Register with CLAN
                </Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/30">
                  Member sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 px-4 py-8 text-slate-300 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-center text-xs sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>&copy; {new Date().getFullYear()} CLAN Benin Deanery. Dedicated to the service of faith and community.</p>
          <a href="#top" className="font-semibold text-indigo-200 hover:text-white">Back to top</a>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, className = 'mb-8' }) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-indigo-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

export default Landing;
