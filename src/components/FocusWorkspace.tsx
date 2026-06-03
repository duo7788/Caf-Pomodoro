import { useEffect, useRef, useState } from 'react';
import { CoffeeCup, type RingMark } from './CoffeeCup';
import { CoffeeConfig } from '../types';
import { ArrowLeft, Eye, Coffee, LogOut, Camera } from 'lucide-react';
import { useAttention, DEFAULT_CONFIG, type AttnState } from '../hooks/useAttention';
import { useCoffeeLevel } from '../hooks/useCoffeeLevel';
import { addFocusMs } from '../stats';

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

interface FocusWorkspaceProps {
  coffeeConfig: CoffeeConfig;
  selectedAddons: string[];
  onBack: () => void;
}

const STATE_META: Record<AttnState, { label: string; color: string; Icon: typeof Eye }> = {
  FOCUS: { label: '专注中', color: '#4ade80', Icon: Coffee },
  DISTRACTED: { label: '啜饮中', color: '#f59e0b', Icon: Eye },
  AWAY: { label: '离开 · 已暂停', color: '#9ca3af', Icon: LogOut },
  IDLE: { label: '准备中', color: '#9ca3af', Icon: Camera },
};

export function FocusWorkspace({ coffeeConfig, selectedAddons, onBack }: FocusWorkspaceProps) {
  // 正计时下放宽「离开」阈值：低机位深低头会丢脸，避免把深度专注误判成离开。
  const attention = useAttention({ ...DEFAULT_CONFIG, awayMs: 120000 });
  const { setConfig } = attention;
  const [ended, setEnded] = useState(false);
  const [emptied, setEmptied] = useState(false);
  const [calibStep, setCalibStep] = useState<'screen' | 'work' | 'done'>('screen');
  const [calibLeft, setCalibLeft] = useState(3);
  const [sampling, setSampling] = useState(false); // 读题 2s 后才开始采样
  const samplesRef = useRef<number[]>([]);
  const screenValRef = useRef(0);

  const calibrated = calibStep === 'done';
  const calibrating = attention.status === 'running' && !calibrated && !ended;
  const running = attention.status === 'running' && calibrated && !ended;

  const coffee = useCoffeeLevel(running, () => {
    // 咖啡见底 → 这一杯结束
    setEmptied(true);
    setEnded(true);
    attention.stop();
  });

  // 校准期间、且进入采样阶段后，才收集合成俯视值（读题的 2s 不采样）
  useEffect(() => {
    if (calibrating && sampling) samplesRef.current.push(attention.reading.worldDown);
  }, [attention.reading.worldDown, calibrating, sampling]);

  // 校准流程：每步先 2s 读题 → 3s 采样 → 取两步中点设阈值
  useEffect(() => {
    if (!calibrating) return;
    samplesRef.current = [];
    setSampling(false);
    setCalibLeft(3);
    const step = calibStep;

    let tick: ReturnType<typeof setInterval> | undefined;
    const startSampling = setTimeout(() => {
      setSampling(true);
      tick = setInterval(() => setCalibLeft((l) => Math.max(0, l - 1)), 1000);
    }, 2000); // 2s 读题

    const finalize = setTimeout(() => {
      const arr = samplesRef.current;
      const median = arr.length ? [...arr].sort((a, b) => a - b)[Math.floor(arr.length / 2)] : 0;
      if (step === 'screen') {
        screenValRef.current = median;
        setCalibStep('work');
      } else {
        const screenVal = screenValRef.current;
        const workVal = median;
        if (workVal - screenVal > 0.05) {
          setConfig({
            gazeEnterDistract: screenVal + 0.3 * (workVal - screenVal),
            gazeReturnFocus: screenVal + 0.5 * (workVal - screenVal),
          });
        }
        setCalibStep('done');
      }
    }, 5000); // 2s 读题 + 3s 采样

    return () => {
      clearTimeout(startSampling);
      clearTimeout(finalize);
      if (tick) clearInterval(tick);
    };
  }, [calibrating, calibStep, setConfig]);

  // 把注意力状态喂给液面逻辑
  useEffect(() => {
    if (running) coffee.ingest(attention.reading.state);
  }, [attention.reading.state, running, coffee]);

  // 这一杯结束时，把本杯专注时长累加进今日统计（仅一次）
  const recordedRef = useRef(false);
  useEffect(() => {
    if (ended && !recordedRef.current) {
      recordedRef.current = true;
      addFocusMs(coffee.totalFocusMs);
    }
  }, [ended, coffee.totalFocusMs]);

  const handleEnd = () => {
    setEnded(true);
    attention.stop();
  };

  const meta = STATE_META[attention.reading.state] ?? STATE_META.IDLE;
  const started = attention.status === 'running' || ended;
  const cameraOn = attention.status === 'running';
  const rings: RingMark[] = coffee.rings;

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

      {/* Top nav */}
      <div className="absolute top-8 left-8 z-20">
        <button
          onClick={onBack}
          className="text-[#e0d6c8] hover:text-white transition flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-serif tracking-wide">Back to Menu</span>
        </button>
      </div>

      {/* 状态徽标（运行中） */}
      {running && (
        <div className="absolute top-8 right-8 z-20">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border transition-colors duration-300"
            style={{ borderColor: meta.color + '66', background: meta.color + '1a' }}
          >
            <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
            <span className="text-sm font-serif" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>
      )}

      {/* 摄像头小窗（隐私可见，本地） */}
      <video
        ref={attention.videoRef}
        muted
        playsInline
        className="absolute bottom-6 left-6 z-20 w-40 rounded-lg border border-white/10 shadow-lg"
        style={{ transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }}
      />
      {cameraOn && (
        <div className="absolute bottom-[8.5rem] left-7 z-20 flex items-center gap-1.5 text-[10px] text-[#cbb89d] bg-black/50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> 本地 · 不录制
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4">
        {/* 开始前：授权门 */}
        {!started && (
          <div className="text-center max-w-md">
            <h2 className="font-serif text-4xl md:text-5xl text-[#f8f5f0] mb-4 tracking-wide">
              {coffeeConfig.name}
            </h2>
            <p className="text-[#a89b8d] font-serif leading-relaxed mb-2">
              正计时 · 跟随你的专注。目光落在工作上时咖啡几乎不动；目光离开你的工作即「啜一口」，液面下降并留下一道圈痕。
            </p>
            <p className="text-[#8a7964] text-sm leading-relaxed mb-8">
              需要使用摄像头判断你是否在专注。<b className="text-[#d8c3a5]">画面与推理全部在本机完成，不录制、不上传。</b>
              <br />
              适合「纸笔 / 看书 / 第二块屏」的线下专注场景。
            </p>
            <button
              onClick={attention.start}
              disabled={attention.status === 'camera' || attention.status === 'loading'}
              className="px-8 py-4 bg-[#d8c3a5] text-[#2c2420] font-serif text-lg rounded-lg shadow-lg hover:bg-white transition disabled:opacity-50"
            >
              {attention.status === 'camera'
                ? '请在弹窗中允许摄像头…'
                : attention.status === 'loading'
                ? '加载中…'
                : '开始专注（开启摄像头）'}
            </button>
            {attention.error && (
              <p className="mt-4 text-sm text-red-400">
                {attention.error}
              </p>
            )}
          </div>
        )}

        {/* 校准（看屏 / 看桌面） */}
        {calibrating && (
          <div className="text-center max-w-md">
            <p className="text-xs uppercase tracking-widest text-[#8a7964] mb-3">
              快速校准 · {calibStep === 'screen' ? '1 / 2' : '2 / 2'}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#f8f5f0] mb-4 tracking-wide">
              {calibStep === 'screen' ? '请看着屏幕中央' : '请看你平时干活的地方'}
            </h2>
            <p className="text-[#a89b8d] font-serif leading-relaxed mb-6">
              {calibStep === 'screen'
                ? '保持你平时看屏幕的姿势，别动。'
                : '看向你的桌面 / 纸笔 / 资料，就像真的在干活。'}
            </p>
            {sampling ? (
              <div className="text-6xl font-serif text-[#d8c3a5] mb-6">{calibLeft}</div>
            ) : (
              <div className="text-base font-serif text-[#8a7964] mb-6 h-[3.75rem] flex items-center justify-center">
                看清题目，马上开始采样…
              </div>
            )}
            <button
              onClick={() => setCalibStep('done')}
              className="text-sm text-[#8a7964] hover:text-[#d8c3a5] transition underline underline-offset-4"
            >
              跳过校准（用默认）
            </button>
          </div>
        )}

        {/* 进行中 / 结束 */}
        {started && !calibrating && (
          <>
            <div className="text-center mb-4">
              <h2 className="font-serif text-4xl md:text-5xl text-[#f8f5f0] mb-2 tracking-wide">
                {coffeeConfig.name}
              </h2>
              <p className="text-[#a89b8d] font-serif italic">
                {ended
                  ? emptied
                    ? '咖啡见底了 · 这一杯到此结束'
                    : '这一杯，停在了这里'
                  : attention.reading.state === 'AWAY'
                  ? '你离开了，咖啡在等你'
                  : '专注，让咖啡为你停留'}
              </p>
              {ended && (
                <p className="text-[#8a7964] font-serif text-sm mt-2">
                  专注 {formatDuration(coffee.totalFocusMs)} · 留下 {rings.length} 道圈痕
                </p>
              )}
            </div>

            <div
              className="flex-shrink-0 relative w-80 h-80 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem] lg:w-[36rem] lg:h-[36rem] mb-6 transition-opacity duration-500"
              style={{ opacity: !ended && attention.reading.state === 'AWAY' ? 0.45 : 1 }}
            >
              <CoffeeCup
                progress={coffee.level}
                color={coffeeConfig.color}
                rings={rings}
                addons={selectedAddons}
                liveRings
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              {!ended ? (
                <button
                  onClick={handleEnd}
                  className="px-8 py-3 border border-[#f8f5f0]/25 text-[#f8f5f0] font-serif rounded-lg hover:bg-[#f8f5f0]/10 transition"
                >
                  结束这一杯
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="px-8 py-3 bg-[#e8dfce] text-[#2c2420] font-serif rounded-lg shadow-md hover:bg-white transition"
                >
                  Order Another
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
