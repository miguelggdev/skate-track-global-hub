/**
 * Generates a valid RFC 5545 iCalendar (.ics) string from a list of events
 * and triggers a browser download.
 */

export interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string; // ISO date or datetime string
  dtend: string;
  allDay?: boolean;
}

function icsDate(iso: string, allDay = false): string {
  const d = new Date(iso);
  if (allDay) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  // UTC datetime format
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function fold(line: string): string {
  // RFC 5545: max 75 octets per line, folded with CRLF + space
  const MAX = 75;
  if (line.length <= MAX) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, MAX));
  let pos = MAX;
  while (pos < line.length) {
    parts.push(' ' + line.slice(pos, pos + MAX - 1));
    pos += MAX - 1;
  }
  return parts.join('\r\n');
}

export function buildICS(calName: string, events: ICSEvent[]): string {
  const now = icsDate(new Date().toISOString());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SpeedSkateTrack//Club Management//ES',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    const dtProp = ev.allDay ? 'DATE' : 'DATE-TIME';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(fold(`DTSTART;VALUE=${dtProp}:${icsDate(ev.dtstart, ev.allDay)}`));
    lines.push(fold(`DTEND;VALUE=${dtProp}:${icsDate(ev.dtend, ev.allDay)}`));
    lines.push(fold(`SUMMARY:${escapeText(ev.summary)}`));
    if (ev.description) lines.push(fold(`DESCRIPTION:${escapeText(ev.description)}`));
    if (ev.location)    lines.push(fold(`LOCATION:${escapeText(ev.location)}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(calName: string, events: ICSEvent[], filename = 'calendar.ics') {
  const content = buildICS(calName, events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
