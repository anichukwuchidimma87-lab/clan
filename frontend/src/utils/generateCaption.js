import { formatEventDateTime } from './eventDateTime';

export default function generateCaption(event) {
  if (!event) return '';
  const date = new Date(event.date);
  const when = formatEventDateTime(date);
  const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  const countdown = daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} to go` : 'Happening soon';
  return `📢 ${event.title}\n\nWho: Community Members\nWhat: ${event.description || event.title}\nWhen: ${when} (${countdown})\nWhere: ${event.location || 'Venue TBA'}\n\nJoin us — please share widely.`;
}
