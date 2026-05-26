import Finance from '../models/Finance.js';
import Parish from '../models/Parish.js';

// Get ledger report with calculated exact partial metrics balances populated directly from Registry
export const getLedger = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Finds finance files and deep populates the true name and zone straight from Registry collections
    const ledger = await Finance.find({ year, deanery: 'Benin' }).populate('parish', 'name zone');
    
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
    const { category, amount } = req.body; 
    const adminName = req.user.name; 

    const paymentNum = Number(amount);
    if (isNaN(paymentNum) || paymentNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount value" });
    }

    const record = await Finance.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Parish ledger sheet not found" });
    }

    if (category === 'dues') record.duesPaidAmount += paymentNum;
    if (category === 'seminar') record.seminarPaidAmount += paymentNum;
    if (category === 'competition') record.competitionPaidAmount += paymentNum;

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

// Standard individual parish ledger row manual constructor
export const addParish = async (req, res) => {
  try {
    const { parishName, year, duesPrice, seminarPrice, competitionPrice } = req.body;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    // 1. Locate the registry parent reference object first
    let masterParish = await Parish.findOne({ name: parishName.trim() });
    if (!masterParish) {
      // Create it inside the core registry automatically first if it's missing
      masterParish = await Parish.create({ name: parishName.trim(), zone: 'Benin' });
    }
    
    const existing = await Finance.findOne({ parish: masterParish._id, year: targetYear });
    if (existing) return res.status(400).json({ message: "Parish year profile sheet already active" });

    const newParish = await Finance.create({
      parish: masterParish._id,
      deanery: 'Benin',
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

// Bulk spreadsheet finance ledger loader mapped to relational references
export const bulkUploadLedger = async (req, res) => {
  try {
    const { records } = req.body;
    let uploadCount = 0;

    for (const record of records) {
      if (!record.parishName) continue;

      // Find the corresponding master reference
      let masterParish = await Parish.findOne({ name: record.parishName.trim() });
      if (!masterParish) {
        masterParish = await Parish.create({ name: record.parishName.trim(), zone: 'Benin' });
      }

      const targetYear = Number(record.year) || new Date().getFullYear();

      // Upsert financial details tied directly to the MongoDB Object ID reference
      await Finance.updateOne(
        { parish: masterParish._id, year: targetYear },
        {
          $setOnInsert: {
            deanery: 'Benin',
            duesPrice: Number(record.duesPrice) || 5000,
            seminarPrice: Number(record.seminarPrice) || 2500,
            competitionPrice: Number(record.competitionPrice) || 5000,
            duesPaidAmount: Number(record.duesPaidAmount) || 0,
            seminarPaidAmount: Number(record.seminarPaidAmount) || 0,
            competitionPaidAmount: Number(record.competitionPaidAmount) || 0
          }
        },
        { upsert: true }
      );
      uploadCount++;
    }

    res.status(200).json({ success: true, message: `Successfully updated financial tracks for ${uploadCount} records.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};