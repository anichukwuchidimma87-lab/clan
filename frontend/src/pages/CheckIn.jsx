import React, { useState } from 'react';

export default function CheckIn() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [deanery, setDeanery] = useState('Benin');
  const [parishName, setParishName] = useState('');
  const [roleInParish, setRoleInParish] = useState('Active Member'); // DEFAULT OPTION SET FIRST
  
  const [message, setMessage] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, deanery, parishName, roleInParish })
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: `✓ Check-in complete! Welcome, ${firstName}.`, isError: false });
        setFirstName(''); setLastName(''); setPhone(''); setParishName('');
        setRoleInParish('Active Member');
      } else {
        // Displays the custom verification error message
        setMessage({ text: result.message, isError: true });
      }
    } catch (err) {
      setMessage({ text: "Network connection loss. Try again later.", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full space-y-4 border border-gray-100">
        <div className="text-center">
          <h1 className="text-xl font-black text-gray-800">Archdiocesan Lector Registry</h1>
          <p className="text-xs text-gray-400 mt-1">Submit your details to check in for your parish roster log.</p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-xl text-xs font-bold ${message.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-600">First Name</label>
              <input type="text" className="border p-2 rounded-lg w-full bg-gray-50 font-medium" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="font-bold text-gray-600">Surname (Last Name)</label>
              <input type="text" className="border p-2 rounded-lg w-full bg-gray-50 font-medium" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600">Mobile Phone Line</label>
            <input type="tel" placeholder="080..." className="border p-2 rounded-lg w-full bg-gray-50 font-medium" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-600">Deanery Division</label>
              <select className="border p-2 rounded-lg w-full bg-gray-50 font-semibold" value={deanery} onChange={e => setDeanery(e.target.value)}>
                <option value="Benin">Benin</option>
                <option value="Abudu">Abudu</option>
                <option value="Eguabazua">Eguabazua</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-600">Designation Role</label>
              <select className="border p-2 rounded-lg w-full bg-gray-50 font-semibold text-indigo-700" value={roleInParish} onChange={e => setRoleInParish(e.target.value)}>
                <option value="Active Member">Active Member</option>
                <option value="Parish President">Parish President</option>
                <option value="Parish Vice President">Parish Vice President</option>
                <option value="Parish Secretary">Parish Secretary</option>
                <option value="Parish Executive">Parish Executive (PRO / Fin.Sec)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600">Exact Parish Name</label>
            <input type="text" placeholder="e.g., Assumption Catholic Church, Uteh" className="border p-2 rounded-lg w-full bg-gray-50 font-medium" value={parishName} onChange={e => setParishName(e.target.value)} required />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition tracking-wide shadow-sm disabled:opacity-50">
            {submitting ? 'Transmitting Entry Profile...' : 'Submit Form Check-In'}
          </button>
        </form>
      </div>
    </div>
  );
}