import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { CoffeeCup } from './CoffeeCup';
import './LandingPage.css';

type DemoMode = 'countup' | 'countdown';
const focusFrames = [
  { level: 1, label: '专注中', detail: '目光落在手边，时间留给自己。', rings: [] },
  { level: 1, label: '专注中', detail: '一段专注，正在慢慢沉淀。', rings: [] },
  { level: .76, label: '片刻分心', detail: '啜一口咖啡，留下一段专注的圈痕。', rings: [{ level: 1, strength: .55 }] },
  { level: .76, label: '回到专注', detail: '回到手边的事，咖啡也静下来。', rings: [{ level: 1, strength: .55 }] },
  { level: .48, label: '片刻分心', detail: '专注越久，留在杯壁上的圈痕越深。', rings: [{ level: 1, strength: .55 }, { level: .76, strength: .9 }] },
  { level: .48, label: '回到专注', detail: '每一道痕迹，都是思考停留过的地方。', rings: [{ level: 1, strength: .55 }, { level: .76, strength: .9 }] },
];

export function LandingPage() {
  const [mode, setMode] = useState<DemoMode>('countup');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => setStep(s => (s + 1) % 6), 2600);
    return () => window.clearInterval(interval);
  }, [playing, mode]);

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
                <div className="camera-peek-caption"><Camera size={11} /> 摄像头感知专注</div>
              </div>
              <div className="demo-cup"><CoffeeCup progress={level} color="#5b3420" rings={rings} liveRings={isFocus} /></div>
              <div className={`demo-status ${distracted ? 'status-distracted' : ''}`}><span />{isFocus ? frame.label : step === 5 ? '快喝完了' : '专注进行中'}</div>
              <p className="demo-scene-caption">{isFocus ? frame.detail : '不用盯着数字，咖啡会陪你走过这段时间。'}</p>
              <div className="demo-playback"><button onClick={() => setPlaying(p => !p)} aria-label={playing ? '暂停演示' : '播放演示'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><div className="demo-steps" aria-label={`演示进度 ${step + 1} / 6`}>{focusFrames.map((_, i) => <span key={i} className={i === step ? 'active' : ''} />)}</div><button onClick={() => setStep(0)} aria-label="重播演示"><RotateCcw size={14} /></button></div>
              <div className="scene-corner">{isFocus ? 'CAMERA-ASSISTED FOCUS' : 'CLASSIC POMODORO'}</div>
            </div>
          </div>
          <div className="demo-footnote"><span className="note-number">{isFocus ? '01' : '02'} /</span><p>{isFocus ? '专注时，咖啡静静等待。分心时，液面下降，杯壁留下刚才那段专注的圈痕。' : '选一杯喜欢的咖啡，设定一段专注时间。液面随时间逐口下降，直到这一杯喝完。'}<small>{isFocus ? '实际使用需开启摄像头；连续专注满 1 分钟后，分心才会留下圈痕。本页仅为模拟演示。' : '无需摄像头。浓缩 15 分钟、美式 25 分钟、卡布奇诺 30 分钟、拿铁 45 分钟。'}</small></p></div>
        </section>

      </main>
      <footer className="landing-footer"><span><Coffee size={14} /> Café Pomodoro</span><span>Take your time. Make it yours.</span><a href="#app">来一杯？ <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
