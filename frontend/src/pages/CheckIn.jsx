import React, { useState, useEffect } from 'react';

export default function CheckIn() {
  const [title, setTitle] = useState('Mr.'); // NEW: Title field state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [ageBracket, setAgeBracket] = useState('21–30');
  const [commissionedStatus, setCommissionedStatus] = useState('Not Commissioned');
  const [yearCommissioned, setYearCommissioned] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Employed');
  const [deanery, setDeanery] = useState('Benin');
  const [parishName, setParishName] = useState('');
  const [parishId, setParishId] = useState('');
  const [roleInParish, setRoleInParish] = useState('Active Member'); 

  // Remote dynamic options variables
  const [masterParishList, setMasterParishList] = useState([]);
  const [filteredParishes, setFilteredParishes] = useState([]);
  
  const [message, setMessage] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  // Generate an array of years for the dropdown selector (e.g., from 1980 up to current year)
  const currentYearInt = new Date().getFullYear();
  const yearsArray = Array.from({ length: currentYearInt - 1979 }, (_, index) => currentYearInt - index);

  // Pull server configuration options immediately upon opening link
  useEffect(() => {
    const pullOptions = async () => {
      try {
        const res = await fetch('https://clan-3slh.onrender.com/api/lectors/parishes-list');
        const resData = await res.json();
        if (resData.success) {
          setMasterParishList(resData.data);
          const initialMatches = resData.data.filter(p => p.deanery.toLowerCase() === deanery.toLowerCase());
          setFilteredParishes(initialMatches);
          if (initialMatches.length > 0) {
            setParishId(initialMatches[0]._id);
            setParishName(initialMatches[0].name);
          }
        }
      } catch (err) {
        console.error("Option generation loop error:", err);
      }
    };
    pullOptions();
  }, []);

  // Smart Filtering Cascade: Changing Deanery instantly rebuilds the Parish list option box
  const handleDeaneryChange = (selected) => {
    setDeanery(selected);
    const matches = masterParishList.filter(p => p.deanery.toLowerCase() === selected.toLowerCase());
    setFilteredParishes(matches);
    if (matches.length > 0) {
      setParishId(matches[0]._id);
      setParishName(matches[0].name);
    } else {
      setParishId('');
      setParishName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parishId) {
      setMessage({ text: "Please select an active parish from the list.", isError: true });
      return;
    }
    if (commissionedStatus === 'Commissioned' && !yearCommissioned) {
      setMessage({ text: 'Please select the year commissioned or choose Not Commissioned.', isError: true });
      return;
    }
    setSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title,
          firstName, 
          lastName, 
          phone, 
          gender, 
          ageBracket, 
          yearCommissioned: commissionedStatus === 'Commissioned' ? Number(yearCommissioned) : null,
          employmentStatus, 
          deanery, 
          parishId,
          roleInParish 
        })
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: `✓ Registration Successful! Welcome, ${title} ${firstName}. Your profile is active.`, isError: false });
        setFirstName(''); setLastName(''); setPhone('');
        setCommissionedStatus('Not Commissioned');
        setYearCommissioned('');
      } else {
        setMessage({ text: result.message, isError: true });
      }
    } catch (err) {
      setMessage({ text: "Connection error. Please try again.", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Benin Deanery Lector Registry</h1>
          <p className="text-xs text-gray-400 mt-1">Please fill out your deployment details carefully to register your profile.</p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed ${message.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
          
          {/* Row 1: Title selection and First Name layout */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-gray-500">Title</label>
              <select className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white font-bold" value={title} onChange={e => setTitle(e.target.value)}>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                
              </select>
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-gray-500">First Name</label>
              <input type="text" className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
          </div>

          {/* Row 2: Surname layout block */}
          <div>
            <label className="block mb-1 text-gray-500">Surname (Last Name)</label>
            <input type="text" className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-gray-500">Mobile Phone Line</label>
              <input type="tel" placeholder="080..." className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-gray-500">Gender</label>
              <select className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white font-bold" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-gray-500">Age Cohort Bracket</label>
              <select className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white" value={ageBracket} onChange={e => setAgeBracket(e.target.value)}>
                <option value="Under 20">Under 20</option>
                <option value="21–30">21–30</option>
                <option value="31–40">31–40</option>
                <option value="41–50">41–50</option>
                <option value="51+">51+</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-500">Commissioned Status</label>
              <select
                className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white"
                value={commissionedStatus}
                onChange={(e) => {
                  setCommissionedStatus(e.target.value);
                  if (e.target.value !== 'Commissioned') {
                    setYearCommissioned('');
                  }
                }}
              >
                <option value="Commissioned">Commissioned</option>
                <option value="Not Commissioned">Not Commissioned</option>
              </select>
            </div>

            {commissionedStatus === 'Commissioned' ? (
              <div>
                <label className="block mb-1 text-gray-500">Year Commissioned</label>
                <select 
                  className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white font-bold text-center" 
                  value={yearCommissioned} 
                  onChange={e => setYearCommissioned(e.target.value)}
                >
                  <option value="">Select year</option>
                  {yearsArray.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-slate-500">Choose the year you were commissioned. If not commissioned yet, choose "Not Commissioned" above.</p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Not commissioned members will be saved without a year value.
              </div>
            )}

            <div>
              <label className="block mb-1 text-gray-500">Employment State</label>
              <select className="border p-2.5 rounded-xl w-full bg-gray-50 text-gray-800 focus:outline-none focus:bg-white" value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}>
                <option value="Employed">Employed</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Student">Student</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 my-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-indigo-900 font-bold">1. Select Deanery Zone</label>
              <select className="border-2 border-indigo-100 p-2.5 rounded-xl w-full bg-indigo-50 text-indigo-950 focus:outline-none font-bold" value={deanery} onChange={e => handleDeaneryChange(e.target.value)}>
                <option value="Benin">Benin</option>
                <option value="Abudu">Abudu</option>
                <option value="Iguobazuwa">Iguobazuwa</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-indigo-900 font-bold">2. Select Assigned Parish Title</label>
              <select className="border-2 border-indigo-100 p-2.5 rounded-xl w-full bg-white text-gray-900 focus:outline-none font-bold" value={parishId} onChange={e => {
                const selected = filteredParishes.find(p => p._id === e.target.value);
                if (selected) {
                  setParishId(selected._id);
                  setParishName(selected.name);
                } else {
                  setParishId('');
                  setParishName('');
                }
              }} required>
                {filteredParishes.length === 0 ? (
                  <option value="">No Active Parishes Loaded</option>
                ) : (
                  filteredParishes.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-500">Your Current Office Designation</label>
            <select className="border p-2.5 rounded-xl w-full bg-gray-50 text-indigo-700 focus:outline-none font-black" value={roleInParish} onChange={e => setRoleInParish(e.target.value)}>
              <option value="Active Member">Active Member</option>
              <option value="Parish President">Parish President</option>
              <option value="Parish Vice President">Parish Vice President</option>
              <option value="Parish Secretary">Parish Secretary</option>
              <option value="Parish Executive">Parish Executive (Fin.Sec / PRO / etc)</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition tracking-wide shadow-sm disabled:opacity-50 text-sm mt-2">
            {submitting ? 'Transmitting Core Profile Records...' : 'Submit Official Roster Check-In'}
          </button>
        </form>
      </div>
    </div>
  );
}