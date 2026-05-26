import Finance from '../models/Finance.js';

// Get all financial records for a chosen year and calculate exact dynamic totals
export const getLedger = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const ledger = await Finance.find({ year });
    
    let totalDues = 0;
    let totalSeminar = 0;
    let totalCompetition = 0;

    ledger.forEach(item => {
      if (item.duesPaid) totalDues += item.duesPrice;
      if (item.seminarPaid) totalSeminar += item.seminarPrice;
      if (item.competitionPaid) totalCompetition += item.competitionPrice;
    });

    res.status(200).json({
      success: true,
      totals: {
        dues: totalDues,
        seminar: totalSeminar,
        competition: totalCompetition,
        grandTotal: totalDues + totalSeminar + totalCompetition
      },
      data: ledger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new parish entry with completely custom prices for a given year
export const addParish = async (req, res) => {
  try {
    const { parishName, zone, year, duesPrice, seminarPrice, competitionPrice } = req.body;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const existing = await Finance.findOne({ parishName, year: targetYear });
    if (existing) {
      return res.status(400).json({ success: false, message: `Parish entry already exists for the year ${targetYear}` });
    }

    const newParish = await Finance.create({ 
      parishName, 
      zone, 
      year: targetYear,
      duesPrice: Number(duesPrice) || 5000,
      seminarPrice: Number(seminarPrice) || 2500,
      competitionPrice: Number(competitionPrice) || 5000
    });
    
    res.status(201).json({ success: true, data: newParish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle or update payment flags
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { duesPaid, seminarPaid, competitionPaid } = req.body;

    const updatedRecord = await Finance.findByIdAndUpdate(
      id,
      { duesPaid, seminarPaid, competitionPaid },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};