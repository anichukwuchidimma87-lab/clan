import Event from '../models/Event.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, status, coverImage } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'Title and date are required.' });
    const ev = await Event.create({ title: title.trim(), description: description || '', date: new Date(date), location: location || '', status: status || 'Upcoming', coverImage: coverImage || '' });
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
    if (title) event.title = title.trim();
    if (typeof description !== 'undefined') event.description = description;
    if (date) event.date = new Date(date);
    if (location) event.location = location;
    if (status) event.status = status;
    if (typeof coverImage !== 'undefined') event.coverImage = coverImage;
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
    const when = ev.date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    const daysLeft = Math.ceil((ev.date - new Date()) / (1000 * 60 * 60 * 24));
    const countdown = daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} to go` : 'Happening soon';
    const caption = `📢 ${ev.title}\n\nWho: Community Members\nWhat: ${ev.description || ev.title}\nWhen: ${when} (${countdown})\nWhere: ${ev.location || 'Venue TBA'}\n\nJoin us for this important event — all are welcome. Please share widely.`;
    res.status(200).json({ success: true, data: { caption } });
  } catch (error) {
    console.error('[eventController] generateCaption error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const parseCsvEvents = (raw) => {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const item = {};
    headers.forEach((header, index) => {
      if (header === 'venue' || header === 'location') {
        item.location = values[index] || '';
      } else if (header === 'title' || header === 'date' || header === 'description' || header === 'coverimage' || header === 'cover_image') {
        item[header === 'cover_image' ? 'coverImage' : header] = values[index] || '';
      }
    });
    return item;
  });
};

export const bulkImportEvents = async (req, res) => {
  try {
    let records = [];
    if (Array.isArray(req.body.items)) {
      records = req.body.items;
    } else if (typeof req.body.rawData === 'string') {
      const raw = req.body.rawData.trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          records = parsed;
        }
      } catch (jsonErr) {
        records = parseCsvEvents(raw);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Provide items array or rawData string in JSON/CSV format.' });
    }

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'No valid event records found.' });
    }

    const normalized = records.map(item => ({
      title: (item.title || item.name || '').trim(),
      description: item.description || item.desc || '',
      date: item.date ? new Date(item.date) : null,
      location: item.venue || item.location || '',
      status: item.status || 'Upcoming',
      coverImage: item.coverImage || item.cover_image || ''
    })).filter(item => item.title && item.date && !Number.isNaN(item.date.getTime()));

    if (!normalized.length) {
      return res.status(400).json({ success: false, message: 'No valid events after parsing. Ensure title and date fields are present.' });
    }

    const created = await Event.insertMany(normalized);
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    console.error('[eventController] bulkImportEvents error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
