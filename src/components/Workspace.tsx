import { useEffect, useMemo, useState } from 'react';
import { CoffeeCup, type RingMark } from './CoffeeCup';
import { CoffeeConfig, ADDONS } from '../types';
import { Disc, Square, Pause, Play, ArrowLeft } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { addCup } from '../stats';
import { playChime } from '../sound';

interface WorkspaceProps {
  coffeeConfig: CoffeeConfig;
  selectedAddons: string[];
  onBack: () => void;
}

export function Workspace({ coffeeConfig, selectedAddons, onBack }: WorkspaceProps) {
  const addonsTotal =
    selectedAddons
      .map((id) => ADDONS.find((a) => a.id === id)?.timeModifier)
      .reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
  const initialDurationMinutes = Math.max(1, coffeeConfig.baseTime + addonsTotal);
  const initialDurationSeconds = initialDurationMinutes * 60;

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [cupsToday, setCupsToday] = useState(0);

  const handleComplete = () => {
    playChime();
    setCupsToday(addCup());
    document.title = '☕ 喝完了 · Café Pomodoro';
  };

  const timer = useTimer(initialDurationSeconds, { autoStart: true, onComplete: handleComplete });

  // 离开本页时还原标签页标题
  useEffect(() => {
    return () => {
      document.title = 'Café Pomodoro';
    };
  }, []);

  // 啜饮 / 圈痕的阶梯数：至少 3 口，长会话每 5 分钟一口
  const numSips = useMemo(
    () => Math.max(3, Math.floor(initialDurationMinutes / 5)),
    [initialDurationMinutes],
  );
  const steps = numSips + 1;

  // 倒计时模式：每口时间相等，故每道圈痕强度一致（均匀的思考段落）。
  // 正计时模式接入后，strength 将由「该段专注停留时长」决定。
  const rings = useMemo<RingMark[]>(() => {
    const generated: RingMark[] = [];
    for (let i = steps; i > 0; i--) generated.push({ level: i / steps, strength: 0.6 });
    return generated;
  }, [steps]);

  const rawProgress = timer.remaining / initialDurationSeconds;
  // 阶梯化：液面停一段、猛地降一截，对应「啜一口」
  const progress = Math.ceil(rawProgress * steps - 0.000001) / steps;

  const ended = timer.isComplete || stopped;

  const getStatusText = () => {
    if (timer.isComplete) return 'Finished.';
    if (stopped) return '已停止 · 未喝完';
    if (!timer.isRunning) return 'Paused.';
    if (progress < 0.25) return 'Almost finished.';
    if (progress < 0.5) return 'Halfway there.';
    if (progress < 0.75) return 'Stay focused.';
    return 'Deep work mode.';
  };

  const handleStopEarly = () => {
    timer.stop();
    setStopped(true);
  };

  return (
    <div
      className="min-h-screen bg-[#2c2420] font-sans flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle at center, #3c3029 0%, #1a1412 100%)' }}
    >
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      ></div>

      {/* Top Navigation */}
      <div className="absolute top-8 left-8 z-20 flex space-x-6 items-center">
        <button
          onClick={onBack}
          className="text-[#e0d6c8] hover:text-white transition group flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-serif tracking-wide">Back to Menu</span>
        </button>
      </div>

      {/* Gramophone Toggle */}
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={() => setMusicPlaying(!musicPlaying)}
          className={`flex items-center space-x-3 px-4 py-2 rounded-full border transition-all duration-500
            ${musicPlaying ? 'border-[#d8c3a5] bg-[#3e2723]' : 'border-[#d8c3a5]/30 hover:border-[#d8c3a5]/60'}
          `}
        >
          <div className="relative">
            <Disc
              className={`w-6 h-6 text-[#d8c3a5] ${musicPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3s' }}
            />
            {musicPlaying && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            )}
          </div>
          <span className="font-serif text-[#d8c3a5] tracking-wide text-sm hidden sm:inline">
            Ambience
          </span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 mt-8">
        {/* Title & Status */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-5xl md:text-6xl text-[#f8f5f0] mb-3 tracking-wide drop-shadow-sm">
            {coffeeConfig.name}
          </h2>
          <p className="text-[#a89b8d] font-serif italic text-lg md:text-xl flex items-center justify-center gap-2">
            {getStatusText()}
          </p>
        </div>

        {/* Center: The Coffee Cup */}
        <div className="flex-shrink-0 relative w-80 h-80 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem] lg:w-[38rem] lg:h-[38rem] mb-8">
          <CoffeeCup
            progress={progress}
            color={coffeeConfig.color}
            rings={rings}
            addons={selectedAddons}
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center space-x-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
            {!ended ? (
              <>
                <button
                  onClick={timer.toggle}
                  className="p-4 rounded-full border border-[#f8f5f0]/20 text-[#f8f5f0] hover:bg-[#f8f5f0]/10 transition shadow-sm"
                  aria-label={timer.isRunning ? 'Pause' : 'Resume'}
                >
                  {timer.isRunning ? (
                    <Pause className="w-7 h-7" strokeWidth={1.5} />
                  ) : (
                    <Play className="w-7 h-7" strokeWidth={1.5} />
                  )}
                </button>
                <button
                  onClick={handleStopEarly}
                  className="p-4 rounded-full border border-[#f8f5f0]/20 text-[#f8f5f0] hover:bg-[#f8f5f0]/10 transition shadow-sm"
                  aria-label="Stop"
                >
                  <Square className="w-7 h-7" strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <button
                onClick={onBack}
                className="px-8 py-3 bg-[#e8dfce] text-[#2c2420] font-serif rounded shadow-md hover:bg-white transition-colors"
              >
                Order Another
              </button>
            )}
          </div>

          {timer.isComplete && cupsToday > 0 && (
            <p className="text-[#8a7964] font-serif italic text-sm">这是今天的第 {cupsToday} 杯 ☕</p>
          )}
        </div>
      </div>
    </div>
  );
}
