import { useState, useEffect } from 'react';
import { CoffeeType, FocusMode, COFFEE_MENU, ADDONS } from '../types';
import { Coffee, Play, ChevronRight, ChevronLeft, Timer, ScanFace } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStatsToday } from '../stats';

interface MenuProps {
  onStart: (coffee: CoffeeType, addons: string[], mode: FocusMode) => void;
}

/** 「最长专注记录」展示用：小时/分钟/秒 */
function formatFocus(ms: number): string {
  const sec = Math.round(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} 时 ${m} 分`;
  if (m > 0) return `${m} 分钟`;
  return `${sec} 秒`;
}

/**
 * 选中态统一以「咖啡单品」为基准：圆角 + 底边线；
 * 选中＝浅底 + 深色底边线，未选＝透明、悬停浅底。
 */
const SELECT_BASE = 'rounded-lg border-b transition-all duration-300';
const selectTone = (active: boolean) =>
  active
    ? 'bg-[#f4efe8] border-[#4a3b32]'
    : 'bg-transparent border-transparent hover:bg-[#f8f5f0]';

export function Menu({ onStart }: MenuProps) {
  const [mode, setMode] = useState<FocusMode>('countdown');
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeType>('americano');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [menuPage, setMenuPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stats] = useState(getStatsToday);

  // 书本按设计尺寸 1400×940 等比缩放填满视口（字号随之放大），
  // 避免在大窗口下封顶居中、四周留白、字显得又小又空。
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const pad = 32; // 视口边距
      const s = Math.min((window.innerWidth - pad) / 1400, (window.innerHeight - pad) / 940);
      setScale(Math.min(s, 1.6)); // 上限防止超大屏过度放大
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const currentConfig = COFFEE_MENU.find(c => c.id === selectedCoffee)!;
  const addonsTotal = selectedAddons
    .map(id => ADDONS.find(a => a.id === id)?.timeModifier ?? 0)
    .reduce((a, b) => a + b, 0);
  const totalTime = currentConfig.baseTime + addonsTotal;

  const coffeesPage1 = COFFEE_MENU.slice(0, 3); // 1-Minute Test, Espresso, Americano
  const coffeesPage2 = COFFEE_MENU.slice(3);    // Cappuccino, Café Latte

  const TOTAL_PAGES = 2;

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setMenuPage(prev => Math.min(TOTAL_PAGES - 1, Math.max(0, prev + newDirection)));
  };

  const PageBtn = ({ dir }: { dir: 1 | -1 }) => (
    <button
      onClick={() => paginate(dir)}
      className="group relative flex items-center gap-2 bg-[#fdfbf7] border-2 border-[#d3c9b7] text-[#4a3b32] font-serif font-semibold tracking-wider uppercase text-sm px-6 py-3 rounded-md hover:border-[#4a3b32] hover:bg-[#f4efe8] shadow-[4px_4px_0_#d3c9b7] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
    >
      {dir === -1 && <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform z-10 relative" />}
      <span className="z-10 relative">{dir === 1 ? 'Next Page' : 'Prev Page'}</span>
      {dir === 1 && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform z-10 relative" />}
      {dir === 1 ? (
        <>
          <div className="absolute right-[-2px] bottom-[-2px] w-0 h-0 border-l-[16px] border-t-[16px] border-l-[#d3c9b7] border-t-transparent z-20 pointer-events-none" />
          <div className="absolute right-[-2px] bottom-[-2px] w-1 h-1 border-r-[16px] border-b-[16px] border-r-[#fdfbf7] border-b-[#fdfbf7] z-10 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute left-[-2px] bottom-[-2px] w-0 h-0 border-r-[16px] border-t-[16px] border-r-[#d3c9b7] border-t-transparent z-20 pointer-events-none" />
          <div className="absolute left-[-2px] bottom-[-2px] w-1 h-1 border-l-[16px] border-b-[16px] border-l-[#fdfbf7] border-b-[#fdfbf7] z-10 pointer-events-none" />
        </>
      )}
    </button>
  );

  const pageVariants = {
    initial: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: 'left center',
      zIndex: 0,
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      transformOrigin: 'left center',
      zIndex: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: (dir: number) => ({
      rotateY: dir < 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: 'left center',
      zIndex: 0,
      transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] as const },
    }),
  };

  const renderCoffeeItem = (coffee: (typeof COFFEE_MENU)[number], compact = false) => (
    <button
      key={coffee.id}
      onClick={() => setSelectedCoffee(coffee.id)}
      className={`w-full text-left ${compact ? 'py-3 px-4' : 'py-4 px-5'} flex items-center justify-between ${SELECT_BASE} ${selectTone(selectedCoffee === coffee.id)}`}
    >
      <div className="flex flex-col">
        <span className="flex items-baseline gap-2">
          <span className={`font-serif ${compact ? 'text-lg' : 'text-xl'} text-[#3e2723]`}>{coffee.name}</span>
          <span className="font-serif text-base text-[#9c8a72] tracking-[0.15em]">{coffee.nameZh}</span>
        </span>
        {!compact && <span className="text-sm text-gray-500 mt-1">{coffee.description}</span>}
      </div>
      {mode === 'countdown' && (
        <span className="text-base text-[#4a3b32] font-medium shrink-0 ml-4">{coffee.baseTime} m</span>
      )}
    </button>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#ece5db] font-sans p-4 overflow-hidden">

      {/* Book Container */}
      <div
        className="flex w-[1400px] h-[940px] shadow-2xl relative rounded-xl bg-[#4a3b32]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >

        {/* Left Cover */}
        <div className="flex-1 bg-[#3a2e27] rounded-l-xl relative flex flex-col justify-center items-center p-12 text-center border-r-[14px] border-[#2b221d]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent pointer-events-none rounded-l-xl" />

          <Coffee className="w-20 h-20 mx-auto text-[#d3c9b7] mb-8 drop-shadow-md" strokeWidth={1} />
          <h1 className="text-6xl font-serif text-[#fdfbf7] mb-8 tracking-wider drop-shadow-sm leading-tight">
            Café<br />Pomodoro
          </h1>

          <div className="w-20 h-px bg-[#d3c9b7] mb-8 mx-auto opacity-50" />

          <p className="text-sm text-[#c4b8a4] font-serif tracking-[0.2em] mb-6">
            一杯咖啡的时间，一次思考的拓片
          </p>

          <p className="text-base text-[#d3c9b7] italic font-serif leading-relaxed max-w-[280px] opacity-80">
            Select a brew to set your focus time, add some sweetness or an extra shot for stamina,
            and enjoy the ambient percolation of your thoughts.
          </p>

          {(stats.cups > 0 || stats.focusSessions > 0 || stats.longestFocusMs > 0) && (
            <div className="mt-10 flex flex-col items-center gap-2">
              {/* 最长专注记录 —— 大字主角 */}
              {stats.longestFocusMs > 0 && (
                <div className="text-center mb-1">
                  <div className="text-4xl font-serif text-[#f0e9da] tracking-wide drop-shadow-sm leading-none">
                    {formatFocus(stats.longestFocusMs)}
                  </div>
                  <div className="mt-2 text-[11px] tracking-[0.25em] uppercase text-[#9a8b7c]">
                    最长专注记录
                  </div>
                </div>
              )}

              {/* 杯数 · 圈痕 —— 小字 */}
              <p className="text-sm text-[#9a8b7c] font-serif tracking-wide">
                今天 {stats.cups} 杯 ☕
                {stats.focusSessions > 0 && <> · {stats.rings} 道圈痕</>}
              </p>
              {stats.focusSessions > 0 && (
                <p className="text-[10px] text-[#7d7062] tracking-wide">
                  圈痕 = 正计时中被打断的分心次数
                </p>
              )}
            </div>
          )}
        </div>

        {/* Wire Binding Rings */}
        <div className="absolute left-1/2 top-6 bottom-6 flex flex-col justify-around items-center -translate-x-1/2 z-20 pointer-events-none w-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1 w-full relative">
              <div className="w-full h-2 bg-gradient-to-b from-[#e5e5e5] via-[#ffffff] to-[#d4d4d4] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#a1a1a1]" />
              <div className="w-full h-2 bg-gradient-to-b from-[#e5e5e5] via-[#ffffff] to-[#d4d4d4] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#a1a1a1]" />
            </div>
          ))}
        </div>

        {/* Right Page */}
        <div className="flex-1 bg-[#fdfbf7] rounded-r-xl p-10 pb-8 flex flex-col relative shadow-inner overflow-hidden border-l border-[#f0eadf]">
          <div className="absolute top-0 bottom-0 left-0 w-10 bg-gradient-to-r from-[rgba(0,0,0,0.06)] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-end mb-8 pl-4 border-b border-[#e0d6c8] pb-5">
            <h2 className="text-xl font-serif font-semibold tracking-widest text-[#3e2723] uppercase">The Menu</h2>
            <span className="text-base font-serif text-[#8a7964]">Page {menuPage + 1} of {TOTAL_PAGES}</span>
          </div>

          {/* Paginated Content */}
          <div className="flex-1 relative" style={{ perspective: '1200px' }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">

              {/* ── PAGE 1: Mode + 花线 + Coffees(3) ── */}
              {menuPage === 0 && (
                <motion.div key="page0" custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"
                  className="pl-4 absolute inset-0 w-full bg-[#fdfbf7] flex flex-col"
                >
                  <div>
                    <h3 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-2">Mode</h3>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setMode('countdown')}
                        className={`w-full p-3 text-left outline-none flex items-center gap-3 ${SELECT_BASE} ${selectTone(mode === 'countdown')}`}
                      >
                        <Timer className={`w-5 h-5 shrink-0 ${mode === 'countdown' ? 'text-[#4a3b32]' : 'text-[#8a7964]'}`} />
                        <div>
                          <span className={`font-serif text-base font-medium block ${mode === 'countdown' ? 'text-[#3e2723]' : 'text-[#8a7964]'}`}>倒计时</span>
                          <span className="text-xs text-gray-500">一杯咖啡的时间</span>
                        </div>
                      </button>
                      <button onClick={() => setMode('countup')}
                        className={`w-full p-3 text-left outline-none flex items-center gap-3 ${SELECT_BASE} ${selectTone(mode === 'countup')}`}
                      >
                        <ScanFace className={`w-5 h-5 shrink-0 ${mode === 'countup' ? 'text-[#4a3b32]' : 'text-[#8a7964]'}`} />
                        <div>
                          <span className={`font-serif text-base font-medium block ${mode === 'countup' ? 'text-[#3e2723]' : 'text-[#8a7964]'}`}>正计时</span>
                          <span className="text-xs text-gray-500">跟随专注，需摄像头</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  {/* 花装饰线条 */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                    <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
                      <path d="M2 8 Q8 2 15 8 Q22 14 29 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <path d="M31 8 Q38 2 45 8 Q52 14 58 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <circle cx="30" cy="8" r="2.5" fill="#c4b49e"/>
                      <circle cx="30" cy="8" r="1" fill="#fdfbf7"/>
                    </svg>
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                  </div>
                  {/* 咖啡单品小标题 */}
                  <h3 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-3">Coffees</h3>
                  <div className="space-y-4">
                    {coffeesPage1.map(coffee => renderCoffeeItem(coffee))}
                  </div>
                  <div className="flex justify-end mt-auto mb-2">
                    <PageBtn dir={1} />
                  </div>
                </motion.div>
              )}

              {/* ── PAGE 2: 拿铁 + 花线 + Add-ons + 手绘图 + 上一页 ── */}
              {menuPage === 1 && (
                <motion.div key="page1" custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"
                  className="pl-4 absolute inset-0 w-full bg-[#fdfbf7] flex flex-col"
                >
                  <div className="space-y-4">
                    {coffeesPage2.map(coffee => renderCoffeeItem(coffee))}
                  </div>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                    <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
                      <path d="M2 8 Q8 2 15 8 Q22 14 29 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <path d="M31 8 Q38 2 45 8 Q52 14 58 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <circle cx="30" cy="8" r="2.5" fill="#c4b49e"/>
                      <circle cx="30" cy="8" r="1" fill="#fdfbf7"/>
                    </svg>
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                  </div>
                  {mode === 'countdown' && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest text-[#8a7964] uppercase mb-3">Add-ons</h3>
                      <div className="flex flex-col gap-2">
                        {ADDONS.map(addon => {
                          const isSelected = selectedAddons.includes(addon.id);
                          return (
                            <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                              className={`w-full py-4 px-5 text-base font-serif text-left text-[#3e2723] ${SELECT_BASE} ${selectTone(isSelected)}`}
                            >
                              <span className="inline-flex items-baseline gap-2">
                                <span>{addon.name}</span>
                                <span className="font-serif text-base text-[#9c8a72] tracking-[0.15em]">{addon.nameZh}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 flex items-center justify-center opacity-[0.07] pointer-events-none select-none">
                    <svg width="100" height="100" viewBox="0 0 120 120" fill="none">
                      <ellipse cx="60" cy="98" rx="38" ry="7" stroke="#4a3b32" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M32 42 Q30 78 40 88 Q55 98 60 98 Q65 98 80 88 Q90 78 88 42 Z" stroke="#4a3b32" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M88 52 Q106 52 106 65 Q106 78 88 78" stroke="#4a3b32" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <ellipse cx="60" cy="42" rx="28" ry="6" stroke="#4a3b32" strokeWidth="2" fill="none"/>
                      <ellipse cx="60" cy="42" rx="21" ry="4" stroke="#4a3b32" strokeWidth="1.2" fill="none" strokeDasharray="3 1.5"/>
                      <path d="M48 30 Q44 20 48 13" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M60 27 Q56 17 60 10" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M72 30 Q68 20 72 13" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex justify-start mt-auto mb-2">
                    <PageBtn dir={-1} />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Persistent Footer */}
          <div className="mt-auto pt-5 pl-4 border-t border-[#e0d6c8] relative z-10 bg-[#fdfbf7]">
            <div className="flex justify-between items-center mb-4">
              <span className="font-serif italic text-lg text-gray-600">
                {mode === 'countdown' ? 'Total Brew Time' : 'Focus Style'}
              </span>
              <span className="text-2xl font-serif text-[#3e2723] font-medium">
                {mode === 'countdown' ? `${totalTime} mins` : 'Open Ended'}
              </span>
            </div>
            <button
              onClick={() => onStart(selectedCoffee, selectedAddons, mode)}
              disabled={mode === 'countdown' && totalTime <= 0}
              className="w-full bg-[#4a3b32] hover:bg-[#2b1f1a] disabled:bg-gray-400 text-[#fdfbf7] py-4 rounded-lg font-serif text-lg tracking-wide transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" fill="currentColor" />
              Brew & Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
