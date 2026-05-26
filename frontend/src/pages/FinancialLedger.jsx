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
  const [newParishDeanery, setNewParishDeanery] = useState('Benin');
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
    if (filteredLedger.length === 0) {
      alert("There is no data available to export for this year.");
      return;
    }

    // Map rows to a clean layout structure for the printable spreadsheet file
    const reportRows = filteredLedger.map((row, index) => ({
      'S/N': index + 1,
      'Parish Name': row.parishName || (row.parish && row.parish.name) || 'Unnamed Parish',
      'Deanery Division': row.deanery || 'Benin',
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

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.book_append_sheet(workbook, worksheet, `Ledger Report ${currentYear}`);

    // Adjust column widths automatically so text is never cut off
    worksheet['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 22 }];

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
            deanery: row[1] ? String(row[1]).trim() : "Benin",
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
          fetchLedgerData(Number(excelYear));
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
          deanery: newParishDeanery || 'Benin',
          year: formYear,
          duesPrice: formDues,
          seminarPrice: formSeminar,
          competitionPrice: formComp
        })
      });

      const result = await res.json();
      if (result.success) {
        setNewParishName('');
        setNewParishDeanery('Benin');
        setCurrentYear(Number(formYear));
        fetchLedgerData(Number(formYear));
        alert('Parish individual ledger created successfully.');
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

  // Filter calculations fallback automatically to embedded relational elements safely
  const filteredLedger = ledger.filter(item => {
    const nameString = item.parishName || (item.parish && item.parish.name) || '';
    const matchesSearch = nameString.toLowerCase().includes(searchQuery.toLowerCase());
    
    const divString = item.deanery || 'Benin';
    const matchesDeanery = selectedDeanery === 'All' || divString.toLowerCase() === selectedDeanery.toLowerCase();
    
    return matchesSearch && matchesDeanery;
  });

  const isExecutiveOrHigher = userRole === 'admin' || userRole === 'superadmin';

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-400">Loading Active Ledger Core System...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 bg-gray-50 min-h-screen text-xs font-semibold text-gray-600">
      <button onClick={() => navigate('/dashboard')} className="border px-4 py-2 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm">← Back to Dashboard Hub Portal</button>
      
      {/* Top Controls Banner Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-3 border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Deanery Financial Ledger Summary</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Security Access Tier: <span className="font-bold uppercase text-indigo-600">{getRoleDisplayTitle(userRole)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-1"
          >
            📥 Export Spreadsheet (Print)
          </button>
          <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
            <label className="text-gray-500 font-bold">Sheet Year:</label>
            <input 
              type="number" 
              className="border p-1.5 rounded-lg w-20 font-bold text-center bg-gray-50 text-gray-800" 
              value={currentYear} 
              onChange={(e) => setCurrentYear(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Metrics Financial Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-blue-600">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Dues Deposited</p>
          <p className="text-xl font-black text-gray-900 mt-0.5">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-purple-600">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Seminar Revenue</p>
          <p className="text-xl font-black text-gray-900 mt-0.5">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-pink-600">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Comp Collections</p>
          <p className="text-xl font-black text-gray-900 mt-0.5">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-950 text-white p-4 rounded-xl shadow-sm">
          <p className="text-[10px] opacity-70 uppercase tracking-wider">GRAND YEAR TOTAL ({currentYear})</p>
          <p className="text-xl font-black mt-0.5">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* EXECUTIVE MODIFICATION INPUT FORMS (Hidden from Parish Presidents) */}
      {isExecutiveOrHigher && (
        <div className="space-y-4">
          
          {/* Excel Spreadsheet Import Upload Container Panel */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 bg-emerald-50/20">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">📊 Bulk Spreadsheet Import Panel</h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Columns pattern: <b>Parish Name | Deanery | Dues Price | Seminar Price | Comp Price | Dues Paid Amt | Seminar Paid Amt | Comp Paid Amt</b>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">Assign Ledger Year:</span>
                <input type="number" className="border p-1 rounded-lg font-bold w-20 bg-white text-center" value={excelYear} onChange={(e) => setExcelYear(e.target.value)} disabled={uploading} />
              </div>
              <input type="file" accept=".xlsx, .xls" className="text-xs text-gray-500 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-600 file:text-white" onChange={handleExcelUpload} disabled={uploading} />
              {uploading && <span className="text-emerald-600 font-bold animate-pulse">Processing Database Writing...</span>}
            </div>
          </div>

          {/* Individual Manual Input Tracker Panel */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">Add Single Parish Setup Profile</h3>
            <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <input type="text" placeholder="Parish Name" className="border p-1.5 rounded-lg text-xs w-full font-semibold text-gray-800" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
              </div>
              <div>
                <select className="border p-1.5 rounded-lg text-xs w-full bg-white font-bold text-gray-700" value={newParishDeanery} onChange={(e) => setNewParishDeanery(e.target.value)}>
                  <option value="Benin">Benin</option>
                  <option value="Abudu">Abudu</option>
                  <option value="Eguabazua">Eguabazua</option>
                </select>
              </div>
              <div>
                <input type="number" placeholder="Year" className="border p-1.5 rounded-lg text-xs w-full text-center font-semibold" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
              </div>
              <div>
                <input type="number" placeholder="Dues Fee" className="border p-1.5 rounded-lg text-xs w-full text-center font-semibold" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
              </div>
              <div>
                <input type="number" placeholder="Seminar Fee" className="border p-1.5 rounded-lg text-xs w-full text-center font-semibold" value={formSeminar} onChange={(e) => setFormSeminar(Number(e.target.value))} required />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="Competition Fee" className="border p-1.5 rounded-lg text-xs w-full text-center font-semibold" value={formComp} onChange={(e) => setFormComp(Number(e.target.value))} required />
              </div>
              <div className="md:col-span-4">
                <button type="submit" className="bg-indigo-600 text-white font-bold rounded-lg w-full py-1.5 hover:bg-indigo-700 transition shadow-sm">+ Save Individual Parish Profile</button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* FILTER AND SEARCH CONTROLS INTERFACE (Visible to everyone) */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="w-full md:w-96 relative">
          <input 
            type="text" 
            placeholder="🔍 Type parish title name to search instantly..." 
            className="border pl-8 pr-3 py-2 rounded-xl text-xs w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Deanery Structural Filter Selector Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {['All', 'Benin', 'Abudu', 'Eguabazua'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedDeanery(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                selectedDeanery === tab 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {tab === 'All' ? '🌍 All Parishes' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Roster Ledger Matrix Data Grid Table Output Sheets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-indigo-950 px-4 py-3 text-white font-bold text-sm tracking-wide">
          🧾 Archdiocesan Financial Ledger Matrix Grid Rows
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-[11px] uppercase tracking-wider">
              <th className="p-3">Parish Title Name</th>
              <th className="p-3">Deanery Division</th>
              <th className="p-3 text-center">Dues Ledger</th>
              <th className="p-3 text-center">Seminar Ledger</th>
              <th className="p-3 text-center">Competition Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic font-semibold">
                  No matching parish financial records found for the year {currentYear}.
                </td>
              </tr>
            ) : (
              filteredLedger.map((row) => {
                const parishDisplayTitle = row.parishName || (row.parish && row.parish.name) || 'Unnamed Parish';
                const deaneryDisplayTitle = row.deanery || 'Benin';

                const renderCellBlock = (category, currentPaid, maxCost, bgColor, textColor) => {
                  const balance = maxCost - currentPaid;
                  const key = `${row._id}-${category}`;
                  return (
                    <td className={`p-3 text-center ${bgColor}/30 min-w-[150px]`}>
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
                          <div className="flex items-center gap-1 mt-1.5 justify-center">
                            <input 
                              type="number" 
                              placeholder="+ Cash" 
                              className="border p-1 rounded text-[11px] w-16 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    <td className="p-3 font-bold text-gray-900 text-sm">{parishDisplayTitle}</td>
                    <td className="p-3 text-gray-500 font-bold uppercase font-mono"><span className="px-2 py-0.5 rounded bg-gray-100 border text-gray-500">{deaneryDisplayTitle}</span></td>
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