import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
  if (!events || events.length === 0) return null; // hide widget when none

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Community Events</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {events.map(ev => {
            const daysLeft = Math.ceil((new Date(ev.date) - new Date()) / (1000*60*60*24));
            return (
              <div key={ev._id} className="rounded-2xl border border-gray-100 p-4 shadow-sm bg-gradient-to-br from-white to-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{ev.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{ev.location || 'Venue TBA'}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(ev.date).toLocaleString()}</p>
                <p className="mt-3 text-sm font-semibold text-blue-700">{daysLeft > 0 ? `${daysLeft} day${daysLeft>1?'s':''} left` : 'Happening soon'}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
