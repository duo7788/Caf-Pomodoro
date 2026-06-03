// 首页左侧的「今日记录」：仅本地存储，按自然日重置。
//  - cups          今天喝了几杯（倒计时自然完成 + 正计时每结束一杯各记一杯）
//  - rings         正计时累计圈痕数（= 被打断的分心次数）
//  - focusSessions 今天发生过几次正计时（用于决定是否展示「圈痕」一行）
//  - longestFocusMs 今天最长的一段专注（倒计时取该杯时长；正计时取该杯中最长的单段心流；跨两种模式取最大）
const KEY = 'cafe-pomodoro-stats';

export interface DayStats {
  date: string; // YYYY-MM-DD（本地时区）
  cups: number;
  rings: number;
  focusSessions: number;
  longestFocusMs: number;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function empty(): DayStats {
  return { date: today(), cups: 0, rings: 0, focusSessions: 0, longestFocusMs: 0 };
}

function read(): DayStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const r = JSON.parse(raw) as Partial<DayStats>;
      if (r.date === today()) return { ...empty(), ...r, date: today() };
    }
  } catch {
    /* ignore */
  }
  return empty();
}

function write(s: DayStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** 今天的全部记录（首页读取用） */
export function getStatsToday(): DayStats {
  return read();
}

/** 记一杯（倒计时自然完成 / 正计时结束这一杯时调用），返回累计后的今日杯数 */
export function addCup(): number {
  const s = read();
  s.cups += 1;
  write(s);
  return s.cups;
}

/** 正计时结束一杯：记录本杯圈痕数 + 最长单段心流，并标记发生过一次正计时 */
export function recordFocusSession(rings: number, longestSegmentMs: number): void {
  const s = read();
  s.focusSessions += 1;
  s.rings += Math.max(0, rings);
  s.longestFocusMs = Math.max(s.longestFocusMs, Math.max(0, longestSegmentMs));
  write(s);
}

/** 倒计时一杯结束：用本杯专注时长刷新「最长专注记录」 */
export function recordCountdownFocus(ms: number): void {
  const s = read();
  s.longestFocusMs = Math.max(s.longestFocusMs, Math.max(0, ms));
  write(s);
}
