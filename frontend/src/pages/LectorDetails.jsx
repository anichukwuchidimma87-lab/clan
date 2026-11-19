import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

export default function LectorDetails() {
  const { lectorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const registryPath = `/registry${location.search}`;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadMember = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('clan_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/api/lectors/registry?limit=1000&page=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (!active) return;

        if (!result.success) {
          throw new Error(result.message || 'Unable to load lector details');
        }

        const rows = result.scope === 'all'
          ? (result.data || [])
          : (result.ownParish || result.data || []);
        const record = rows.find((item) => item._id === lectorId);
        if (!record) throw new Error('Lector not found');
        setMember(record);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load lector details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMember();
    return () => { active = false; };
  }, [lectorId, navigate]);

  const parishName = useMemo(() => (
    member?.parish?.name || member?.parishName || 'Unassigned'
  ), [member]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading lector details...
        </div>
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-white p-8">
          <p className="font-semibold text-rose-700">{error || 'Lector not found'}</p>
          <Link to={registryPath} className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Back to registry
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-slate-500">
          <Link to={registryPath} className="font-semibold text-indigo-700">Registry</Link>
          <span className="mx-2">/</span>
          <span>Lectors</span>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{member.firstName} {member.lastName}</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-black text-indigo-700">
                {(member.firstName || 'A').charAt(0).toUpperCase()}
                {(member.lastName || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Lector profile</p>
                <h1 className="mt-1 text-3xl font-black text-slate-900">{member.firstName} {member.lastName}</h1>
                <p className="mt-1 text-sm text-slate-500">{parishName}</p>
              </div>
            </div>
            <StatusBadge status={member.status || 'Active'} />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Personal information</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Detail label="Phone" value={member.phone || 'Not provided'} />
              <Detail label="Gender" value={member.gender || 'Not provided'} />
              <Detail label="Age bracket" value={member.ageBracket || 'Not provided'} />
              <Detail label="Date of birth" value={member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'Not provided'} />
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Registry information</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Detail label="Parish" value={parishName} />
              <Detail label="Role" value={member.roleInParish || 'Active Member'} />
              <Detail label="Commission year" value={member.yearCommissioned || 'Not provided'} />
              <Detail label="Employment status" value={member.employmentStatus || 'Not provided'} />
            </dl>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(registryPath)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to registry
          </button>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      {status}
    </span>
  );
}
