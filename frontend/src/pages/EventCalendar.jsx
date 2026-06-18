import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiRoot = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiRoot}/api/events/all`);
        setEvents(res.data.data || []);
      } catch (err) {
        console.error('EventCalendar fetch error', err);
        setError('Could not load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <button onClick={() => navigate('/')} className="text-indigo-600 underline text-sm mb-4">&larr; Back to Home</button>
          <h1 className="text-4xl font-black text-slate-900">Events Calendar</h1>
          <p className="mt-3 text-slate-600">Browse the full deanery calendar for upcoming and completed events.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center">Loading events…</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-rose-200 text-rose-700">{error}</div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">No events available yet.</div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const isUpcoming = event.status === 'Upcoming' && new Date(event.date) >= new Date();
              const daysLeft = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={event._id} className={`rounded-3xl border p-6 shadow-sm ${isUpcoming ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className={`text-sm font-semibold uppercase tracking-[0.35em] ${isUpcoming ? 'text-indigo-700' : 'text-slate-500'}`}>{event.status}</p>
                      <h2 className="mt-3 text-2xl font-bold text-slate-900">{event.title}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-900">{new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-500">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Venue</p>
                      <p className="mt-2 text-sm text-slate-700">{event.location || 'Venue TBA'}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 border border-slate-200">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Countdown</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{isUpcoming ? `${daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining` : 'Today'}` : 'Past event'}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-slate-700 leading-relaxed">{event.description || 'Event details will be published soon.'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
