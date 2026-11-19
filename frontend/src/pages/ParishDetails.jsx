import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

export default function ParishDetails() {
  const { parishId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const registryPath = `/registry${location.search}`;
  const [parish, setParish] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadParish = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('clan_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const [parishResponse, registryResponse] = await Promise.all([
          fetch(`${API_BASE}/api/lectors/parishes-list`, { headers }),
          fetch(`${API_BASE}/api/lectors/registry?limit=1000&page=1`, { headers })
        ]);

        const [parishResult, registryResult] = await Promise.all([
          parishResponse.json(),
          registryResponse.json()
        ]);

        if (!active) return;

        if (!parishResult.success || !registryResult.success) {
          throw new Error(parishResult.message || registryResult.message || 'Unable to load parish details');
        }

        const parishRecord = (parishResult.data || []).find((item) => item._id === parishId);
        if (!parishRecord) {
          throw new Error('Parish not found');
        }

        const registryRows = registryResult.scope === 'all'
          ? (registryResult.data || [])
          : (registryResult.ownParish || registryResult.data || []);

        setParish(parishRecord);
        setMembers(registryRows.filter((member) => {
          const memberParishId = member.parish?._id || member.parishId;
          return memberParishId === parishId || member.parishName === parishRecord.name;
        }));
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load parish details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadParish();
    return () => { active = false; };
  }, [navigate, parishId]);

  const summary = useMemo(() => {
    const activeMembers = members.filter((member) => (member.status || 'Active') === 'Active');
    const suspendedMembers = members.filter((member) => member.status === 'Suspended');
    return {
      total: members.length,
      active: activeMembers.length,
      suspended: suspendedMembers.length
    };
  }, [members]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading parish details...
        </div>
      </main>
    );
  }

  if (error || !parish) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-rose-200 bg-white p-8">
          <p className="font-semibold text-rose-700">{error || 'Parish not found'}</p>
          <Link to={registryPath} className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Back to registry
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="text-sm text-slate-500">
          <Link to={registryPath} className="font-semibold text-indigo-700">Registry</Link>
          <span className="mx-2">/</span>
          <span>Parishes</span>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{parish.name}</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-200">Parish profile</p>
              <h1 className="mt-2 text-3xl font-black">{parish.name}</h1>
              <p className="mt-2 text-sm text-slate-300">{parish.zone || 'Benin'} zone</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(registryPath)}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Back to registry
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Registered members" value={summary.total} tone="bg-white text-slate-900" />
          <Metric label="Active" value={summary.active} tone="bg-emerald-50 text-emerald-700" />
          <Metric label="Suspended" value={summary.suspended} tone="bg-amber-50 text-amber-700" />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Parish members</h2>
              <p className="mt-1 text-xs text-slate-500">{members.length} registered records</p>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No registered members are assigned to this parish.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <Link
                  key={member._id}
                  to={`/registry/lectors/${member._id}${location.search}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-bold text-slate-900">{member.firstName} {member.lastName}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.roleInParish || 'Active Member'}</p>
                  </div>
                  <StatusBadge status={member.status || 'Active'} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border border-slate-200 p-5 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      {status}
    </span>
  );
}
