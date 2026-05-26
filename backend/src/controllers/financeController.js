import Finance from '../models/Finance.js';

// Get all financial records and calculate totals
export const getLedger = async (req, res) => {
  try {
    const ledger = await Finance.find({});
    
    // Calculate global summary totals directly from database state
    let totalDues = 0;
    let totalSeminar = 0;
    let totalCompetition = 0;

    ledger.forEach(item => {
      if (item.duesPaid) totalDues += 5000;
      if (item.seminarPaid) totalSeminar += 2000;
      if (item.competitionPaid) totalCompetition += 3000;
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

// Toggle or update a specific payment item
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