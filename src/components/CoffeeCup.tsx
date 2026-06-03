import React from 'react';

/** 一道圈痕：液面停留过的高度 + 这段停留的「深度」(0~1，停越久越深) */
export interface RingMark {
  level: number; // 0~1，对应液面高度
  strength: number; // 0~1，映射到不透明度/线宽 —— 即这段心流有多长
}

interface CoffeeCupProps {
  progress: number; // 0 to 1
  color: string;
  rings: RingMark[];
  addons?: string[];
  /**
   * true（正计时）：圈痕是实时封缄的，一直画着、由下降的液体自然揭开。
   * false（倒计时）：圈痕预置在各高度，靠不透明度阈值随液面下降逐道显形。
   */
  liveRings?: boolean;
}

// 把杯子主色压暗，作为渍痕下缘的沉积色。
function darken(hex: string, amt = 0.5): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const d = (c: number) => Math.max(0, Math.round(c * (1 - amt)));
  return `rgb(${d(r)},${d(g)},${d(b)})`;
}

export function CoffeeCup({ progress, color, rings, addons = [], liveRings = false }: CoffeeCupProps) {
  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));
  
  const hasSugar = addons.includes('sugar');
  const hasExtraShot = addons.includes('extra_shot');
  
  // Strict Isometric Perspective Ratio
  const ratio = 0.68;
  
  // Outer Dimensions (Top Opening & Bottom Base)
  const topY = 110;
  const topRx = 116;
  const topRy = topRx * ratio; // ~79
  
  const botY = 220;
  const botRx = 76;
  const botRy = botRx * ratio; // ~52

  // Inner Cavity Dimensions
  const inTopRx = 100;
  const inTopRy = inTopRx * ratio; // ~68
  
  const inBotRx = 68;
  const inBotRy = inBotRx * ratio; // ~46
  const inBotY = 210;

  // Saucer Dimensions
  const saucerY = 230;
  const saucerRx = 155;
  const saucerRy = saucerRx * ratio; // ~105

  // Liquid bounds mapping
  const emptyY = inBotY;
  const fullY = 130;  
  const emptyRx = inBotRx;
  const fullRx = 95;
  const emptyRy = emptyRx * ratio;
  const fullRy = fullRx * ratio;
  
  // Current Liquid Level
  const liqY = emptyY - (emptyY - fullY) * p;
  const liqRx = emptyRx + (fullRx - emptyRx) * p;
  const liqRy = emptyRy + (fullRy - emptyRy) * p;

  // 倒计时：每口猛降一截，1.5s 缓动平滑。
  // 正计时：液面平时不动、喝一口时离散下降一截，用 0.6s 短动画演出「咕咚」。
  const liquidTransition = liveRings ? 'all 0.6s cubic-bezier(0.33,0,0.2,1)' : 'all 1.5s ease-in-out';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="-20 10 380 350" className="drop-shadow-2xl font-sans" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="frontWall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbf9f6" />
            <stop offset="25%" stopColor="#f4eee1" />
            <stop offset="75%" stopColor="#e4d8c2" />
            <stop offset="100%" stopColor="#c8bfa8" />
          </linearGradient>
          <linearGradient id="frontShadowBlend" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
          <linearGradient id="innerShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
            <stop offset="40%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
          <linearGradient id="surfaceHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>
          <linearGradient id="rimHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgba(200,190,180,0.1)" />
          </linearGradient>
          <filter id="blurRing">
            <feGaussianBlur stdDeviation="1.0" />
          </filter>
          {/* 渍痕：用湍流位移让环线轻微抖动（摆脱「打印感」），再略微模糊 */}
          <filter id="ringStain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.07" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="warp" />
            <feGaussianBlur in="warp" stdDeviation="0.55" />
          </filter>
        </defs>

        <style>
          {`
            @keyframes sugarDrop {
              0%   { transform: translateY(-40px) rotate(0deg); opacity: 0;   }
              10%  { transform: translateY(0px) rotate(15deg); opacity: 1;  }
              48%  { transform: translateY(calc(var(--dropY) - 5px)) rotate(100deg); opacity: 1;  } 
              50%  { transform: translateY(var(--dropY)) rotate(135deg) scale(0.3); opacity: 0; }
              100% { transform: translateY(var(--dropY)) rotate(135deg) scale(0); opacity: 0; }
            }
            @keyframes pourStream {
              0%   { stroke-dashoffset: var(--dist); }
              15%  { stroke-dashoffset: 0; }
              85%  { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: calc(-1 * var(--dist)); }
            }
            @keyframes fadeOutSplash {
              0%   { opacity: 0; }
              10%  { opacity: 0; }
              15%  { opacity: 1; }
              85%  { opacity: 1; }
              90%  { opacity: 0; }
              100% { opacity: 0; }
            }
            @keyframes rippleIterate {
              0%   { rx: 5px; ry: 3px; opacity: 0.8; stroke-width: 3px; }
              100% { rx: 35px; ry: 25px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes splashAnim {
              0%   { rx: 0; ry: 0; opacity: 0; stroke-width: 3px; }
              45%  { rx: 0; ry: 0; opacity: 0; }
              50%  { rx: 15px; ry: 10px; opacity: 0.8; stroke-width: 2px; }
              85%  { rx: 45px; ry: 30px; opacity: 0; stroke-width: 0.5px; }
              100% { rx: 45px; ry: 30px; opacity: 0; stroke-width: 0.5px; }
            }
          `}
        </style>

        {/* Saucer */}
        <ellipse cx="150" cy={saucerY} rx={saucerRx} ry={saucerRy} fill="#e8dfce" />
        <ellipse cx="150" cy={saucerY} rx={saucerRx - 35} ry={(saucerRx - 35) * ratio} fill="transparent" stroke="#d4c9b3" strokeWidth="2" opacity="0.5" />
        <ellipse cx="150" cy={saucerY} rx={saucerRx - 75} ry={(saucerRx - 75) * ratio} fill="#d4c9b3" opacity="0.3" />

        {/* Handle */}
        <path 
          d="M 255 140 C 335 130, 315 210, 215 215" 
          fill="none" 
          stroke="#e0d7c3" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        <path 
          d="M 255 140 C 335 130, 315 210, 215 215" 
          fill="none" 
          stroke="rgba(0,0,0,0.08)" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        <path 
          d="M 255 140 C 335 130, 315 210, 215 215"  
          fill="none" 
          stroke="#fdfbf8" 
          strokeWidth="12" 
          strokeLinecap="round" 
        />

        {/* Outer Back Wall (Silhouette Base) */}
        <path id="outer-back-wall" d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 1 ${150 + topRx} ${topY}
          L ${150 + botRx} ${botY}
          A ${botRx} ${botRy} 0 0 1 ${150 - botRx} ${botY} Z
        `} fill="#ebe5da" />

        {/* Top Rim Back Half */}
        <path id="top-rim-back" d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 1 ${150 + topRx} ${topY}
          L ${150 + inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 0 ${150 - inTopRx} ${topY} Z
        `} fill="#fefdfb" />
        <path id="top-rim-back-highlight" d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 1 ${150 + topRx} ${topY}
          L ${150 + inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 0 ${150 - inTopRx} ${topY} Z
        `} fill="url(#rimHighlight)" opacity="0.8" />

        {/* Inner Cavity (Back Wall of the Inside) */}
        <path id="inner-void" d={`
          M ${150 - inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 1 ${150 + inTopRx} ${topY}
          L ${150 + inBotRx} ${inBotY}
          A ${inBotRx} ${inBotRy} 0 0 1 ${150 - inBotRx} ${inBotY} Z
        `} fill="#dcd1c4" />
        <path id="inner-void-shadow" d={`
          M ${150 - inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 1 ${150 + inTopRx} ${topY}
          L ${150 + inBotRx} ${inBotY}
          A ${inBotRx} ${inBotRy} 0 0 1 ${150 - inBotRx} ${inBotY} Z
        `} fill="url(#innerShadow)" />

        <ellipse cx="150" cy={inBotY} rx={inBotRx} ry={inBotRy} fill="#cbbcad" />

        {/* Coffee Rings —— 圈痕 = 一段心流，强度 = 停留时长 */}
        {rings.map((ring, i) => {
          const { level, strength } = ring;
          const s = Math.max(0, Math.min(1, strength));
          // 正计时：圈痕一直画着（由液体盖住、下降时自然揭开）；倒计时：靠阈值逐道显形
          const isVisible = liveRings ? true : p < level - 0.01;
          const rY = emptyY - (emptyY - fullY) * level;
          const rRx = emptyRx + (fullRx - emptyRx) * level;
          const rRy = emptyRy + (fullRy - emptyRy) * level;

          // 停留越久：越不透明、线越粗。用 strength 平方加大深浅对比（浅档更淡）
          const depth = s * s;
          const mainOpacity = isVisible ? 0.05 + 0.75 * depth : 0;
          const mainWidth = 1.0 + 3.2 * s;
          // 下缘沉积：更暗、更细的内圈，叠出「渍」的层次
          const sedimentOpacity = isVisible ? 0.04 + 0.5 * depth : 0;
          const sedimentWidth = Math.max(0.5, mainWidth * 0.45);

          return (
            <g key={i} style={{ transition: 'opacity 1.5s ease-in-out' }}>
              <ellipse
                cx="150"
                cy={rY}
                rx={rRx}
                ry={rRy}
                fill="none"
                stroke={color}
                strokeWidth={mainWidth}
                opacity={mainOpacity}
                filter="url(#ringStain)"
                style={{ transition: 'opacity 1.5s ease-in-out' }}
              />
              <ellipse
                cx="150"
                cy={rY + 0.6}
                rx={Math.max(0, rRx - 1.2)}
                ry={Math.max(0, rRy - 1.2)}
                fill="none"
                stroke={darken(color)}
                strokeWidth={sedimentWidth}
                opacity={sedimentOpacity}
                filter="url(#ringStain)"
                style={{ transition: 'opacity 1.5s ease-in-out' }}
              />
            </g>
          );
        })}

        {/* Liquid Volume */}
        <g>
          {/* Liquid Body filling the cavity up to current level */}
          <path id="liquid-body" d={`
            M ${150 - liqRx} ${liqY} 
            A ${liqRx} ${liqRy} 0 0 1 ${150 + liqRx} ${liqY} 
            L ${150 + inBotRx} ${inBotY} 
            A ${inBotRx} ${inBotRy} 0 0 1 ${150 - inBotRx} ${inBotY} Z
          `} fill={color} opacity="0.95" style={{ transition: liquidTransition }} />
          
          {/* Liquid Surface Level */}
          <ellipse cx="150" cy={liqY} rx={liqRx} ry={liqRy} fill={color} style={{ transition: liquidTransition }} />
          <ellipse cx="150" cy={liqY} rx={liqRx} ry={liqRy} fill="url(#surfaceHighlight)" style={{ transition: liquidTransition }} />
          
          {/* Crema Edge */}
          <ellipse 
            cx="150" cy={liqY} 
            rx={Math.max(0, liqRx - 1.5)} ry={Math.max(0, liqRy - 1.5)} 
            fill="none" stroke="#d5ab85" strokeWidth="1.5" opacity="0.6" 
            style={{ transition: liquidTransition }}
          />
        </g>

        {/* Settings for Animated Drops / Pour */}
        {(() => {
          const sugar1Y = liqY - 10;
          const sugar1Style = { '--dropY': `${sugar1Y}px`, transformOrigin: '143px 18px', animation: 'sugarDrop 1.2s ease-in 0.5s both' } as React.CSSProperties;
          const splashSugar1 = { animation: 'splashAnim 1.2s ease-out 0.5s both' } as React.CSSProperties;

          const sugar2Y = liqY - (-5);
          const sugar2Style = { '--dropY': `${sugar2Y}px`, transformOrigin: '163px 3px', animation: 'sugarDrop 1.2s ease-in 0.9s both' } as React.CSSProperties;
          const splashSugar2 = { animation: 'splashAnim 1.2s ease-out 0.9s both' } as React.CSSProperties;

          const shotDelay = hasSugar ? '2.5s' : '0.5s';
          const streamDist = liqY - (-10);
          const streamStyle = { 
            '--dist': `${streamDist}px`, 
            strokeDasharray: `${streamDist}px ${streamDist * 2}px`,
            strokeDashoffset: `${streamDist}px`,
            animation: `pourStream 2.5s ease-in-out ${shotDelay} both`
          } as React.CSSProperties;

          return (
            <g>
              {hasSugar && (
                <>
                  <rect x="135" y="10" width="16" height="16" rx="2" ry="2" fill="#fefdfb" stroke="#e0d7c3" strokeWidth="1" style={sugar1Style} />
                  <ellipse cx="143" cy={liqY} rx="0" ry="0" fill="none" stroke="#fefdfb" style={splashSugar1} />

                  <rect x="155" y="-5" width="16" height="16" rx="2" ry="2" fill="#fefdfb" stroke="#e0d7c3" strokeWidth="1" style={sugar2Style} />
                  <ellipse cx="163" cy={liqY} rx="0" ry="0" fill="none" stroke="#fefdfb" style={splashSugar2} />
                </>
              )}
              {hasExtraShot && (
                <>
                  <line x1="150" y1="-10" x2="150" y2={liqY} 
                    stroke="#1a0f0a" strokeWidth="6" strokeLinecap="round" 
                    style={streamStyle} 
                  />
                  <g style={{ animation: `fadeOutSplash 2.5s linear ${shotDelay} both` }}>
                    <ellipse cx="150" cy={liqY} fill="none" stroke="#1a0f0a" style={{ animation: 'rippleIterate 0.6s linear infinite' }} />
                    <ellipse cx="150" cy={liqY} fill="none" stroke="#1a0f0a" style={{ animation: 'rippleIterate 0.6s linear 0.2s infinite' }} />
                    <ellipse cx="150" cy={liqY} fill="none" stroke="#1a0f0a" style={{ animation: 'rippleIterate 0.6s linear 0.4s infinite' }} />
                  </g>
                </>
              )}
            </g>
          );
        })()}

        {/* Outer Front Wall Envelope (Opaquely covers liquid front) */}
        <path id="outer-front-wall" d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 0 ${150 + topRx} ${topY}
          L ${150 + botRx} ${botY}
          A ${botRx} ${botRy} 0 0 1 ${150 - botRx} ${botY} Z
        `} fill="url(#frontWall)" />
        
        <path id="outer-front-shadow" d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 0 ${150 + topRx} ${topY}
          L ${150 + botRx} ${botY}
          A ${botRx} ${botRy} 0 0 1 ${150 - botRx} ${botY} Z
        `} fill="url(#frontShadowBlend)" style={{ mixBlendMode: 'multiply' }} />

        {/* Top Rim Front Half Doughnut */}
        <path d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 0 ${150 + topRx} ${topY}
          L ${150 + inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 1 ${150 - inTopRx} ${topY} Z
        `} fill="#fefdfb" fillRule="evenodd" />
        
        <path d={`
          M ${150 - topRx} ${topY}
          A ${topRx} ${topRy} 0 0 0 ${150 + topRx} ${topY}
          L ${150 + inTopRx} ${topY}
          A ${inTopRx} ${inTopRy} 0 0 1 ${150 - inTopRx} ${topY} Z
        `} fill="url(#rimHighlight)" opacity="0.8" fillRule="evenodd" />
      </svg>
    </div>
  );
}

