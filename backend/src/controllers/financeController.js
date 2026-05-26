import Finance from '../models/Finance.js';

// Get ledger report with calculated exact partial metrics balances
export const getLedger = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const ledger = await Finance.find({ year });
    
    let totalDuesCollected = 0;
    let totalSeminarCollected = 0;
    let totalCompetitionCollected = 0;

    ledger.forEach(item => {
      totalDuesCollected += item.duesPaidAmount;
      totalSeminarCollected += item.seminarPaidAmount;
      totalCompetitionCollected += item.competitionPaidAmount;
    });

    res.status(200).json({
      success: true,
      totals: {
        dues: totalDuesCollected,
        seminar: totalSeminarCollected,
        competition: totalCompetitionCollected,
        grandTotal: totalDuesCollected + totalSeminarCollected + totalCompetitionCollected
      },
      data: ledger
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Log a dynamic payment installment receipt entry
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount } = req.body; // category = 'dues', 'seminar', or 'competition'
    const adminName = req.user.name; // Sourced straight from verification token payload middleware

    const paymentNum = Number(amount);
    if (isNaN(paymentNum) || paymentNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount value" });
    }

    const record = await Finance.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Parish ledger sheet not found" });
    }

    // Dynamic field tracking targeting routing assignment
    if (category === 'dues') record.duesPaidAmount += paymentNum;
    if (category === 'seminar') record.seminarPaidAmount += paymentNum;
    if (category === 'competition') record.competitionPaidAmount += paymentNum;

    // Push into timeline logs tracker history index
    record.paymentHistory.push({
      amount: paymentNum,
      category,
      recordedBy: adminName,
      datePaid: new Date()
    });

    await record.save();
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Standard individual parish constructor row creation tracking
export const addParish = async (req, res) => {
  try {
    const { parishName, deanery, year, duesPrice, seminarPrice, competitionPrice } = req.body;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const existing = await Finance.findOne({ parishName, year: targetYear });
    if (existing) return res.status(400).json({ message: "Parish year profile sheet already active" });

    const newParish = await Finance.create({
      parishName, deanery, year: targetYear,
      duesPrice: Number(duesPrice), seminarPrice: Number(seminarPrice), competitionPrice: Number(competitionPrice)
    });
    res.status(201).json({ success: true, data: newParish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk spreadsheet loader matching new system architecture template parameters
export const bulkUploadLedger = async (req, res) => {
  try {
    const { records } = req.body;
    const operations = records.map(record => ({
      updateOne: {
        filter: { parishName: record.parishName, year: Number(record.year) },
        update: { 
          $setOnInsert: {
            deanery: record.deanery || "",
            duesPrice: Number(record.duesPrice) || 5000,
            seminarPrice: Number(record.seminarPrice) || 2500,
            competitionPrice: Number(record.competitionPrice) || 5000,
            duesPaidAmount: record.duesPaidAmount || 0,
            seminarPaidAmount: record.seminarPaidAmount || 0,
            competitionPaidAmount: record.competitionPaidAmount || 0
          }
        },
        upsert: true
      }
    }));
    await Finance.bulkWrite(operations);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};