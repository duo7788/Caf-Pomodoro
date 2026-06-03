// 背景环境音（Ambience）—— 用 WebAudio 合成柔和的「咖啡馆白噪 / 暖流」声，
// 无需音频文件。开关由 startAmbience / stopAmbience 控制（单例）。
let ambience: { ctx: AudioContext; fadeOutStop: () => void } | null = null;

export function startAmbience() {
  if (ambience) return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    // 2 秒可循环的「布朗噪声」缓冲（比白噪更低沉、更像环境底噪）
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    // 低通滤掉高频「嘶声」，只留温暖的底噪
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620;
    lp.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const now = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.07, now + 1.5); // 缓缓淡入

    // 极慢的呼吸感（音量微微起伏，像人声嘈杂的远景）
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();

    src.connect(lp).connect(gain).connect(ctx.destination);
    src.start();

    ambience = {
      ctx,
      fadeOutStop: () => {
        const t = ctx.currentTime;
        try {
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
          gain.gain.linearRampToValueAtTime(0, t + 0.6);
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          try {
            lfo.stop();
            src.stop();
            ctx.close();
          } catch {
            /* ignore */
          }
        }, 700);
      },
    };
  } catch {
    /* 静默失败 */
  }
}

export function stopAmbience() {
  if (!ambience) return;
  ambience.fadeOutStop();
  ambience = null;
}

// 完成时的轻柔提示音 —— 用 WebAudio 合成，无需音频文件。
export function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // 一个温暖的小三度上行（像瓷杯轻碰）
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.16;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* 用户尚未交互等情况，静默失败即可 */
  }
}
