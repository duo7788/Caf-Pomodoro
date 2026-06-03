import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttnState } from './useAttention';
import type { RingMark } from '../components/CoffeeCup';

// ——— 可调参数（真实时间口径）———
/**
 * 时间倍速：把整条模拟时间线等比压缩。1 = 真实时间（上线值）。
 * 调试时可临时设大（如 12）以便几分钟内测完全部分档。
 */
const TIME_SCALE = 1;
/** 每「一口」喝掉的液面比例（约 12 口喝完一杯） */
const GULP = 0.08;
/** 持续看屏时，每隔这么久（模拟时间）再喝一口 */
const GULP_INTERVAL_MS = 5000;
/** 不足 1 分钟的专注，其后的分心不留圈痕（只喝、不记痕） */
const MIN_RING_FOCUS_MS = 60 * 1000;
/** 专注时长上报节流（仅结束页展示，无需高频） */
const FOCUS_EMIT_MS = 500;

/**
 * 专注时长(ms) → 圈痕深浅。分段线性，锚点（分钟→strength）：
 *   1→0.2（浅）, 10→0.4, 30→0.7（中）, 60→1.0（深，封顶）
 */
function strengthFromFocus(ms: number): number {
  const min = ms / 60000;
  const anchors: Array<[number, number]> = [
    [1, 0.2],
    [10, 0.4],
    [30, 0.7],
    [60, 1.0],
  ];
  if (min <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [m1, s1] = anchors[i];
    if (min <= m1) {
      const [m0, s0] = anchors[i - 1];
      return s0 + ((s1 - s0) * (min - m0)) / (m1 - m0);
    }
  }
  return 1;
}

/**
 * 把注意力三态转成咖啡液面（「一口一截」模型）：
 *  - FOCUS      → 液面完全不动，累计这段心流时长
 *  - DISTRACTED → 进入瞬间「咕咚」喝一口；持续看屏则每隔 GULP_INTERVAL 再喝一口（越久越多）
 *  - AWAY/IDLE  → 一切冻结
 * 进入分心瞬间，若刚结束的专注 ≥1 分钟，封一道圈痕（深浅∝时长）；圈痕间距 = 这次分心喝了几口。
 * 液面到底 → onEmpty 触发（杯子见底，会话结束）。
 */
export function useCoffeeLevel(running: boolean, onEmpty?: () => void) {
  const [level, setLevel] = useState(1);
  const [rings, setRings] = useState<RingMark[]>([]);
  const [totalFocusMs, setTotalFocusMs] = useState(0);

  const levelRef = useRef(1);
  const focusMsRef = useRef(0); // 当前这段专注的时长
  const totalFocusRef = useRef(0); // 本杯累计专注时长
  const distractAccumRef = useRef(0); // 当前分心累计（用于触发下一口）
  const attnRef = useRef<AttnState>('IDLE');
  const lastRef = useRef(0);
  const lastEmitRef = useRef(0);
  const emptiedRef = useRef(false);
  const rafRef = useRef(0);
  const onEmptyRef = useRef(onEmpty);
  onEmptyRef.current = onEmpty;

  /** 喝一口：液面离散下降一截 */
  const gulp = useCallback(() => {
    if (emptiedRef.current) return;
    levelRef.current = Math.max(0, levelRef.current - GULP);
    setLevel(levelRef.current);
    if (levelRef.current <= 0) {
      emptiedRef.current = true;
      setTotalFocusMs(totalFocusRef.current);
      onEmptyRef.current?.();
    }
  }, []);

  /** 喂入最新注意力状态（在状态变化时调用） */
  const ingest = useCallback(
    (next: AttnState) => {
      const prev = attnRef.current;
      if (next === prev) return;
      // 进入「啜饮」：先封圈痕（专注≥1分钟），再立刻喝一口
      if (next === 'DISTRACTED') {
        if (focusMsRef.current >= MIN_RING_FOCUS_MS) {
          const strength = strengthFromFocus(focusMsRef.current);
          const lvl = levelRef.current;
          setRings((rs) => [...rs, { level: lvl, strength }]);
        }
        focusMsRef.current = 0;
        distractAccumRef.current = 0;
        gulp();
      }
      attnRef.current = next;
    },
    [gulp],
  );

  const reset = useCallback(() => {
    levelRef.current = 1;
    focusMsRef.current = 0;
    totalFocusRef.current = 0;
    distractAccumRef.current = 0;
    attnRef.current = 'IDLE';
    lastEmitRef.current = 0;
    emptiedRef.current = false;
    setLevel(1);
    setRings([]);
    setTotalFocusMs(0);
  }, []);

  useEffect(() => {
    if (!running) return;
    lastRef.current = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      const sdt = dt * TIME_SCALE; // 压缩后的模拟时间
      const st = attnRef.current;
      if (st === 'FOCUS') {
        // 专注：液面完全不动，只累计心流时长
        focusMsRef.current += sdt * 1000;
        totalFocusRef.current += sdt * 1000;
      } else if (st === 'DISTRACTED') {
        // 持续看屏：每满一个间隔再喝一口
        distractAccumRef.current += sdt * 1000;
        while (distractAccumRef.current >= GULP_INTERVAL_MS && !emptiedRef.current) {
          distractAccumRef.current -= GULP_INTERVAL_MS;
          gulp();
        }
      }
      // AWAY / IDLE：一切冻结

      if (emptiedRef.current) return; // 见底，停循环

      if (now - lastEmitRef.current >= FOCUS_EMIT_MS) {
        lastEmitRef.current = now;
        setTotalFocusMs(totalFocusRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, gulp]);

  return { level, rings, totalFocusMs, ingest, reset };
}
