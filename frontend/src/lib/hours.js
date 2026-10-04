/**
 * Öffnungszeiten aus Freitext lesen, z. B.
 *   „Mo–Sa 08:00–20:00“
 *   „So geschlossen“
 *   „Mo-Fr 8-20, Sa 9-18“
 * und daraus „Jetzt geöffnet bis 20 Uhr“ ableiten. Was nicht passt, wird nur angezeigt.
 */
const DAYS = ["so", "mo", "di", "mi", "do", "fr", "sa"];

function dayIndex(token) {
  return DAYS.indexOf(token.slice(0, 2).toLowerCase());
}

function toMinutes(value) {
  const [h, m = "0"] = value.split(/[:.]/);
  return Number(h) * 60 + Number(m);
}

export function parseHours(text) {
  const schedule = {};
  const parts = String(text || "").split(/\n|;|,(?=\s*[A-Za-z])/);
  for (const part of parts) {
    const match = part.trim().match(/^([A-Za-z]{2})\.?(?:\s*[–-]\s*([A-Za-z]{2})\.?)?\s*:?\s*(.*)$/);
    if (!match) continue;
    const start = dayIndex(match[1]);
    const end = match[2] ? dayIndex(match[2]) : start;
    if (start < 0 || end < 0) continue;
    const rest = match[3].toLowerCase();
    const time = rest.match(/(\d{1,2}(?:[:.]\d{2})?)\s*(?:uhr)?\s*[–-]\s*(\d{1,2}(?:[:.]\d{2})?)/);
    const value = /geschlossen|zu\b/.test(rest) ? null : time ? [toMinutes(time[1]), toMinutes(time[2])] : undefined;
    if (value === undefined) continue;
    for (let day = start; ; day = (day + 1) % 7) {
      schedule[day] = value;
      if (day === end) break;
    }
  }
  return schedule;
}

function label(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}:${String(m).padStart(2, "0")}` : `${h}`;
}

export function openState(text, now = new Date()) {
  const schedule = parseHours(text);
  if (!Object.keys(schedule).length) return null;
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const day = berlin.getDay();
  const minutes = berlin.getHours() * 60 + berlin.getMinutes();
  const today = schedule[day];

  if (today && minutes >= today[0] && minutes < today[1]) {
    return { open: true, text: `Jetzt geöffnet bis ${label(today[1])} Uhr` };
  }
  if (today && minutes < today[0]) {
    return { open: false, text: `Öffnet heute um ${label(today[0])} Uhr` };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const next = schedule[(day + offset) % 7];
    if (next) {
      const name = offset === 1 ? "morgen" : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][(day + offset) % 7];
      return { open: false, text: `Geschlossen, öffnet ${name} um ${label(next[0])} Uhr` };
    }
  }
  return null;
}
