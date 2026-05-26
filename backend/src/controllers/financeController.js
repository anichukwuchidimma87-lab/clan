import Finance from '../models/Finance.js';

// Get all financial records for a chosen year and calculate totals
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

// Add a single parish entry manually
export const addParish = async (req, res) => {
  try {
    const { parishName, deanery, year, duesPrice, seminarPrice, competitionPrice } = req.body;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const existing = await Finance.findOne({ parishName, year: targetYear });
    if (existing) {
      return res.status(400).json({ success: false, message: `Parish entry already exists for the year ${targetYear}` });
    }

    const newParish = await Finance.create({ 
      parishName, 
      deanery, // Fixed field parameter name mapping
      year: targetYear,
      duesPrice: Number(duesPrice),
      seminarPrice: Number(seminarPrice),
      competitionPrice: Number(competitionPrice)
    });
    
    res.status(201).json({ success: true, data: newParish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BULK UPLOAD CONTROLLER: Process an array of parishes from a CSV spreadsheet
export const bulkUploadLedger = async (req, res) => {
  try {
    const { records } = req.body; // Expects an array of structured objects
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid records format supplied" });
    }

    // Use bulk write operations to insert quickly while avoiding crashes on duplicate entries
    const operations = records.map(record => ({
      updateOne: {
        filter: { parishName: record.parishName, year: Number(record.year) },
        update: { 
          $setOnInsert: {
            deanery: record.deanery || "",
            duesPrice: Number(record.duesPrice) || 5000,
            seminarPrice: Number(record.seminarPrice) || 2500,
            competitionPrice: Number(record.competitionPrice) || 5000,
            duesPaid: record.duesPaid === true || record.duesPaid === 'true',
            seminarPaid: record.seminarPaid === true || record.seminarPaid === 'true',
            competitionPaid: record.competitionPaid === true || record.competitionPaid === 'true'
          }
        },
        upsert: true
      }
    }));

    await Finance.bulkWrite(operations);

    res.status(200).json({ success: true, message: `Bulk ledger processing finished successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle payment flags
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