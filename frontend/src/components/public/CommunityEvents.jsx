import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function CommunityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiRoot = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiRoot}/api/events/upcoming`);
        setEvents(res.data.data || []);
      } catch (err) {
        console.error('CommunityEvents fetch error', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="rounded-2xl bg-white p-6 shadow-sm">Loading events…</div>;
  if (!events || events.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Community Events</h2>
          <p className="text-slate-600">No upcoming events currently.</p>
          <Link to="/events" className="inline-flex mt-4 rounded-full bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">See All Events</Link>
        </div>
      </section>
    );
  }

  const featured = events[0];
  const otherEvents = events.slice(1);

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-bold">Upcoming Community Events</p>
            <h2 className="text-4xl font-black text-slate-900 mt-2">What’s next for our community</h2>
          </div>
          <Link to="/events" className="inline-flex items-center rounded-full border border-indigo-600 bg-indigo-50 px-4 py-2 text-indigo-700 font-semibold hover:bg-indigo-100">See All Events</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-900 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.35em] text-indigo-200/80">Featured Event</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/85">{featured.status}</span>
            </div>
            <h3 className="mt-6 text-3xl font-black leading-tight">{featured.title}</h3>
            <p className="mt-4 text-sm leading-7 text-indigo-100">{featured.description || 'A special upcoming moment for our deanery community.'}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-indigo-200">When</p>
                <p className="mt-2 font-semibold text-white">{new Date(featured.date).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-indigo-200">Where</p>
                <p className="mt-2 font-semibold text-white">{featured.location || 'Venue TBA'}</p>
              </div>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white">
              <span className="text-indigo-200">{Math.ceil((new Date(featured.date) - new Date()) / (1000*60*60*24)) > 0 ? `${Math.ceil((new Date(featured.date) - new Date()) / (1000*60*60*24))} days to go` : 'Happening soon'}</span>
            </div>
          </div>

          <div className="space-y-4">
            {otherEvents.map(ev => {
              const daysLeft = Math.ceil((new Date(ev.date) - new Date()) / (1000*60*60*24));
              return (
                <div key={ev._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Upcoming</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{ev.title}</h3>
                    </div>
                    <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-[11px] font-semibold text-indigo-700">{daysLeft > 0 ? `${daysLeft}d` : 'Soon'}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{ev.location || 'Venue TBA'}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(ev.date).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
