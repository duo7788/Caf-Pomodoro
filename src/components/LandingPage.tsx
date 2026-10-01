import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { CoffeeCup } from './CoffeeCup';
import './LandingPage.css';

type DemoMode = 'countup' | 'countdown';
// Compressed demo: show the first distraction quickly, then contrast each drop
// with a clear hold at the same height while focused.
const focusFrames = [
  { level: 1, duration: 800, rings: [] },
  { level: 1, duration: 800, rings: [] },
  { level: .62, duration: 1100, rings: [{ level: 1, strength: .65 }] },
  { level: .62, duration: 1600, rings: [{ level: 1, strength: .65 }] },
  { level: .24, duration: 1100, rings: [{ level: 1, strength: .65 }, { level: .62, strength: .9 }] },
  { level: .24, duration: 1600, rings: [{ level: 1, strength: .65 }, { level: .62, strength: .9 }] },
];

export function LandingPage() {
  const [mode, setMode] = useState<DemoMode>('countup');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep(s => (s + 1) % focusFrames.length),
      mode === 'countup' ? focusFrames[step].duration : 2600);
    return () => window.clearTimeout(timer);
  }, [playing, mode, step]);

  const selectMode = (next: DemoMode) => { setMode(next); setStep(0); };
  const isFocus = mode === 'countup';
  const frame = focusFrames[step];
  const distracted = isFocus && (step === 2 || step === 4);
  const level = isFocus ? frame.level : 1 - step * .18;
  const rings = isFocus ? frame.rings : [1, .82, .64, .46, .28].map(level => ({ level, strength: .6 }));

  return (
    <div className="cafe-landing">
      <a className="landing-skip" href="#demo">跳到产品演示</a>
      <header className="landing-nav">
        <a href="#" className="landing-brand" aria-label="Café Pomodoro 首页"><Coffee size={22} strokeWidth={1.4} /><span>Café Pomodoro</span></a>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-eyebrow"><span /> YOUR LITTLE FOCUS CAFÉ</div>
          <h1 id="landing-title">Café <em>Pomodoro</em><span className="title-period">.</span></h1>
          <p className="landing-intro">用一杯慢慢见底的咖啡，感受时间。<br className="mobile-break" />让杯壁上的圈痕，留下你的专注节奏。</p>
          <div className="landing-actions"><a className="landing-primary" href="#app"><Coffee size={17} /> 开始专注 <ArrowUpRight size={17} /></a></div>
        </section>

        <section className="landing-demo-section" id="demo" aria-label="交互产品演示">
          <div className="demo-topline">
            <div className="demo-tabs" role="tablist" aria-label="计时模式">
              {(['countup', 'countdown'] as const).map((value, index) => (
                <button key={value} ref={el => { tabRefs.current[index] = el; }} id={`tab-${value}`} role="tab" aria-selected={mode === value} aria-controls="coffee-demo-panel" tabIndex={mode === value ? 0 : -1} onClick={() => selectMode(value)} onKeyDown={event => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
                  selectMode(target === 0 ? 'countup' : 'countdown');
                  tabRefs.current[target]?.focus();
                }}>{value === 'countup' ? <Camera size={15} /> : <Timer size={15} />}{value === 'countup' ? '正计时' : '倒计时'}</button>
              ))}
            </div>
          </div>

          <div className="demo-window" role="tabpanel" id="coffee-demo-panel" aria-labelledby={`tab-${mode}`} tabIndex={0}>
            <div className="demo-window-top"><span className="window-dots"><i /><i /><i /></span><span>THE FOCUS ROOM</span><Coffee size={14} /></div>
            <div className="demo-scene">
              <div className="demo-heading"><span className="demo-overline">{isFocus ? 'FOLLOW YOUR FLOW' : 'A LITTLE TIME, JUST FOR YOU'}</span><h2>{isFocus ? '跟随专注，慢慢来。' : '一杯美式，二十五分钟。'}</h2></div>
              <div className={`camera-peek ${isFocus ? '' : 'camera-peek-hidden'}`} aria-hidden={!isFocus}>
                <div className={`camera-illustration ${distracted ? 'is-distracted' : ''}`}><div className="camera-grid" /><div className="person-body" /><div className="person-head" /><div className="face-brackets" /><span className="camera-live-dot" /><span className="camera-sim-label">模拟画面</span></div>
                <div className="camera-peek-caption"><Camera size={13} /> 摄像头状态检测</div>
                <div className={`detection-pill ${distracted ? 'detection-distracted' : 'detection-focused'}`}><span />{distracted ? '检测到分心' : '检测到专注'}</div>
              </div>
              <div className={`demo-cup ${isFocus ? 'demo-cup-focus' : ''}`}><CoffeeCup progress={level} color="#5b3420" rings={rings} liveRings={isFocus} /></div>
              <div className={`demo-status ${isFocus ? `detection-pill ${distracted ? 'detection-distracted' : 'detection-focused'}` : ''}`}><span />{isFocus ? (distracted ? '检测到分心' : '检测到专注') : step === 5 ? '快喝完了' : '专注进行中'}</div>
              <p className="demo-scene-caption">{isFocus ? (distracted ? '分心，液面快速下降。' : '专注，液面保持不变。') : '不用盯着数字，咖啡会陪你走过这段时间。'}</p>
              <div className="demo-playback"><button onClick={() => setPlaying(p => !p)} aria-label={playing ? '暂停演示' : '播放演示'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><div className="demo-steps" aria-label={`演示进度 ${step + 1} / 6`}>{focusFrames.map((_, i) => <span key={i} className={i === step ? 'active' : ''} />)}</div><button onClick={() => setStep(0)} aria-label="重播演示"><RotateCcw size={14} /></button></div>
              <div className="scene-corner">{isFocus ? 'CAMERA-ASSISTED FOCUS' : 'CLASSIC POMODORO'}</div>
            </div>
          </div>
          <div className="demo-footnote"><span className="note-number">{isFocus ? '01' : '02'} /</span><p>{isFocus ? '专注，液面不动；分心，液面下降，留下圈痕。' : '选一杯喜欢的咖啡，设定一段专注时间。液面随时间逐口下降，直到这一杯喝完。'}<small>{isFocus ? '实际使用需开启摄像头；连续专注满 1 分钟后，分心才会留下圈痕。' : '无需摄像头。浓缩 15 分钟、美式 25 分钟、卡布奇诺 30 分钟、拿铁 45 分钟。'}</small></p></div>
        </section>

      </main>
      <footer className="landing-footer"><span><Coffee size={14} /> Café Pomodoro</span><span>Take your time. Make it yours.</span><a href="#app">来一杯？ <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
