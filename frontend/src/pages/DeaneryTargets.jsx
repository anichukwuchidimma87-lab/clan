import React, { useEffect, useState } from 'react';

export default function DeaneryTargets() {
  const [targets, setTargets] = useState({});
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('clan_token');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tRes, pRes] = await Promise.all([
          fetch('/api/v1/deaneries', { headers }),
          fetch('/api/v1/parishes/with-counts', { headers })
        ]);
        const tJson = await tRes.json();
        const pJson = await pRes.json();
        if (tJson.success) setTargets(tJson.data || {});
        if (pJson.success) {
          const uniq = Array.from(new Set((pJson.data || []).map(p => p.zone || 'Benin'))).sort();
          setZones(uniq);
        }
      } catch (err) {
        console.error('Failed to load deanery targets', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateLocal = (zone, value) => setTargets(prev => ({ ...prev, [zone]: Number(value) }));

  const saveAll = async () => {
    const payload = zones.map(z => ({ deanery: z, healthTarget: Number(targets[z] || 50) }));
    try {
      const res = await fetch('/api/v1/deaneries', { method: 'POST', headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) {
        alert('Saved targets');
      } else {
        alert(json.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Network error');
    }
  };

  const saveOne = async (zone) => {
    try {
      const res = await fetch('/api/v1/deaneries', { method: 'POST', headers, body: JSON.stringify({ deanery: zone, healthTarget: Number(targets[zone] || 50) }) });
      const json = await res.json();
      if (json.success) alert('Saved'); else alert(json.message || 'Save failed');
    } catch (err) {
      console.error('Save one failed', err); alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-700">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Deanery Health Targets</h1>
            <div className="text-xs text-slate-500">Manage per-deanery parish health targets</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          {loading && <div>Loading…</div>}
          {!loading && (
            <div>
              <div className="space-y-2">
                {zones.map(zone => (
                  <div key={zone} className="flex items-center justify-between gap-4 border-b py-3">
                    <div>
                      <div className="font-semibold">{zone}</div>
                      <div className="text-xs text-slate-500">Set target number of members for healthy parish coverage</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={targets[zone] ?? 50} onChange={e => updateLocal(zone, e.target.value)} className="rounded-xl border p-2 w-28" />
                      <button onClick={() => saveOne(zone)} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Save</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={saveAll} className="rounded-2xl bg-emerald-600 px-4 py-2 text-white">Save All</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
