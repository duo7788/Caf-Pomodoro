import { useEffect, useState } from 'react';
import { CoffeeCup } from './CoffeeCup';
import './CoffeeLoading.css';

export const COFFEE_LOADING_DURATION = 3500;
const rings = [1, .8, .6, .4].map((level, index) => ({
  level,
  strength: .55 + index * .1,
}));

export function CoffeeLoading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const started = performance.now();
    let frame: number;
    const animate = (now: number) => {
      // Reveal all four rings, then dissolve the overlay into the already mounted menu.
      const elapsed = Math.min(1, (now - started) / 2600);
      const eased = elapsed * elapsed * (3 - 2 * elapsed);
      setProgress(1 - eased * .88);
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const timer = window.setTimeout(onComplete, COFFEE_LOADING_DURATION);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <main className="coffee-loading" role="status" aria-live="polite" aria-label="正在准备咖啡，即将进入专注页面">
      <div className="coffee-loading-cup" aria-hidden="true">
        <CoffeeCup progress={progress} color="#5b3420" rings={rings} liveRings />
      </div>
      <span className="coffee-loading-name" aria-hidden="true">Café Pomodoro</span>
    </main>
  );
}
