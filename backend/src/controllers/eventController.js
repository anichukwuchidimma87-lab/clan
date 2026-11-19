import Event from '../models/Event.js';
import {
  formatEventDateTime,
  parseEventDateTime,
  parseEventCsv,
  validateEventImportRows
} from '../../../shared/eventTools.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, status, coverImage } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }
    let eventDate;
    try {
      eventDate = parseEventDateTime(date);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (status !== undefined && !['Upcoming', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Upcoming or Completed.' });
    }
    for (const [field, value] of Object.entries({ description, location, coverImage })) {
      if (value !== undefined && typeof value !== 'string') {
        return res.status(400).json({ success: false, message: `${field} must be text.` });
      }
    }
    const ev = await Event.create({
      title: title.trim(),
      description: description || '',
      date: eventDate,
      location: location || '',
      status: status || 'Upcoming',
      coverImage: coverImage || ''
    });
    res.status(201).json({ success: true, data: ev });
  } catch (error) {
    console.error('[eventController] createEvent error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    const { title, description, date, location, status, coverImage } = req.body;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Event title is required.' });
      }
      event.title = title.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string') return res.status(400).json({ success: false, message: 'Description must be text.' });
      event.description = description;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'date')) {
      try {
        event.date = parseEventDateTime(date);
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }
    if (location !== undefined) {
      if (typeof location !== 'string') return res.status(400).json({ success: false, message: 'Location must be text.' });
      event.location = location;
    }
    if (status !== undefined) {
      if (!['Upcoming', 'Completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be Upcoming or Completed.' });
      }
      event.status = status;
    }
    if (coverImage !== undefined) {
      if (typeof coverImage !== 'string') return res.status(400).json({ success: false, message: 'Cover image must be text.' });
      event.coverImage = coverImage;
    }
    await event.save();
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('[eventController] updateEvent error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    await ev.remove();
    res.status(200).json({ success: true, message: 'Event deleted.' });
  } catch (error) {
    console.error('[eventController] deleteEvent error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('[eventController] getEvents error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const items = await Event.find({ status: 'Upcoming', date: { $gte: now } }).sort({ date: 1 }).limit(3);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('[eventController] getUpcomingEvents error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('[eventController] getPublicEvents error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    ev.status = ev.status === 'Upcoming' ? 'Completed' : 'Upcoming';
    await ev.save();
    res.status(200).json({ success: true, data: ev });
  } catch (error) {
    console.error('[eventController] toggleEventStatus error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateCaption = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
    // Simple caption generator - server-side helper (no external AI used)
    const when = formatEventDateTime(ev.date);
    const daysLeft = Math.ceil((ev.date - new Date()) / (1000 * 60 * 60 * 24));
    const countdown = daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} to go` : 'Happening soon';
    const caption = `📢 ${ev.title}\n\nWho: Community Members\nWhat: ${ev.description || ev.title}\nWhen: ${when} (${countdown})\nWhere: ${ev.location || 'Venue TBA'}\n\nJoin us for this important event — all are welcome. Please share widely.`;
    res.status(200).json({ success: true, data: { caption } });
  } catch (error) {
    console.error('[eventController] generateCaption error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkImportEvents = async (req, res) => {
  try {
    let records = [];
    if (Array.isArray(req.body.items)) {
      records = req.body.items.map((item, index) => ({ row: index + 1, item }));
    } else if (typeof req.body.rawData === 'string') {
      const raw = req.body.rawData.trim();
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ success: false, message: 'JSON imports must be an array of event objects.' });
        }
        records = parsed.map((item, index) => ({ row: index + 1, item }));
      } catch {
        records = parseEventCsv(raw);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Provide items array or rawData string in JSON/CSV format.' });
    }

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'No event records were provided.', importedCount: 0, errors: [] });
    }

    const { valid, errors } = validateEventImportRows(records);
    if (valid.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No events were imported. Correct the listed rows and try again.',
        importedCount: 0,
        failedCount: errors.length,
        errors
      });
    }

    const created = [];
    for (const { row, data } of valid) {
      try {
        created.push(await Event.create(data));
      } catch (error) {
        console.error(`[eventController] bulkImportEvents row ${row} save error:`, error && error.message);
        errors.push({ row, field: 'record', message: 'Unable to save this event because of a server error.' });
      }
    }

    const partial = errors.length > 0;
    res.status(created.length === 0 ? 400 : partial ? 207 : 201).json({
      success: created.length > 0,
      message: partial
        ? `Imported ${created.length} event${created.length === 1 ? '' : 's'}; ${errors.length} row${errors.length === 1 ? '' : 's'} need attention.`
        : `Imported ${created.length} events.`,
      count: created.length,
      importedCount: created.length,
      failedCount: errors.length,
      errors,
      data: created
    });
  } catch (error) {
    console.error('[eventController] bulkImportEvents error:', error && error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Unable to parse the import data.',
      ...(Number.isInteger(error.row) ? { errors: [{ row: error.row, field: error.field || 'record', message: error.message }] } : {})
    });
  }
};
