import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusNotice from '../components/StatusNotice';

const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

const formatBirthday = ({ month, day }) =>
  new Date(Date.UTC(2020, month - 1, day, 12)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  });

export default function Birthdays() {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [draftingId, setDraftingId] = useState('');
  const token = localStorage.getItem('clan_token');

  const openWhatsAppDraft = async (birthday) => {
    const draftWindow = window.open('about:blank', '_blank');
    if (!draftWindow) {
      setDraftError('Allow pop-ups to open the WhatsApp message draft.');
      return;
    }
    draftWindow.opener = null;
    setDraftingId(birthday.id);
    setDraftError('');

    try {
      const response = await axios.get(
        `${apiBase}/api/lectors/birthdays/${encodeURIComponent(birthday.id)}/whatsapp-draft`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const draftUrl = response.data?.url;
      if (!response.data?.success || typeof draftUrl !== 'string' || !draftUrl.startsWith('https://wa.me/')) {
        throw new Error('The WhatsApp message draft could not be prepared.');
      }
      draftWindow.location.href = draftUrl;
    } catch (requestError) {
      draftWindow.close();
      setDraftError(requestError.response?.data?.message || requestError.message || 'The WhatsApp message draft could not be prepared.');
    } finally {
      setDraftingId('');
    }
  };

  useEffect(() => {
    let active = true;
    axios.get(`${apiBase}/api/lectors/birthdays?days=366`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Birthday records could not be loaded.');
        }
        if (active) {
          setBirthdays(response.data.data);
          setError('');
        }
      })
      .catch((requestError) => {
        console.error('Birthday list fetch error:', requestError);
        if (active) {
          setBirthdays([]);
          setError(requestError.response?.data?.message || 'Birthday records are temporarily unavailable.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-pink-600">Celebrate our community</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Birthdays</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upcoming birthdays within the community you are authorized to support.
          </p>
        </header>

        {error && <StatusNotice type="error" className="mb-5">{error}</StatusNotice>}
        {draftError && <StatusNotice type="error" className="mb-5">{draftError}</StatusNotice>}

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading birthdays...
          </div>
        ) : birthdays.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            There are no upcoming birthdays in your authorized community.
          </div>
        ) : (
          <section aria-label="Upcoming birthdays" className="grid gap-4 sm:grid-cols-2">
            {birthdays.map((birthday) => (
              <article
                key={`${birthday.month}-${birthday.day}-${birthday.name}-${birthday.parishName}`}
                className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-600">
                  {birthday.daysUntil === 0 ? 'Today' : `In ${birthday.daysUntil} day${birthday.daysUntil === 1 ? '' : 's'}`}
                </p>
                <h2 className="mt-2 text-lg font-black text-slate-900">{birthday.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatBirthday(birthday)}</p>
                <p className="mt-2 text-xs text-slate-500">Parish: {birthday.parishName || 'Not listed'}</p>
                {birthday.hasPhone ? (
                  <button
                    type="button"
                    onClick={() => openWhatsAppDraft(birthday)}
                    disabled={Boolean(draftingId)}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {draftingId === birthday.id ? 'Preparing message...' : 'Draft WhatsApp greeting'}
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">No contact number is available.</p>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
