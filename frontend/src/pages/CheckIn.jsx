import React, { useState } from 'react';

// 1. DATA STRUCTURES
const deanerySections = {
  "Benin City Zone": ["Holy Cross Cathedral", "St. Joseph, 1st East Cir.", "St. Teresa, Ewah road", "St. Maria Goretti", "St. Paul, Airport road", "Blessed Tansi, New Benin", "St. Mulumba, M.M. Way", "Ascension Catholic Church, Airport Road", "St. Peter, Ugbor"],
  "Abudu Zone": ["St. Thomas Aquinas, Ikpoba Hill", "St. Patrick, Ikpoba Hill", "St. Fidelis, Aduwawa", "St. George, Oregbeni", "St. Jude, Iwogban", "St. Francis, College road", "St. Mark, Ohovbe", "Assumption Catholic Church, Uteh", "Catholic Church of Ascension, Uteh"],
  "Iguobazuwa Zone": ["St. Gabriel the Archangel", "Holy Trinity, Oka", "Miraculous Infant Jesus, Oka", "Sacred Heart, Evboriaria", "St. Matthias, Ologbo", "St. Mary, Iyanomo", "St. John Vianney, Ohoghobi", "St. Andrew, Ugbighoko", "St. Augustine, Ukhegie", "St. Jude, Ekehuan Barracks", "St. Matthew, Irhirhi", "St. Mary, Obe", "Good Shepherd, Asoro", "St. Andrew, Aruogba", "St. Agatha, Erediauwa", "Mary Mother of the Redeemer", "St. Polycarp, Ogheghe", "Good Shepherd, Evbuabogun", "St. Raphael, Upper Mission Extension", "St. Catherine of Siena, Ekae", "St. Johnpaul II, Evbuodia"]
};

const officialDirectory = [
  { id: 'exec-1', name: 'Mr. Abatsu Michael', role: 'President', parish: 'Holy Trinity, Oka' },
  { id: 'exec-2', name: 'Mrs. Ella Idahosa', role: 'Vice President', parish: 'St. Mary, Obe' },
  { id: 'exec-3', name: 'Mr. Osagie Ukhurebor', role: 'Secretary', parish: 'St. Joseph, 1st East Cir.' },
  { id: 'exec-4', name: 'Miss Anichikwu Chidimma', role: 'Assistant Secretary', parish: 'Assumption Catholic Church, Uteh' },
  { id: 'exec-5', name: 'Mr. Desmond Osaji', role: 'Treasurer', parish: 'St. Matthias, Ologbo' },
  { id: 'exec-6', name: 'Mrs. Augustina Okpara', role: 'Financial Secretary', parish: 'St. Paul, Airport road' },
  { id: 'exec-7', name: 'Mrs. Vivian Ugorji', role: 'Assistant Financial Secretary', parish: 'Blessed Tansi, New Benin' },
  { id: 'exec-8', name: 'Mr. CSP Isibor', role: 'PRO', parish: 'St. Augustine, Ukhegie' },
  { id: 'exec-9', name: 'Miss Nkeiruka Ifeachor', role: 'Welfare Officer', parish: 'Holy Cross Cathedral' },
  { id: 'exec-10', name: 'Mr. Onwe Paul', role: 'Provost', parish: 'Blessed Tansi, New Benin' }
];

export default function CheckIn() {
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // States
  const [search, setSearch] = useState('');
  const [selectedExec, setSelectedExec] = useState(null);
  const [guestForm, setGuestForm] = useState({ title: 'Mr.', firstName: '', lastName: '', parish: '', position: 'General Member / Delegate' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Determine Parish/Section
    const parish = isGuest ? guestForm.parish : selectedExec.parish;
    const section = Object.keys(deanerySections).find(s => deanerySections[s].includes(parish)) || "General";

    const payload = {
      isGuest,
      fullName: isGuest ? `${guestForm.title} ${guestForm.firstName} ${guestForm.lastName}` : selectedExec.name,
      role: isGuest ? guestForm.position : selectedExec.role,
      hierarchy: { section, parish }
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) setSubmitted(true);
    } catch (err) { alert('Network Error'); }
    setLoading(false);
  };

  if (submitted) return <div className="p-10 text-center font-bold text-green-600">Successfully Recorded!</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10">
      <h2 className="text-xl font-bold text-center mb-6">Attendance Register</h2>
      
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
        <button className={`w-1/2 py-2 rounded ${!isGuest ? 'bg-white shadow' : ''}`} onClick={() => setIsGuest(false)}>Official</button>
        <button className={`w-1/2 py-2 rounded ${isGuest ? 'bg-white shadow' : ''}`} onClick={() => setIsGuest(true)}>Guest</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isGuest ? (
          <div>
            <input placeholder="Type Executive Name..." className="w-full p-2 border rounded" onChange={(e) => setSearch(e.target.value)} />
            {search && !selectedExec && officialDirectory.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
              <div key={m.id} className="p-2 border-b cursor-pointer hover:bg-gray-50" onClick={() => setSelectedExec(m)}>{m.name}</div>
            ))}
            {selectedExec && <div className="mt-2 p-3 bg-blue-50 text-sm font-semibold text-blue-800 rounded">Selected: {selectedExec.name} ({selectedExec.parish})</div>}
          </div>
        ) : (
          <div className="space-y-3">
            <input className="w-full p-2 border rounded" placeholder="First Name" onChange={e => setGuestForm({...guestForm, firstName: e.target.value})} required />
            <input className="w-full p-2 border rounded" placeholder="Last Name" onChange={e => setGuestForm({...guestForm, lastName: e.target.value})} required />
            <select className="w-full p-2 border rounded" onChange={e => setGuestForm({...guestForm, parish: e.target.value})} required>
              <option value="">Select Parish</option>
              {Object.entries(deanerySections).map(([sec, list]) => <optgroup key={sec} label={sec}>{list.map(p => <option key={p} value={p}>{p}</option>)}</optgroup>)}
            </select>
          </div>
        )}
        <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg">Submit Entry</button>
      </form>
    </div>
  );
}