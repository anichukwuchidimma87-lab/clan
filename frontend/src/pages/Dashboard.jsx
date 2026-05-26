import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Single form entries
  const [newParishName, setNewParishName] = useState('');
  const [newParishDeanery, setNewParishDeanery] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);

  // Bulk paste text state
  const [bulkText, setBulkText] = useState('');
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLedgerData = async (year) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setLedger(result.data);
        setTotals(result.totals);
      }
    } catch (err) {
      console.error("Error connecting to live ledger API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  // Handle single manual addition
  const handleAddParish = async (e) => {
    e.preventDefault();
    if (!newParishName.trim()) return;

    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch('https://clan-3slh.onrender.com/api/finance/parish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          parishName: newParishName, 
          deanery: newParishDeanery,
          year: formYear,
          duesPrice: formDues,
          seminarPrice: formSeminar,
          competitionPrice: formComp
        })
      });

      const result = await res.json();
      if (result.success) {
        setNewParishName('');
        setNewParishDeanery('');
        setCurrentYear(Number(formYear));
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error adding parish:", err);
    }
  };

  // Process the pasted excel/csv text chunk directly into backend
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    try {
      const lines = bulkText.split('\n');
      const records = [];

      lines.forEach(line => {
        if (!line.trim()) return;
        // Split by comma or tab (handles direct Excel copy-paste values!)
        const columns = line.split(/[,\t]/);
        
        if (columns[0] && columns[0].trim()) {
          records.push({
            parishName: columns[0].trim(),
            deanery: columns[1] ? columns[1].trim() : "",
            year: Number(bulkYear),
            duesPrice: columns[2] ? Number(columns[2].trim()) : 5000,
            seminarPrice: columns[3] ? Number(columns[3].trim()) : 2500,
            competitionPrice: columns[4] ? Number(columns[4].trim()) : 5000,
            duesPaid: columns[5] ? columns[5].trim().toLowerCase() === 'true' : false,
            seminarPaid: columns[6] ? columns[6].trim().toLowerCase() === 'true' : false,
            competitionPaid: columns[7] ? columns[7].trim().toLowerCase() === 'true' : false
          });
        }
      });

      const token = localStorage.getItem('clan_token');
      const res = await fetch('https://clan-3slh.onrender.com/api/finance/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ records })
      });

      const result = await res.json();
      if (result.success) {
        alert('Bulk records imported successfully!');
        setBulkText('');
        setCurrentYear(Number(bulkYear));
      } else {
        alert('Error importing data');
      }
    } catch (err) {
      console.error("Bulk upload processing mistake:", err);
    }
  };

  const handleToggle = async (id, field, currentValue) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) return;

      const record = ledger.find(item => item._id === id);
      const updatedPayload = {
        duesPaid: record.duesPaid,
        seminarPaid: record.seminarPaid,
        competitionPaid: record.competitionPaid,
        [field]: !currentValue
      };

      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });
      
      if (res.ok) {
        fetchLedgerData(currentYear); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Deanery Ledger Systems...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* View Switcher Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deanery Financial Ledger</h1>
          <p className="text-xs text-gray-500">Manage payment metrics cleanly across Benin, Abudu, and Eguabazua deaneries</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Operating Fiscal Year:</label>
          <input 
            type="number" 
            className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Metrics Layout Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL DUES COLLECTED</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL SEMINARS</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL COMPETITIONS</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm">
          <p className="text-sm opacity-80 font-medium">GRAND TOTAL ({currentYear})</p>
          <p className="text-2xl font-bold">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Bulk Clipboard Upload Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-md font-bold text-gray-800 mb-1">Bulk Excel / CSV Import Section</h3>
        <p className="text-xs text-gray-400 mb-3">
          Open Excel/Google Sheets, copy rows with columns in this order: <b className="text-gray-700">ParishName, Deanery, DuesPrice, SeminarPrice, CompPrice, DuesPaid(true/false), SeminarPaid, CompPaid</b>, and paste below.
        </p>
        <form onSubmit={handleBulkUpload} className="space-y-3">
          <div className="flex gap-4 items-center">
            <label className="text-xs font-bold text-gray-600">Target Upload Year:</label>
            <input type="number" className="border p-1.5 rounded text-sm font-semibold w-24" value={bulkYear} onChange={(e) => setBulkYear(e.target.value)} required />
          </div>
          <textarea 
            rows="3" 
            placeholder="St. Paul, Benin, 5000, 2500, 5000, false, false, false" 
            className="w-full border p-2 rounded-lg text-xs font-mono bg-gray-50"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            required
          />
          <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-800 transition">
            ⚡ Execute Bulk Import Injection
          </button>
        </form>
      </div>

      {/* Manual Single Addition Panel Form */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-md font-bold text-gray-800 mb-3">Add Single Parish Entry</h3>
        <form onSubmit={handleAddParish} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <input type="text" placeholder="Parish Name" className="border p-2 rounded-lg text-sm w-full" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
          </div>
          <div>
            <select className="border p-2 rounded-lg text-sm w-full bg-white" value={newParishDeanery} onChange={(e) => setNewParishDeanery(e.target.value)}>
              <option value="">Select Deanery</option>
              <option value="Benin">Benin</option>
              <option value="Abudu">Abudu</option>
              <option value="Eguabazua">Eguabazua</option>
            </select>
          </div>
          <div>
            <input type="number" className="border p-2 rounded-lg text-sm w-full" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
          </div>
          <div>
            <input type="number" className="border p-2 rounded-lg text-sm w-full" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
          </div>
          <div>
            <input type="number" className="border p-2 rounded-lg text-sm w-full" value={formSeminar} onChange={(e) => setFormSeminar(Number(e.target.value))} required />
          </div>
          <div className="md:col-span-2">
            <input type="number" className="border p-2 rounded-lg text-sm w-full" value={formComp} onChange={(e) => setFormComp(Number(e.target.value))} required />
          </div>
          <div className="md:col-span-4 flex items-end">
            <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition h-[38px]">
              + Save Individual Parish Sheet
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid Matrix Data Display Sheet */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Name</th>
              <th className="p-4">Deanery</th>
              <th className="p-4 text-center">Dues Amt</th>
              <th className="p-4 text-center">Seminar Amt</th>
              <th className="p-4 text-center">Competition Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic">No historical parish listings found for the year {currentYear}.</td>
              </tr>
            ) : (
              ledger.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50/70 transition">
                  <td className="p-4 font-semibold text-gray-900">{row.parishName}</td>
                  <td className="p-4 text-gray-700 font-medium">{row.deanery || 'Unassigned'}</td>
                  
                  <td className="p-4 text-center bg-blue-50/10">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-blue-700">₦{row.duesPrice.toLocaleString()}</span>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={row.duesPaid} onChange={() => handleToggle(row._id, 'duesPaid', row.duesPaid)} />
                    </label>
                  </td>

                  <td className="p-4 text-center bg-purple-50/10">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-purple-700">₦{row.seminarPrice.toLocaleString()}</span>
                      <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" checked={row.seminarPaid} onChange={() => handleToggle(row._id, 'seminarPaid', row.seminarPaid)} />
                    </label>
                  </td>

                  <td className="p-4 text-center bg-pink-50/10">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-pink-700">₦{row.competitionPrice.toLocaleString()}</span>
                      <input type="checkbox" className="w-4 h-4 text-pink-600 rounded" checked={row.competitionPaid} onChange={() => handleToggle(row._id, 'competitionPaid', row.competitionPaid)} />
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}