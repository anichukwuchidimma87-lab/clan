import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Handles both reading and writing spreadsheets

export default function FinancialLedger() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userRole, setUserRole] = useState('member'); // Sourced from token
  
  // Search and Deanery Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('All');

  // Manual Single Input Forms
  const [newParishName, setNewParishName] = useState('');
  const [newParishDeanery, setNewParishDeanery] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);

  // Excel Bulk Upload States
  const [excelYear, setExcelYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);

  // Partial Payment Form States
  const [payAmounts, setPayAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Decode login token to determine organizational role clearance
  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  // Maps technical roles to your organization's official display titles
  const getRoleDisplayTitle = (role) => {
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'admin') return 'Executive';
    return 'Parish President';
  };

  const fetchLedgerData = async (year) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) { navigate('/login'); return; }
      
      const userPayload = parseJwt(token);
      if (userPayload && userPayload.role) {
        setUserRole(userPayload.role);
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
      console.error("Error connecting to ledger API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  // FEATURE: Export Current Table Roster to Downloadable Excel Spreadsheet
  const handleExportToExcel = () => {
    if (ledger.length === 0) {
      alert("There is no data available to export for this year.");
      return;
    }

    // Map rows to a clean layout structure for the printable spreadsheet file
    const reportRows = filteredLedger.map((row, index) => ({
      'S/N': index + 1,
      'Parish Name': row.parishName,
      'Deanery Division': row.deanery || 'General',
      'Dues Target (₦)': row.duesPrice,
      'Dues Paid (₦)': row.duesPaidAmount,
      'Dues Balance Owing (₦)': row.duesPrice - row.duesPaidAmount,
      'Seminar Target (₦)': row.seminarPrice,
      'Seminar Paid (₦)': row.seminarPaidAmount,
      'Seminar Balance Owing (₦)': row.seminarPrice - row.seminarPaidAmount,
      'Competition Target (₦)': row.competitionPrice,
      'Competition Paid (₦)': row.competitionPaidAmount,
      'Competition Balance Owing (₦)': row.competitionPrice - row.competitionPaidAmount,
      'Total Paid So Far (₦)': row.duesPaidAmount + row.seminarPaidAmount + row.competitionPaidAmount
    }));

    // Generate workbook worksheets
    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.book_append_sheet(workbook, worksheet, `Ledger Report ${currentYear}`);

    // Adjust column widths automatically so text is never cut off
    worksheet['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 22 }];

    // Trigger file download transmission to desktop environment
    XLSX.writeFile(workbook, `Deanery_Financial_Ledger_${currentYear}.xlsx`);
  };

  // FEATURE RESTORED: Full Excel Sheet Input Parsing Engine
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
        
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
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
            duesPaidAmount: row[5] ? Number(row[5]) : 0,
            seminarPaidAmount: row[6] ? Number(row[6]) : 0,
            competitionPaidAmount: row[7] ? Number(row[7]) : 0
          });
        }

        if (records.length === 0) {
          alert("No valid rows detected in spreadsheet.");
          setUploading(false);
          return;
        }

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
          alert(`Success! Bulk imported ${records.length} parish records.`);
          setCurrentYear(Number(excelYear));
          e.target.value = ''; 
        } else {
          alert(result.message || 'Error executing server import transaction.');
        }
      } catch (err) {
        alert("Failed to read Excel workbook layout.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // FEATURE RESTORED: Manual Single Parish Addition Form Execution
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

  const handlePostPayment = async (id, category) => {
    const key = `${id}-${category}`;
    const amount = payAmounts[key];
    if (!amount || amount <= 0) return;

    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/pay/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ category, amount })
      });
      const result = await res.json();
      if (result.success) {
        setPayAmounts(prev => ({ ...prev, [key]: '' }));
        fetchLedgerData(currentYear);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter calculations evaluated locally in memory for maximum rendering speed
  const filteredLedger = ledger.filter(item => {
    const matchesSearch = item.parishName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeanery = selectedDeanery === 'All' || (item.deanery && item.deanery.toLowerCase() === selectedDeanery.toLowerCase());
    return matchesSearch && matchesDeanery;
  });

  const isExecutiveOrHigher = userRole === 'admin' || userRole === 'superadmin';

  if (loading) return <div className="p-8 text-center text-sm font-semibold text-gray-500">Loading Active Ledger Core System...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-indigo-600 hover:underline">← Back to Dashboard Hub Portal</button>
      
      {/* Top Controls Banner Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4 border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Deanery Financial Ledger</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Security Access Tier: <span className="font-mono uppercase font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{getRoleDisplayTitle(userRole)}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            📥 Export Spreadsheet (Print)
          </button>
          <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
            <label className="text-sm font-bold text-gray-600">Sheet Year:</label>
            <input 
              type="number" 
              className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50" 
              value={currentYear} 
              onChange={(e) => setCurrentYear(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Metrics Financial Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-xs text-gray-400 font-bold uppercase">Total Dues Deposited</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-600">
          <p className="text-xs text-gray-400 font-bold uppercase">Total Seminar Revenue</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-600">
          <p className="text-xs text-gray-400 font-bold uppercase">Total Comp Collections</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-950 text-white p-4 rounded-xl shadow-sm">
          <p className="text-xs opacity-70 font-bold uppercase">GRAND YEAR TOTAL ({currentYear})</p>
          <p className="text-2xl font-black mt-0.5">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* EXECUTIVE MODIFICATION INPUT FORMS (Hidden from Parish Presidents) */}
      {isExecutiveOrHigher && (
        <div className="space-y-4">
          
          {/* Excel Spreadsheet Import Upload Container Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-green-200 bg-emerald-50/10">
            <h3 className="text-md font-bold text-emerald-900 mb-1">📊 Bulk Spreadsheet Import Panel</h3>
            <p className="text-xs text-gray-500 mb-4">
              Columns pattern: <b>Parish Name | Deanery | Dues Price | Seminar Price | Comp Price | Dues Paid Amt | Seminar Paid Amt | Comp Paid Amt</b>
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Assign Ledger Year:</span>
                <input type="number" className="border p-2 rounded-lg text-sm font-semibold w-24 bg-white" value={excelYear} onChange={(e) => setExcelYear(e.target.value)} disabled={uploading} />
              </div>
              <input type="file" accept=".xlsx, .xls" className="text-xs text-gray-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-100 file:text-emerald-700" onChange={handleExcelUpload} disabled={uploading} />
              {uploading && <span className="text-xs text-emerald-600 font-bold animate-pulse">Processing Database Writing...</span>}
            </div>
          </div>

          {/* Individual Manual Input Tracker Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">Add Single Parish Setup Profile</h3>
            <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <input type="text" placeholder="Parish Name" className="border p-2 rounded-lg text-sm w-full" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
              </div>
              <div>
                <select className="border p-2 rounded-lg text-sm w-full bg-white font-medium text-gray-700" value={newParishDeanery} onChange={(e) => setNewParishDeanery(e.target.value)}>
                  <option value="">Select Deanery</option>
                  <option value="Benin">Benin</option>
                  <option value="Abudu">Abudu</option>
                  <option value="Eguabazua">Eguabazua</option>
                </select>
              </div>
              <div>
                <input type="number" placeholder="Year" className="border p-2 rounded-lg text-sm w-full" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
              </div>
              <div>
                <input type="number" placeholder="Dues Fee" className="border p-2 rounded-lg text-sm w-full" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
              </div>
              <div>
                <input type="number" placeholder="Seminar Fee" className="border p-2 rounded-lg text-sm w-full" value={formSeminar} onChange={(e) => setFormSeminar(Number(e.target.value))} required />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="Competition Fee" className="border p-2 rounded-lg text-sm w-full" value={formComp} onChange={(e) => setFormComp(Number(e.target.value))} required />
              </div>
              <div className="md:col-span-4">
                <button type="submit" className="bg-blue-600 text-white text-xs font-bold rounded-lg w-full py-2.5 hover:bg-blue-700 transition shadow-sm h-[38px]">+ Save Individual Parish Profile</button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* FILTER AND SEARCH CONTROLS INTERFACE (Visible to everyone) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Live Interactive Search Box */}
        <div className="w-full md:w-96 relative">
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          <input 
            type="text" 
            placeholder="Type parish title name to search instantly..." 
            className="border pl-9 pr-4 py-2 rounded-xl text-sm w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Deanery Structural Filter Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {['All', 'Benin', 'Abudu', 'Eguabazua'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedDeanery(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedDeanery === tab 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {tab === 'All' ? '🌍 All Parishes' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Roster Ledger Matrix Data Grid Table Output Sheets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Title Name</th>
              <th className="p-4">Deanery Division</th>
              <th className="p-4 text-center">Dues Ledger</th>
              <th className="p-4 text-center">Seminar Ledger</th>
              <th className="p-4 text-center">Competition Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic font-medium">
                  No matching parish records found matching "{searchQuery}" for the year {currentYear}.
                </td>
              </tr>
            ) : (
              filteredLedger.map((row) => {
                const renderCellBlock = (category, currentPaid, maxCost, bgColor, textColor) => {
                  const balance = maxCost - currentPaid;
                  const key = `${row._id}-${category}`;
                  return (
                    <td className={`p-4 text-center ${bgColor}/20 min-w-[160px]`}>
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">Paid: <span className={textColor}>₦{currentPaid.toLocaleString()}</span></div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Target: ₦{maxCost.toLocaleString()}</div>
                        {balance > 0 ? (
                          <span className="inline-block bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Owing: ₦{balance.toLocaleString()}</span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Cleared ✓</span>
                        )}
                        
                        {/* Dynamic Fractional Cash Adder Trigger Form (Executive Access Only) */}
                        {isExecutiveOrHigher && balance > 0 && (
                          <div className="flex items-center gap-1 mt-2 justify-center">
                            <input 
                              type="number" 
                              placeholder="+ Cash" 
                              className="border p-1 rounded text-[11px] w-16 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-gray-400"
                              value={payAmounts[key] || ''}
                              onChange={(e) => setPayAmounts({ ...payAmounts, [key]: e.target.value })}
                            />
                            <button 
                              onClick={() => handlePostPayment(row._id, category)}
                              className="bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-black transition shadow-sm"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                };

                return (
                  <tr key={row._id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="p-4 font-bold text-gray-900 text-sm">{row.parishName}</td>
                    <td className="p-4 text-gray-600 font-semibold tracking-wide">{row.deanery || 'General'}</td>
                    {renderCellBlock('dues', row.duesPaidAmount, row.duesPrice, 'bg-blue-50', 'text-blue-700')}
                    {renderCellBlock('seminar', row.seminarPaidAmount, row.seminarPrice, 'bg-purple-50', 'text-purple-700')}
                    {renderCellBlock('competition', row.competitionPaidAmount, row.competitionPrice, 'bg-pink-50', 'text-pink-700')}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}