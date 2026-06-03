import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTimerOptions {
  autoStart?: boolean;
  onComplete?: () => void;
}

export interface Timer {
  /** 剩余秒数（浮点，便于平滑动画） */
  remaining: number;
  isRunning: boolean;
  /** 自然倒计时归零 */
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  /** 提前结束：停止但不算完成 */
  stop: () => void;
  reset: (toSeconds?: number) => void;
}

/**
 * 基于时间戳的倒计时：用 deadline - Date.now() 反算剩余，
 * 后台标签页被节流也不会漂移（恢复时按真实时间一次性追平）。
 */
export function useTimer(durationSeconds: number, opts: UseTimerOptions = {}): Timer {
  const { autoStart = true, onComplete } = opts;

  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  const remainingRef = useRef(durationSeconds);
  const deadlineRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;
    deadlineRef.current = Date.now() + remainingRef.current * 1000;

    const tick = () => {
      const left = Math.max(0, (deadlineRef.current! - Date.now()) / 1000);
      remainingRef.current = left;
      setRemaining(left);
      if (left <= 0) {
        setIsRunning(false);
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning]);

  const start = useCallback(() => {
    if (remainingRef.current > 0) setIsRunning(true);
  }, []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => {
    setIsRunning((r) => (remainingRef.current > 0 ? !r : false));
  }, []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(
    (toSeconds = durationSeconds) => {
      remainingRef.current = toSeconds;
      setRemaining(toSeconds);
      setIsComplete(false);
      setIsRunning(false);
    },
    [durationSeconds],
  );

  return { remaining, isRunning, isComplete, start, pause, toggle, stop, reset };
}
