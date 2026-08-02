// ICS (iCalendar) export utilities — no external dependencies

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace('.000Z', 'Z').substring(0, 16) + '00Z';
}

function icsDateOnly(date: string): string {
  return date.replace(/-/g, '');
}

function escapeIcs(s: string): string {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g,  '\\;')
    .replace(/,/g,  '\\,')
    .replace(/\n/g, '\\n');
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@skatetrack`;
}

export interface IcsEvent {
  summary: string;
  description?: string;
  location?: string;
  startDate: string;   // ISO datetime or YYYY-MM-DD
  endDate?: string;    // ISO datetime or YYYY-MM-DD
  allDay?: boolean;
  url?: string;
}

function buildVEVENT(event: IcsEvent): string {
  const dtstart = event.allDay
    ? `DTSTART;VALUE=DATE:${icsDateOnly(event.startDate)}`
    : `DTSTART:${icsDate(event.startDate)}`;

  const dtend = event.endDate
    ? event.allDay
      ? `DTEND;VALUE=DATE:${icsDateOnly(event.endDate)}`
      : `DTEND:${icsDate(event.endDate)}`
    : '';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid()}`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeIcs(event.summary)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : '',
    event.location    ? `LOCATION:${escapeIcs(event.location)}`        : '',
    event.url         ? `URL:${event.url}`                             : '',
    'END:VEVENT',
  ];

  return lines.filter(Boolean).join('\r\n');
}

function wrapIcs(events: IcsEvent[], calName = 'SpeedSkateTrack Hub'): string {
  const vevents = events.map(buildVEVENT).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SpeedSkateTrack Hub//ES',
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(events: IcsEvent[], filename = 'calendario.ics', calName?: string) {
  const content = wrapIcs(events, calName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: IcsEvent): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const startParam = event.allDay
    ? icsDateOnly(event.startDate)
    : icsDate(event.startDate);
  const endParam = event.endDate
    ? event.allDay
      ? icsDateOnly(event.endDate)
      : icsDate(event.endDate)
    : startParam;

  const params = new URLSearchParams({
    text:     event.summary,
    dates:    `${startParam}/${endParam}`,
    details:  event.description ?? '',
    location: event.location ?? '',
  });
  return `${base}&${params.toString()}`;
}
