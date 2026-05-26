import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function FinancialLedger() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [newParishName, setNewParishName] = useState('');
  const [newParishDeanery, setNewParishDeanery] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);

  const [excelYear, setExcelYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLedgerData = async (year) => {
    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setLedger(result.data);
        setTotals(result.totals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const records = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0]) continue;
          records.push({
            parishName: String(row[0]).trim(),
            deanery: row[1] ? String(row[1]).trim() : "",
            year: Number(excelYear),
            duesPrice: row[2] ? Number(row[2]) : 5000,
            seminarPrice: row[3] ? Number(row[3]) : 2500,
            competitionPrice: row[4] ? Number(row[4]) : 5000,
            duesPaid: row[5] ? String(row[5]).trim().toLowerCase() === 'true' : false,
            seminarPaid: row[6] ? String(row[6]).trim().toLowerCase() === 'true' : false,
            competitionPaid: row[7] ? String(row[7]).trim().toLowerCase() === 'true' : false
          });
        }
        const token = localStorage.getItem('clan_token');
        const res = await fetch('https://clan-3slh.onrender.com/api/finance/bulk-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ records })
        });
        const result = await res.json();
        if (result.success) {
          alert('Excel data imported successfully!');
          setCurrentYear(Number(excelYear));
        }
      } catch (err) {
        alert("Failed to parse Excel file.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch('https://clan-3slh.onrender.com/api/finance/parish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ parishName: newParishName, deanery: newParishDeanery, year: formYear, duesPrice: formDues, seminarPrice: formSeminar, competitionPrice: formComp })
      });
      const result = await res.json();
      if (result.success) {
        setNewParishName('');
        setNewParishDeanery('');
        setCurrentYear(Number(formYear));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id, field, currentValue) => {
    try {
      const token = localStorage.getItem('clan_token');
      const record = ledger.find(item => item._id === id);
      const updatedPayload = { ...record, [field]: !currentValue };
      await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedPayload)
      });
      fetchLedgerData(currentYear);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Ledger...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-blue-600 hover:underline">← Back to Main Dashboard Portal</button>
      
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deanery Financial Ledger</h1>
          <p className="text-xs text-gray-500">Track and manage multi-year variable ledger payments</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Select Operating Year:</label>
          <input type="number" className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL DUES</p>
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

      {/* Excel Sheet Import */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-green-200 bg-emerald-50/10">
        <h3 className="text-md font-bold text-emerald-900 mb-1">📊 Excel Spreadsheet Import Panel</h3>
        <p className="text-xs text-gray-500 mb-4">Columns structure map order: Parish Name | Deanery | Dues Price | Seminar Price | Comp Price | Dues Paid (TRUE/FALSE) | Seminar Paid | Comp Paid</p>
        <div className="flex flex-wrap items-center gap-4">
          <input type="number" className="border p-2 rounded-lg text-sm font-semibold w-24 bg-white" value={excelYear} onChange={(e) => setExcelYear(e.target.value)} disabled={uploading} />
          <input type="file" accept=".xlsx, .xls" className="text-xs text-gray-600" onChange={handleExcelUpload} disabled={uploading} />
        </div>
      </div>

      {/* Manual Single Form Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-md font-bold text-gray-800 mb-3">Add Single Parish Entry</h3>
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <input type="text" placeholder="Parish Name" className="border p-2 rounded-lg text-sm md:col-span-2" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
          <select className="border p-2 rounded-lg text-sm bg-white" value={newParishDeanery} onChange={(e) => setNewParishDeanery(e.target.value)}>
            <option value="">Select Deanery</option>
            <option value="Benin">Benin</option>
            <option value="Abudu">Abudu</option>
            <option value="Eguabazua">Eguabazua</option>
          </select>
          <input type="number" className="border p-2 rounded-lg text-sm" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
          <input type="number" className="border p-2 rounded-lg text-sm" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
          <input type="number" className="border p-2 rounded-lg text-sm" value={formSeminar} onChange={(e) => setFormSeminar(Number(e.target.value))} required />
          <input type="number" className="border p-2 rounded-lg text-sm md:col-span-2" value={formComp} onChange={(e) => setFormComp(Number(e.target.value))} required />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition md:col-span-4 h-[38px]">+ Save Entry</button>
        </form>
      </div>

      {/* Main Grid Data Table Sheet */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Name</th>
              <th className="p-4">Deanery</th>
              <th className="p-4 text-center">Dues</th>
              <th className="p-4 text-center">Seminar</th>
              <th className="p-4 text-center">Competition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {ledger.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No listings found for {currentYear}.</td></tr>
            ) : (
              ledger.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50/70 transition">
                  <td className="p-4 font-semibold text-gray-900">{row.parishName}</td>
                  <td className="p-4 text-gray-700 font-medium">{row.deanery || 'Unassigned'}</td>
                  <td className="p-4 text-center bg-blue-50/10"><label className="cursor-pointer font-bold text-blue-700 block text-xs"><span className="block">₦{row.duesPrice}</span><input type="checkbox" checked={row.duesPaid} onChange={() => handleToggle(row._id, 'duesPaid', row.duesPaid)} /></label></td>
                  <td className="p-4 text-center bg-purple-50/10"><label className="cursor-pointer font-bold text-purple-700 block text-xs"><span className="block">₦{row.seminarPrice}</span><input type="checkbox" checked={row.seminarPaid} onChange={() => handleToggle(row._id, 'seminarPaid', row.seminarPaid)} /></label></td>
                  <td className="p-4 text-center bg-pink-50/10"><label className="cursor-pointer font-bold text-pink-700 block text-xs"><span className="block">₦{row.competitionPrice}</span><input type="checkbox" checked={row.competitionPaid} onChange={() => handleToggle(row._id, 'competitionPaid', row.competitionPaid)} /></label></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}