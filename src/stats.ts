// 「今天喝了几杯」「今天专注多久」：仅本地存储，按自然日重置。
const KEY = 'cafe-pomodoro-cups';
const FOCUS_KEY = 'cafe-pomodoro-focus';

interface CupRecord {
  date: string; // YYYY-MM-DD（本地时区）
  count: number;
}

interface FocusRecord {
  date: string;
  ms: number;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function read(): CupRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const r = JSON.parse(raw) as CupRecord;
      if (r.date === today()) return r;
    }
  } catch {
    /* ignore */
  }
  return { date: today(), count: 0 };
}

/** 今天已完成的杯数 */
export function getCupsToday(): number {
  return read().count;
}

/** 记一杯（自然完成时调用），返回累计后的今日杯数 */
export function addCup(): number {
  const rec = read();
  const next: CupRecord = { date: today(), count: rec.count + 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next.count;
}

function readFocus(): FocusRecord {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    if (raw) {
      const r = JSON.parse(raw) as FocusRecord;
      if (r.date === today()) return r;
    }
  } catch {
    /* ignore */
  }
  return { date: today(), ms: 0 };
}

/** 今天累计专注时长（毫秒） */
export function getFocusMsToday(): number {
  return readFocus().ms;
}

/** 累加一段专注时长（正计时这一杯结束时调用），返回今日累计毫秒 */
export function addFocusMs(ms: number): number {
  const rec = readFocus();
  const next: FocusRecord = { date: today(), ms: rec.ms + Math.max(0, ms) };
  try {
    localStorage.setItem(FOCUS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next.ms;
}
