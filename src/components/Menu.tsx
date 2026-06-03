import { useState } from 'react';
import { CoffeeType, FocusMode, COFFEE_MENU, ADDONS } from '../types';
import { Coffee, Play, ChevronRight, ChevronLeft, Timer, ScanFace } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCupsToday, getFocusMsToday } from '../stats';

interface MenuProps {
  onStart: (coffee: CoffeeType, addons: string[], mode: FocusMode) => void;
}

export function Menu({ onStart }: MenuProps) {
  const [mode, setMode] = useState<FocusMode>('countdown');
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeType>('americano');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [menuPage, setMenuPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [cupsToday] = useState(getCupsToday);
  const [focusMinToday] = useState(() => Math.round(getFocusMsToday() / 60000));

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

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setMenuPage(prev => prev + newDirection);
  };

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
      className={`w-full text-left ${compact ? 'py-3 px-4' : 'py-4 px-5'} rounded-lg flex items-center justify-between transition-all duration-300 border-b
        ${selectedCoffee === coffee.id
          ? 'bg-[#f4efe8] border-[#4a3b32]'
          : 'bg-transparent border-transparent hover:bg-[#f8f5f0]'
        }
      `}
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
      <div className="flex w-full h-[calc(100vh-1.5rem)] max-w-[1400px] max-h-[940px] shadow-2xl relative rounded-xl bg-[#4a3b32]">

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

          {(cupsToday > 0 || focusMinToday > 0) && (
            <p className="mt-8 text-sm text-[#9a8b7c] font-serif tracking-wide">
              {cupsToday > 0 && <>{cupsToday} 杯 ☕</>}
              {cupsToday > 0 && focusMinToday > 0 && ' · '}
              {focusMinToday > 0 && <>专注 {focusMinToday} 分钟</>}
            </p>
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
          <div className="flex justify-between items-end mb-5 pl-4 border-b border-[#e0d6c8] pb-4">
            <h2 className="text-xl font-serif font-semibold tracking-widest text-[#3e2723] uppercase">The Menu</h2>
            <span className="text-base font-serif text-[#8a7964]">Page {menuPage + 1} of 2</span>
          </div>

          {/* Paginated Content */}
          <div className="flex-1 relative" style={{ perspective: '1200px' }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {menuPage === 0 ? (
                <motion.div
                  key="page0"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-3 pl-4 absolute inset-0 w-full bg-[#fdfbf7]"
                >
                  {/* Mode selector — 竖排 */}
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-2">Mode</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setMode('countdown')}
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-300 outline-none flex items-center gap-3
                          ${mode === 'countdown' ? 'border-[#4a3b32] bg-[#f4efe8]' : 'border-[#e0d6c8] hover:bg-[#f8f5f0]'}`}
                      >
                        <Timer className={`w-5 h-5 shrink-0 ${mode === 'countdown' ? 'text-[#4a3b32]' : 'text-[#8a7964]'}`} />
                        <div>
                          <span className={`font-serif text-base font-medium block ${mode === 'countdown' ? 'text-[#3e2723]' : 'text-[#8a7964]'}`}>倒计时</span>
                          <span className="text-xs text-gray-500">一杯咖啡的时间</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setMode('countup')}
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-300 outline-none flex items-center gap-3
                          ${mode === 'countup' ? 'border-[#4a3b32] bg-[#f4efe8]' : 'border-[#e0d6c8] hover:bg-[#f8f5f0]'}`}
                      >
                        <ScanFace className={`w-5 h-5 shrink-0 ${mode === 'countup' ? 'text-[#4a3b32]' : 'text-[#8a7964]'}`} />
                        <div>
                          <span className={`font-serif text-base font-medium block ${mode === 'countup' ? 'text-[#3e2723]' : 'text-[#8a7964]'}`}>正计时</span>
                          <span className="text-xs text-gray-500">跟随专注，需摄像头</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {coffeesPage1.map(coffee => renderCoffeeItem(coffee))}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => paginate(1)}
                      className="group relative flex items-center gap-2 bg-[#fdfbf7] border-2 border-[#d3c9b7] text-[#4a3b32] font-serif font-semibold tracking-wider uppercase text-sm px-6 py-3 rounded-md hover:border-[#4a3b32] hover:bg-[#f4efe8] shadow-[4px_4px_0_#d3c9b7] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      <span className="z-10 relative">Next Page</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform z-10 relative" />
                      <div className="absolute right-[-2px] bottom-[-2px] w-0 h-0 border-l-[16px] border-t-[16px] border-l-[#d3c9b7] border-t-transparent transition-all group-hover:border-l-[20px] group-hover:border-t-[20px] z-20 pointer-events-none" />
                      <div className="absolute right-[-2px] bottom-[-2px] w-1 h-1 border-r-[16px] border-b-[16px] border-r-[#fdfbf7] border-b-[#fdfbf7] group-hover:border-r-[20px] group-hover:border-b-[20px] z-10 pointer-events-none transition-all" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="page1"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="pl-4 absolute inset-0 w-full bg-[#fdfbf7] flex flex-col"
                >
                  {/* 咖啡列表，与 page 1 相同行距 */}
                  <div className="space-y-4">
                    {coffeesPage2.map(coffee => renderCoffeeItem(coffee))}
                  </div>

                  {/* 花体装饰分隔线 */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                    <svg width="60" height="16" viewBox="0 0 60 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 8 Q8 2 15 8 Q22 14 29 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <path d="M31 8 Q38 2 45 8 Q52 14 58 8" stroke="#c4b49e" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                      <circle cx="30" cy="8" r="2.5" fill="#c4b49e"/>
                      <circle cx="30" cy="8" r="1" fill="#fdfbf7"/>
                    </svg>
                    <div className="flex-1 h-px bg-[#d3c9b7]" />
                  </div>

                  {/* Add-ons — 竖排，仅倒计时模式 */}
                  {mode === 'countdown' && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest text-[#8a7964] uppercase mb-2">Add-ons</h3>
                      <div className="flex flex-col gap-2">
                        {ADDONS.map(addon => {
                          const isSelected = selectedAddons.includes(addon.id);
                          return (
                            <button
                              key={addon.id}
                              onClick={() => toggleAddon(addon.id)}
                              className={`w-full py-4 px-5 rounded-lg border text-base font-serif text-left transition-colors duration-300
                                ${isSelected
                                  ? 'border-[#4a3b32] bg-[#f4efe8] text-[#3e2723]'
                                  : 'border-[#e0d6c8] text-[#6b5a4e] hover:border-[#4a3b32] hover:bg-[#f8f5f0]'
                                }`}
                            >
                              {addon.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 手绘咖啡杯插画（空白区装饰） */}
                  <div className="flex items-center justify-center opacity-[0.07] pointer-events-none select-none py-2">
                    <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="60" cy="98" rx="38" ry="7" stroke="#4a3b32" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M32 42 Q30 78 40 88 Q55 98 60 98 Q65 98 80 88 Q90 78 88 42 Z"
                        stroke="#4a3b32" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M88 52 Q106 52 106 65 Q106 78 88 78"
                        stroke="#4a3b32" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <ellipse cx="60" cy="42" rx="28" ry="6" stroke="#4a3b32" strokeWidth="2" fill="none"/>
                      <ellipse cx="60" cy="42" rx="21" ry="4" stroke="#4a3b32" strokeWidth="1.2" fill="none" strokeDasharray="3 1.5"/>
                      <path d="M48 30 Q44 20 48 13" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M60 27 Q56 17 60 10" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M72 30 Q68 20 72 13" stroke="#4a3b32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>

                  <div className="flex justify-start">
                    <button
                      onClick={() => paginate(-1)}
                      className="group relative flex items-center gap-2 bg-[#fdfbf7] border-2 border-[#d3c9b7] text-[#4a3b32] font-serif font-semibold tracking-wider uppercase text-sm px-6 py-3 rounded-md hover:border-[#4a3b32] hover:bg-[#f4efe8] shadow-[4px_4px_0_#d3c9b7] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform z-10 relative" />
                      <span className="z-10 relative">Prev Page</span>
                      <div className="absolute left-[-2px] bottom-[-2px] w-0 h-0 border-r-[16px] border-t-[16px] border-r-[#d3c9b7] border-t-transparent transition-all group-hover:border-r-[20px] group-hover:border-t-[20px] z-20 pointer-events-none" />
                      <div className="absolute left-[-2px] bottom-[-2px] w-1 h-1 border-l-[16px] border-b-[16px] border-l-[#fdfbf7] border-b-[#fdfbf7] group-hover:border-l-[20px] group-hover:border-b-[20px] z-10 pointer-events-none transition-all" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Persistent Footer */}
          <div className="mt-auto pt-4 pl-4 border-t border-[#e0d6c8] relative z-10 bg-[#fdfbf7]">
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
