import React, { useState } from 'react';

// Real Benin City Deanery Lectors Executive Council Directory
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

// Master List of Official Executive Roles (Deanery Level)
const executiveRoles = [
  "President",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Financial Secretary",
  "Assistant Financial Secretary",
  "PRO",
  "Welfare Officer",
  "Provost"
];

// Master List of Delegate Positions (Parish Level Dropdown)
const parishPositions = [
  "Parish President",
  "Parish Vice President",
  "Parish Secretary",
  "Parish Assistant Secretary",
  "Parish Financial Secretary",
  "Parish Treasurer",
  "Parish PRO",
  "Parish Welfare Officer",
  "Parish Provost",
  "General Member / Delegate"
];

// Official 41 Parishes from the Delegate Conference Attendance sheet
const deaneryParishes = [
  "Assumption Catholic Church, Uteh", "Blessed Tansi, New Benin", "St. Joseph, 1st East Cir.",
  "St. Teresa, Ewah road", "Holy Cross Cathedral", "Holy Spirit, Okhoro", "Holy Trinity, Oka",
  "Sacred Heart, Evboriaria", "St. Maria Goretti", "St. Matthias, Ologbo", "St. Mary, Iyanomo",
  "St. Gabriel the Archangel", "St. John Vianney, Ohoghobi", "St. Andrew, Ugbighoko",
  "St. Augustine, Ukhegie", "St. Jude, Ekehuan Barracks", "St. Thomas Aquinas, Ikpoba Hill",
  "St. Paul, Airport road", "St. Fidelis, Aduwawa", "St. George, Oregbeni", "St. Jude, Iwogban",
  "St. Francis, College road", "St. Peter, Ugbor", "St. Mulumba, M.M. Way",
  "Immaculate Conception Catholic Church, St. Saviour", "St. Patrick, Ikpoba Hill",
  "Miraculous Infant Jesus, Oka", "St. Matthew, Irhirhi", "St. Mary, Obe", "Good Shepherd, Asoro",
  "St. Andrew, Aruogba", "St. Agatha, Erediauwa", "Mary Mother of the Redeemer",
  "St. Mark, Ohovbe", "St. Polycarp, Ogheghe", "Good Shepherd, Evbuabogun",
  "St. Raphael, Upper Mission Extension", "St. Catherine of Siena, Ekae",
  "Catholic Church of Ascension, Uteh", "Ascension Catholic Church, Airport Road",
  "St. Johnpaul II, Evbuodia"
].sort();

export default function CheckIn() {
  const [isGuest, setIsGuest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Track selectable role state for deanery executives
  const [selectedExecutiveRole, setSelectedExecutiveRole] = useState('');
  
  // Track structured guest/delegate fields
  const [guestForm, setGuestForm] = useState({ 
    title: '', firstName: '', lastName: '', parish: '', position: '' 
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Type-Ahead Filter for Executives
  const filteredMembers = searchQuery
    ? officialDirectory.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Populate selection with executive defaults
  const handleSelectExecutive = (member) => {
    setSelectedMember(member);
    setSelectedExecutiveRole(member.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // ✅ Dynamic API Switch: Uses Vercel configuration variable in production or falls back to localhost locally
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const attendancePayload = {
      isGuest,
      timestamp: new Date().toISOString(),
      details: !isGuest 
        ? {
            memberId: selectedMember?.id,
            fullName: selectedMember?.name,
            parish: selectedMember?.parish,
            role: selectedExecutiveRole
          }
        : {
            title: guestForm.title,
            firstName: guestForm.firstName,
            lastName: guestForm.lastName,
            fullName: `${guestForm.title} ${guestForm.firstName} ${guestForm.lastName}`,
            parish: guestForm.parish,
            role: guestForm.position
          }
    };

    try {
      // ✅ Connected to dynamic endpoint URL pipeline securely
      const response = await fetch(`${API_BASE_URL}/api/v1/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendancePayload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSearchQuery('');
        setSelectedMember(null);
        setSelectedExecutiveRole('');
        setGuestForm({ title: '', firstName: '', lastName: '', parish: '', position: '' });
        setSubmitted(true);
      } else {
        alert(`Server Refused Entry: ${data.message || 'Unknown processing failure'}`);
      }
    } catch (error) {
      console.error('Network Pipeline Error:', error);
      alert('Could not safely connect to the database pipeline. Please verify network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 text-center text-white">
        <div className="max-w-md bg-white text-gray-900 p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 font-bold">✓</div>
          <h2 className="text-2xl font-bold">Check-In Successful!</h2>
          <p className="text-gray-600 mt-2">Thank you for signing in. Your attendance has been cleanly recorded on the server registry.</p>
          <button onClick={() => setSubmitted(false)} className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">
            Register Another Attendee
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        
        {/* Top Association Branding Layout */}
        <div className="text-center mb-6 border-b border-gray-100 pb-4">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md mb-2">C</div>
          <h2 className="text-xl font-bold text-gray-900">Meeting Sign-In Register</h2>
          <p className="text-xs text-gray-500 mt-1">Benin-City Deanery Lectors Association</p>
        </div>

        {/* Toggle between Registered Member and Guest */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6 text-sm font-medium">
          <button 
            type="button"
            className={`w-1/2 py-2 rounded-md transition ${!isGuest ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => { setIsGuest(false); setSelectedMember(null); setSearchQuery(''); setSelectedExecutiveRole(''); }}
          >
            Official Registry
          </button>
          <button 
            type="button"
            className={`w-1/2 py-2 rounded-md transition ${isGuest ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setIsGuest(true)}
          >
            Guest / Delegate
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isGuest ? (
            /* TYPE-AHEAD SEARCH AUTOCOMPLETE FOR EXECUTIVE MEMBERS */
            <div className="relative space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Start typing your Executive Name:</label>
                <input 
                  type="text" disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="e.g. Abatsu Michael..."
                  value={selectedMember ? selectedMember.name : searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedMember(null); setSelectedExecutiveRole(''); }}
                />
                
                {/* Dropdown Suggestions List */}
                {filteredMembers.length > 0 && !selectedMember && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {filteredMembers.map(m => (
                      <li 
                        key={m.id}
                        className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-sm"
                        onClick={() => handleSelectExecutive(m)}
                      >
                        <span className="font-semibold text-gray-900">{m.name}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{m.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SELECTABLE DEANERY EXECUTIVE ROLE DROPDOWN */}
              {selectedMember && (
                <div className="animate-fadeIn space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="text-xs text-indigo-900 font-medium">
                    Verified Home Parish: <span className="font-bold">{selectedMember.parish}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">Confirm Executive Role for Meeting:</label>
                    <select
                      required
                      disabled={loading}
                      className="w-full px-3 py-1.5 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-gray-800"
                      value={selectedExecutiveRole}
                      onChange={(e) => setSelectedExecutiveRole(e.target.value)}
                    >
                      {executiveRoles.map((roleName, idx) => (
                        <option key={idx} value={roleName}>{roleName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CLEAN DROPDOWNS AND DATA INPUTS FOR GENERAL DELEGATES */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title</label>
                <select
                  required disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 text-sm"
                  value={guestForm.title}
                  onChange={(e) => setGuestForm({...guestForm, title: e.target.value})}
                >
                  <option value="">Select Title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss">Miss</option>
                  <option value="Bro.">Bro.</option>
                  <option value="Sr.">Sr.</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                <input 
                  type="text" required disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  value={guestForm.firstName}
                  onChange={(e) => setGuestForm({...guestForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                <input 
                  type="text" required disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  value={guestForm.lastName}
                  onChange={(e) => setGuestForm({...guestForm, lastName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Parish</label>
                <select
                  required disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 text-sm"
                  value={guestForm.parish}
                  onChange={(e) => setGuestForm({...guestForm, parish: e.target.value})}
                >
                  <option value="">-- Select Home Parish --</option>
                  {deaneryParishes.map((parishName, index) => (
                    <option key={index} value={parishName}>{parishName}</option>
                  ))}
                </select>
              </div>
              
              {/* Structured Select Dropdown for Position in Parish */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Position in Parish</label>
                <select
                  required 
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 text-sm"
                  value={guestForm.position}
                  onChange={(e) => setGuestForm({...guestForm, position: e.target.value})}
                >
                  <option value="">-- Select Parish Position --</option>
                  {parishPositions.map((posName, idx) => (
                    <option key={idx} value={posName}>{posName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isGuest && !selectedMember)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Processing Registration...' : 'Submit Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}