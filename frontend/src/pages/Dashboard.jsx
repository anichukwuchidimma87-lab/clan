import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Import the spreadsheet parsing engine

export default function Dashboard() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Single manual form inputs
  const [newParishName, setNewParishName] = useState('');
  const [newParishDeanery, setNewParishDeanery] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);

  // Excel Upload States
  const [excelYear, setExcelYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  
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

  // Handle processing the Excel sheet on the client side
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
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet lines to a JSON array of arrays
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Skip header row and clean records mapping
        const records = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0]) continue; // Skip blank lines

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

        if (records.length === 0) {
          alert("No valid rows detected in the spreadsheet.");
          setUploading(false);
          return;
        }

        // Push parsed array data into live backend bulk database controller
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
          alert(`Success! Imported ${records.length} parish entries successfully.`);
          setCurrentYear(Number(excelYear));
          e.target.value = ''; // Reset input element state
        } else {
          alert(result.message || 'Error processing cloud transaction records.');
        }
      } catch (err) {
        console.error("Excel breakdown crash:", err);
        alert("Failed to parse sheet file. Check file configuration guidelines.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleManualAdd = async (e) => {
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
      console.error(err);
    }
  };

  const handleToggle = async (id, field, currentValue) => {
    try {
      const token = localStorage.getItem('clan_token');
      const record = ledger.find(item => item._id === id);
      const updatedPayload = {
        duesPaid: record.duesPaid,
        seminarPaid: record.seminarPaid,
        competitionPaid: record.competitionPaid,
        [field]: !currentValue
      };

      await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });
      fetchLedgerData(currentYear); 
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Ledger Management Core...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Top Banner Control Switcher */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deanery Financial Ledger</h1>
          <p className="text-xs text-gray-500">View real-time totals across Benin, Abudu, and Eguabazua deaneries</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Select View Year:</label>
          <input 
            type="number" 
            className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Metrics Row Cards */}
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
          <p className="text-sm opacity-80 font-medium">GRAND TOTAL COLLECTED ({currentYear})</p>
          <p className="text-2xl font-bold">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* NEW EXCEL UPLOAD PANEL INTERFACE */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-green-200 bg-emerald-50/10">
        <h3 className="text-md font-bold text-emerald-900 mb-1 flex items-center gap-2">
          📊 Excel Spreadsheet Import Panel
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Select the fiscal target year, then choose your Excel workbook file (`.xlsx`). Your columns must match this row map sequence exactly: 
          <br />
          <span className="font-mono bg-white p-1 rounded border inline-block mt-1 text-gray-600">
            Parish Name | Deanery | Dues Price | Seminar Price | Competition Price | Dues Paid (TRUE/FALSE) | Seminar Paid | Competition Paid
          </span>
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Assign Ledger Year:</span>
            <input 
              type="number" 
              className="border p-2 rounded-lg text-sm font-semibold w-24 bg-white" 
              value={excelYear} 
              onChange={(e) => setExcelYear(e.target.value)} 
              disabled={uploading}
            />
          </div>
          <input 
            type="file" 
            accept=".xlsx, .xls"
            className="text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
            onChange={handleExcelUpload}
            disabled={uploading}
          />
          {uploading && <span className="text-xs font-medium text-emerald-600 animate-pulse">Uploading and Parsing Excel Data...</span>}
        </div>
      </div>

      {/* Manual Fallback Single Addition Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-md font-bold text-gray-800 mb-3">Add Single Parish Entry</h3>
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
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

      {/* Main Grid Matrix View Data */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Name</th>
              <th className="p-4">Deanery</th>
              <th className="p-4 text-center">Dues Status</th>
              <th className="p-4 text-center">Seminar Status</th>
              <th className="p-4 text-center">Competition Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic">No historical parish listings found for the year {currentYear}. Use the green panel above to upload an Excel file.</td>
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