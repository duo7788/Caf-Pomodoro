import { useState } from 'react';
import { CoffeeType, FocusMode, COFFEE_MENU, ADDONS } from '../types';
import { Coffee, Play, Timer, Eye } from 'lucide-react';
import { getCupsToday, getFocusMsToday } from '../stats';

interface MenuProps {
  onStart: (coffee: CoffeeType, addons: string[], mode: FocusMode) => void;
}

export function Menu({ onStart }: MenuProps) {
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeType>('americano');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [mode, setMode] = useState<FocusMode>('countdown');
  const [cupsToday] = useState(getCupsToday);
  const [focusMinToday] = useState(() => Math.round(getFocusMsToday() / 60000));

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const currentConfig = COFFEE_MENU.find(c => c.id === selectedCoffee)!;
  const addonsTotalMsg = selectedAddons.length > 0 
    ? selectedAddons.map(id => ADDONS.find(a => a.id === id)?.timeModifier).reduce((a, b) => (a || 0) + (b || 0), 0)
    : 0;

  const totalTime = currentConfig.baseTime + (addonsTotalMsg || 0);

  return (
    <div
      className="flex items-center justify-center min-h-screen font-sans p-6 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, #f3ece0 0%, #e9e0d2 45%, #ddd1bf 100%)',
      }}
    >
      {/* 全局纸张噪点纹理 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* 顶部柔光，让背景有空间感 */}
      <div
        className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[140%] h-[60%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,250,240,0.55) 0%, rgba(255,250,240,0) 70%)',
        }}
      />

      <div className="max-w-md w-full relative pt-6">
      {/* 账单板夹子（复古黄铜 · 水彩质感，压在卡片顶边正中） */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ width: 200, height: 64 }}>
        <svg viewBox="0 0 200 64" width="200" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* 复古深棕竖向渐变（围绕 #4a3b32） */}
            <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6f5a4c" />
              <stop offset="0.22" stopColor="#574539" />
              <stop offset="0.55" stopColor="#4a3b32" />
              <stop offset="0.8" stopColor="#5a4a3d" />
              <stop offset="1" stopColor="#33271f" />
            </linearGradient>
            <linearGradient id="brassTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7d6657" />
              <stop offset="0.5" stopColor="#54433a" />
              <stop offset="1" stopColor="#3a2d25" />
            </linearGradient>
            {/* 水彩边缘：湍流位移让轮廓微微渗化、不规则 */}
            <filter id="wc" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="2" seed="11" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* 水彩晕染斑块（叠在表面做颜料浓淡） */}
            <filter id="wcBlob" x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.05" numOctaves="3" seed="5" result="t" />
              <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 0.9" result="a" />
              <feComposite in="SourceGraphic" in2="a" operator="in" />
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </defs>

          <g filter="url(#wc)">
            {/* 夹子在纸面上的水彩投影 */}
            <ellipse cx="100" cy="57" rx="80" ry="6.5" fill="rgba(74,59,50,0.16)" />
            {/* 下颚（咬住纸的宽横条） */}
            <rect x="14" y="38" width="172" height="18" rx="7" fill="url(#brass)" stroke="#2a201a" strokeWidth="0.9" />
            {/* 上夹身（更宽、复古弧肩） */}
            <rect x="40" y="6" width="120" height="36" rx="11" fill="url(#brassTop)" stroke="#2a201a" strokeWidth="0.9" />
            {/* 两道复古压纹线 */}
            <rect x="52" y="14" width="96" height="1.6" rx="0.8" fill="rgba(42,32,26,0.5)" />
            <rect x="52" y="33" width="96" height="1.6" rx="0.8" fill="rgba(42,32,26,0.45)" />
            {/* 中央铆钉 */}
            <circle cx="100" cy="24" r="6" fill="#5a4a3d" stroke="#2a201a" strokeWidth="0.9" />
            <circle cx="97.8" cy="21.8" r="1.8" fill="rgba(245,238,228,0.55)" />
          </g>
          {/* 水彩晕染层：柔和的颜料浓淡，叠在夹身上 */}
          <g filter="url(#wcBlob)" opacity="0.5">
            <rect x="40" y="6" width="120" height="36" rx="11" fill="#241a14" />
          </g>
          {/* 顶部一抹水彩高光 */}
          <rect x="48" y="9" width="104" height="4" rx="2" fill="rgba(245,238,228,0.4)" filter="url(#wc)" />
        </svg>
      </div>

      <div className="bg-[#fdfbf7] border border-[#e0d6c8] rounded-2xl p-10 relative overflow-hidden"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -12px rgba(74,59,50,0.28), 0 6px 16px -8px rgba(74,59,50,0.20)',
        }}
      >
        {/* 卡片内的极淡纸纹 */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10">
        <div className="text-center mb-10">
          <Coffee className="w-10 h-10 mx-auto text-[#4a3b32] mb-4" strokeWidth={1.5} />
          <h1 className="text-4xl font-serif text-[#3e2723] mb-2 tracking-wide">Café Pomodoro</h1>
          <p className="text-sm text-gray-500 italic font-serif">Select your brew, set your focus.</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-px w-6 bg-[#cbbfa9]" />
            <p className="text-xs text-[#8a7964] font-serif tracking-[0.25em]">
              一杯咖啡的时间，一次思考的拓片
            </p>
            <span className="h-px w-6 bg-[#cbbfa9]" />
          </div>
          {(cupsToday > 0 || focusMinToday > 0) && (
            <p className="mt-2 text-xs text-[#8a7964] font-serif tracking-wide">
              {cupsToday > 0 && <>今天已完成 {cupsToday} 杯 ☕</>}
              {cupsToday > 0 && focusMinToday > 0 && ' · '}
              {focusMinToday > 0 && <>专注 {focusMinToday} 分钟</>}
            </p>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-4">Mode</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('countdown')}
                className={`p-4 rounded-lg border text-left transition-all duration-300
                  ${mode === 'countdown' ? 'border-[#4a3b32] bg-[#f4efe8]' : 'border-[#e0d6c8] hover:border-[#4a3b32]'}`}
              >
                <Timer className="w-5 h-5 text-[#4a3b32] mb-2" strokeWidth={1.5} />
                <div className="font-serif text-[#3e2723]">倒计时</div>
                <div className="text-xs text-gray-500 mt-1">一杯咖啡的时间</div>
              </button>
              <button
                onClick={() => setMode('countup')}
                className={`p-4 rounded-lg border text-left transition-all duration-300
                  ${mode === 'countup' ? 'border-[#4a3b32] bg-[#f4efe8]' : 'border-[#e0d6c8] hover:border-[#4a3b32]'}`}
              >
                <Eye className="w-5 h-5 text-[#4a3b32] mb-2" strokeWidth={1.5} />
                <div className="font-serif text-[#3e2723]">正计时</div>
                <div className="text-xs text-gray-500 mt-1">跟随专注 · 需摄像头</div>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-4">The Menu</h2>
            <div className="space-y-3">
              {COFFEE_MENU.map((coffee) => (
                <button
                  key={coffee.id}
                  onClick={() => setSelectedCoffee(coffee.id)}
                  className={`w-full text-left p-4 rounded-lg flex items-center justify-between transition-all duration-300 border-b-2
                    ${selectedCoffee === coffee.id 
                      ? 'bg-[#f4efe8] border-[#4a3b32]' 
                      : 'bg-transparent border-transparent hover:bg-[#f8f5f0]'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className="flex items-baseline gap-2">
                      <span className="font-serif text-lg text-[#3e2723]">{coffee.name}</span>
                      <span className="font-serif text-sm text-[#9c8a72] tracking-[0.15em]">
                        {coffee.nameZh}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500 mt-1">{coffee.description}</span>
                  </div>
                  <span className="text-sm text-[#4a3b32] font-medium">{coffee.baseTime} m</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-widest text-[#8a7964] uppercase mb-4">Add-ons</h2>
            <div className="flex gap-4">
              {ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex-1 py-3 px-4 rounded-lg border text-sm transition-colors duration-300
                      ${isSelected 
                        ? 'border-[#4a3b32] bg-[#f4efe8] text-[#3e2723]' 
                        : 'border-[#e0d6c8] text-gray-500 hover:border-[#4a3b32]'
                      }
                    `}
                  >
                    {addon.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#e0d6c8]">
          <div className="flex justify-between items-center mb-6">
            {mode === 'countdown' ? (
              <>
                <span className="font-serif italic text-gray-600">Total Brew Time</span>
                <span className="text-2xl font-serif text-[#3e2723]">{totalTime} mins</span>
              </>
            ) : (
              <span className="font-serif italic text-gray-600">跟随你的专注，喝到你按下结束</span>
            )}
          </div>
          <button
            onClick={() => onStart(selectedCoffee, selectedAddons, mode)}
            disabled={mode === 'countdown' && totalTime <= 0}
            className="w-full bg-[#4a3b32] hover:bg-[#2b1f1a] disabled:bg-gray-400 text-[#fdfbf7] py-4 rounded-lg font-serif text-lg tracking-wide transition-all duration-300 flex items-center justify-center shadow-lg"
          >
            <Play className="w-5 h-5 mr-3" fill="currentColor" />
            Brew & Focus
          </button>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
