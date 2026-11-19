import React, { useEffect, useState } from 'react';
import StatusNotice from '../components/StatusNotice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

export default function DeaneryTargets() {
  const [targets, setTargets] = useState({});
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [savingZone, setSavingZone] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const token = localStorage.getItem('clan_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadTargets = async () => {
    setLoading(true);
    setError('');
    try {
      const [targetsResponse, parishesResponse] = await Promise.all([
        fetch(`${API_BASE}/api/v1/deaneries`, { headers }),
        fetch(`${API_BASE}/api/v1/parishes/with-counts`, { headers })
      ]);
      const [targetsResult, parishesResult] = await Promise.all([
        targetsResponse.json(),
        parishesResponse.json()
      ]);
      if (!targetsResponse.ok || !targetsResult.success) {
        throw new Error(targetsResult.message || 'Unable to load deanery targets.');
      }
      if (!parishesResponse.ok || !parishesResult.success) {
        throw new Error(parishesResult.message || 'Unable to load parish coverage.');
      }

      setTargets(targetsResult.data || {});
      const uniqueZones = Array.from(new Set((parishesResult.data || []).map((parish) => parish.zone || 'Benin'))).sort();
      setZones(uniqueZones);
    } catch (loadError) {
      console.error('Failed to load deanery targets', loadError);
      setError(loadError.message || 'Unable to load deanery targets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const updateLocal = (zone, value) => setTargets((current) => ({ ...current, [zone]: Number(value) }));

  const saveAll = async () => {
    if (savingAll || savingZone) return;
    setSavingAll(true);
    setFeedback(null);
    const payload = zones.map((zone) => ({ deanery: zone, healthTarget: Number(targets[zone] || 50) }));
    try {
      const response = await fetch(`${API_BASE}/api/v1/deaneries`, { method: 'POST', headers, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save targets.');
      setFeedback({ type: 'success', text: 'All deanery targets saved.' });
    } catch (saveError) {
      console.error('Save targets failed', saveError);
      setFeedback({ type: 'error', text: saveError.message || 'Unable to save targets.' });
    } finally {
      setSavingAll(false);
    }
  };

  const saveOne = async (zone) => {
    if (savingAll || savingZone) return;
    setSavingZone(zone);
    setFeedback(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/deaneries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ deanery: zone, healthTarget: Number(targets[zone] || 50) })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || `Unable to save the ${zone} target.`);
      setFeedback({ type: 'success', text: `${zone} target saved.` });
    } catch (saveError) {
      console.error('Save one target failed', saveError);
      setFeedback({ type: 'error', text: saveError.message || `Unable to save the ${zone} target.` });
    } finally {
      setSavingZone(null);
    }
  };

  return (
    <main className="min-h-full bg-slate-50 px-4 py-8 text-sm text-slate-700 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-600">Planning and coverage</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Deanery health targets</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Set the target number of members for healthy parish coverage in each deanery.</p>
          </div>
          <button
            type="button"
            onClick={loadTargets}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {feedback && <StatusNotice type={feedback.type}>{feedback.text}</StatusNotice>}
        {error && (
          <StatusNotice type="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={loadTargets} className="font-bold underline underline-offset-2">Try again</button>
            </div>
          </StatusNotice>
        )}

        <section aria-label="Target values" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {loading ? (
            <div role="status" className="space-y-3">
              <span className="sr-only">Loading deanery targets</span>
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
              Target values are unavailable until the data can be loaded.
            </div>
          ) : zones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h2 className="font-bold text-slate-900">No deaneries available</h2>
              <p className="mt-2 text-sm text-slate-600">There are no parish deaneries to configure yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div key={zone} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900">{zone}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-600">Target number of members for healthy parish coverage.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="sr-only" htmlFor={`target-${zone}`}>Member target for {zone}</label>
                      <input
                        id={`target-${zone}`}
                        type="number"
                        min={1}
                        value={targets[zone] ?? 50}
                        onChange={(event) => updateLocal(zone, event.target.value)}
                        className="min-h-11 w-28 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => saveOne(zone)}
                        disabled={savingAll || savingZone !== null}
                        className="inline-flex min-h-11 min-w-20 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingZone === zone ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{zones.length} deanery {zones.length === 1 ? 'target' : 'targets'}</p>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={savingAll || savingZone !== null}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAll ? 'Saving all…' : 'Save all targets'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
