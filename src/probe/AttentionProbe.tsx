import { useEffect, useRef, useState } from 'react';
import { useAttention, type AttnState } from '../hooks/useAttention';

const STATE_COLOR: Record<AttnState, string> = {
  FOCUS: '#4ade80',
  DISTRACTED: '#f59e0b',
  AWAY: '#9ca3af',
  IDLE: '#374151',
};

const STATE_LABEL: Record<AttnState, string> = {
  FOCUS: '专注中 · 低头干活',
  DISTRACTED: '分心 · 抬头看屏（啜饮）',
  AWAY: '离开',
  IDLE: '未开始',
};

interface Sample {
  state: AttnState;
  t: number;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block mb-4">
      <div className="flex justify-between text-sm text-[#cbb89d] mb-1">
        <span>{label}</span>
        <span className="font-mono text-[#f8f5f0]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#d8c3a5]"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-mono text-sm py-1 border-b border-white/5">
      <span className="text-[#a89b8d]">{label}</span>
      <span className="text-[#f8f5f0]">{value}</span>
    </div>
  );
}

export function AttentionProbe() {
  const { videoRef, status, error, reading, config, setConfig, start, stop } = useAttention();
  const [history, setHistory] = useState<Sample[]>([]);
  const histRef = useRef<Sample[]>([]);

  useEffect(() => {
    if (status !== 'running') return;
    histRef.current = [...histRef.current, { state: reading.state, t: Date.now() }].slice(-180);
    setHistory(histRef.current);
  }, [reading.state, reading.pitch, status]);

  const running = status === 'running';

  return (
    <div
      className="min-h-screen text-[#f8f5f0] font-sans p-6 md:p-10"
      style={{ background: 'radial-gradient(circle at 30% 20%, #3c3029 0%, #1a1412 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl tracking-wide mb-2">注意力探针</h1>
          <p className="text-[#a89b8d] text-sm leading-relaxed max-w-2xl">
            验证「低头干活 = 专注 / 抬头看屏 = 啜饮」这套判定在你真实环境下成不成立。
            画面与推理 <b className="text-[#d8c3a5]">全部在本机浏览器内完成，不录制、不上传</b>。
          </p>
        </header>

        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          {/* 左：状态 + 摄像头 + 时间线 */}
          <div>
            {/* 大状态牌 */}
            <div
              className="rounded-2xl p-8 mb-6 flex items-center justify-between transition-colors duration-300"
              style={{ background: STATE_COLOR[reading.state] + '22', border: `1px solid ${STATE_COLOR[reading.state]}55` }}
            >
              <div>
                <div className="text-xs uppercase tracking-widest text-[#a89b8d] mb-2">当前判定</div>
                <div className="text-3xl font-serif" style={{ color: STATE_COLOR[reading.state] }}>
                  {STATE_LABEL[reading.state]}
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-full flex-shrink-0"
                style={{ background: STATE_COLOR[reading.state], boxShadow: `0 0 30px ${STATE_COLOR[reading.state]}99` }}
              />
            </div>

            {/* 摄像头预览 */}
            <div className="relative rounded-xl overflow-hidden bg-black/40 aspect-video mb-2">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!running && (
                <div className="absolute inset-0 flex items-center justify-center text-[#a89b8d] text-sm">
                  摄像头未开启
                </div>
              )}
              {running && (
                <div className="absolute top-3 left-3 flex items-center gap-2 text-xs bg-black/50 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 摄像头使用中（本地）
                </div>
              )}
            </div>

            {/* 状态时间线 */}
            <div className="mb-6">
              <div className="text-xs text-[#a89b8d] mb-1">状态时间线（最近一段，每格约 {(1 / config.fps).toFixed(1)}s）</div>
              <div className="flex h-8 rounded overflow-hidden bg-black/30">
                {history.map((s, i) => (
                  <div key={i} className="flex-1 min-w-[1px]" style={{ background: STATE_COLOR[s.state] }} title={s.state} />
                ))}
              </div>
            </div>

            {/* 控制 */}
            <div className="flex gap-3">
              {!running ? (
                <button
                  onClick={start}
                  disabled={status === 'loading' || status === 'camera'}
                  className="px-6 py-3 rounded-lg bg-[#d8c3a5] text-[#2c2420] font-serif hover:bg-white transition disabled:opacity-50"
                >
                  {status === 'camera' ? '请在弹窗中允许摄像头…' : status === 'loading' ? '加载模型中…' : '开启摄像头'}
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition"
                >
                  停止
                </button>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400">
                出错：{error}
                <br />
                <span className="text-[#a89b8d]">
                  常见原因：未授权摄像头、无网络（首次需下载模型）、或浏览器不支持。
                </span>
              </p>
            )}
          </div>

          {/* 右：实时指标 + 阈值 */}
          <div>
            <div className="rounded-xl bg-black/20 p-5 mb-6">
              <h2 className="text-sm uppercase tracking-widest text-[#8a7964] mb-3">实时指标</h2>
              <Metric label="检测到人脸" value={reading.faceDetected ? '是' : '否'} />
              <Metric label="瞬时信号" value={reading.raw} />
              <Metric label="俯仰 pitch" value={`${reading.pitch.toFixed(1)}°`} />
              <Metric label="偏航 yaw" value={`${reading.yaw.toFixed(1)}°`} />
              <Metric label="翻滚 roll" value={`${reading.roll.toFixed(1)}°`} />
              <Metric label="睁眼程度" value={reading.eyeOpenness.toFixed(2)} />
              <Metric label="视线向下 gaze" value={reading.gazeDown.toFixed(2)} />
              <Metric label="眼睛高度 eyeY" value={reading.eyeY.toFixed(2)} />
              <Metric label="去抖计时" value={`${(reading.dwellMs / 1000).toFixed(1)}s`} />
              <Metric label="帧率" value={`${reading.fps.toFixed(0)} fps`} />
            </div>

            <div className="rounded-xl bg-black/20 p-5">
              <h2 className="text-sm uppercase tracking-widest text-[#8a7964] mb-3">阈值（现场标定）</h2>

              <div className="mb-4">
                <div className="text-sm text-[#cbb89d] mb-1">判定信号</div>
                <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-white/15 text-xs">
                  <button
                    onClick={() => setConfig({ signal: 'gaze' })}
                    className={`py-2 ${config.signal === 'gaze' ? 'bg-[#d8c3a5] text-[#2c2420]' : 'text-[#a89b8d]'}`}
                  >
                    视线方向（推荐）
                  </button>
                  <button
                    onClick={() => setConfig({ signal: 'eyeY' })}
                    className={`py-2 ${config.signal === 'eyeY' ? 'bg-[#d8c3a5] text-[#2c2420]' : 'text-[#a89b8d]'}`}
                  >
                    眼睛高度
                  </button>
                  <button
                    onClick={() => setConfig({ signal: 'pitch' })}
                    className={`py-2 ${config.signal === 'pitch' ? 'bg-[#d8c3a5] text-[#2c2420]' : 'text-[#a89b8d]'}`}
                  >
                    头部俯仰
                  </button>
                </div>
              </div>

              {config.signal === 'gaze' ? (
                <Slider
                  label="低头阈值 视线向下 ≥"
                  value={config.gazeDownThreshold}
                  min={-0.3}
                  max={0.8}
                  step={0.01}
                  unit=""
                  onChange={(v) => setConfig({ gazeDownThreshold: v })}
                />
              ) : config.signal === 'eyeY' ? (
                <Slider
                  label="低头阈值 eyeY ≥"
                  value={config.eyeYThreshold}
                  min={0.2}
                  max={0.95}
                  step={0.01}
                  unit=""
                  onChange={(v) => setConfig({ eyeYThreshold: v })}
                />
              ) : (
                <>
                  <div className="mb-3">
                    <div className="text-sm text-[#cbb89d] mb-1">低头方向</div>
                    <div className="flex rounded-lg overflow-hidden border border-white/15 text-xs">
                      <button
                        onClick={() => setConfig({ lookDownIsNegative: true })}
                        className={`flex-1 py-2 ${config.lookDownIsNegative ? 'bg-[#d8c3a5] text-[#2c2420]' : 'text-[#a89b8d]'}`}
                      >
                        低头 = pitch 更小(负)
                      </button>
                      <button
                        onClick={() => setConfig({ lookDownIsNegative: false })}
                        className={`flex-1 py-2 ${!config.lookDownIsNegative ? 'bg-[#d8c3a5] text-[#2c2420]' : 'text-[#a89b8d]'}`}
                      >
                        低头 = pitch 更大(正)
                      </button>
                    </div>
                  </div>
                  <Slider
                    label={config.lookDownIsNegative ? '低头阈值 pitch ≤' : '低头阈值 pitch ≥'}
                    value={config.pitchDownThreshold}
                    min={-40}
                    max={40}
                    step={1}
                    unit="°"
                    onChange={(v) => setConfig({ pitchDownThreshold: v })}
                  />
                </>
              )}
              <Slider
                label="T1 进入分心"
                value={config.enterDistractMs}
                min={500}
                max={8000}
                step={250}
                unit="ms"
                onChange={(v) => setConfig({ enterDistractMs: v })}
              />
              <Slider
                label="T2 回到专注"
                value={config.returnFocusMs}
                min={500}
                max={8000}
                step={250}
                unit="ms"
                onChange={(v) => setConfig({ returnFocusMs: v })}
              />
              <Slider
                label="离开判定"
                value={config.awayMs}
                min={5000}
                max={180000}
                step={5000}
                unit="ms"
                onChange={(v) => setConfig({ awayMs: v })}
              />
              <Slider
                label="检测帧率"
                value={config.fps}
                min={2}
                max={30}
                step={1}
                unit="fps"
                onChange={(v) => setConfig({ fps: v })}
              />
            </div>
          </div>
        </div>

        {/* 验证清单 */}
        <div className="mt-10 rounded-xl bg-black/20 p-5 text-sm text-[#cbb89d] leading-relaxed">
          <h2 className="text-sm uppercase tracking-widest text-[#8a7964] mb-3">请依次试这三个动作，看判定对不对</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li><b className="text-[#f8f5f0]">抬头盯着屏幕</b> 3 秒以上 → 应变成 <span style={{ color: STATE_COLOR.DISTRACTED }}>分心</span></li>
            <li><b className="text-[#f8f5f0]">低头看桌面/纸笔/第二块屏</b> → 应变回 <span style={{ color: STATE_COLOR.FOCUS }}>专注</span></li>
            <li><b className="text-[#f8f5f0]">整个人离开镜头</b>（超过「离开判定」时长）→ 应变成 <span style={{ color: STATE_COLOR.AWAY }}>离开</span></li>
          </ol>
          <p className="mt-3 text-[#a89b8d]">
            若「低头」判不准，看右侧 pitch 实时值：低头时它会朝某个方向变化，把「低头阈值」拖到那个临界点即可。
            把 pitch 数值告诉我，我据此定最终逻辑。
          </p>
        </div>
      </div>
    </div>
  );
}
