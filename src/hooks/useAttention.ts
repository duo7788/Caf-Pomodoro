import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type AttnState = 'IDLE' | 'AWAY' | 'FOCUS' | 'DISTRACTED';

export interface AttentionConfig {
  /** pitch（度）。pitch <= 该阈值 视为「低头」=> 专注。现场用滑块调。 */
  pitchDownThreshold: number;
  /** T1：抬头看屏持续多久才判为「分心/啜饮」(ms) */
  enterDistractMs: number;
  /** T2：低头/脸消失持续多久才判为「重新专注」(ms) */
  returnFocusMs: number;
  /** 脸消失超过多久判为「离开」(ms) */
  awayMs: number;
  /** 检测帧率（越低越省电） */
  fps: number;
  /** true：低头时 pitch 变小(更负)；false：低头时 pitch 变大(更正)。现场标定用。 */
  lookDownIsNegative: boolean;
  /** 用哪个信号判「低头/专注」：合成(gaze+pitch) / 视线方向 / 眼睛高度 / 头部俯仰 */
  signal: 'combined' | 'gaze' | 'eyeY' | 'pitch';
  /** eyeY 信号阈值(0~1, 0=顶 1=底)。eyeY ≥ 该值 视为低头(眼睛掉到画面下方) */
  eyeYThreshold: number;
  /** gaze 信号阈值（探针用，对称）。视线向下量 ≥ 该值 视为看桌面(专注) */
  gazeDownThreshold: number;
  /** 非对称迟滞·回到专注：gaze ≥ 该值 即判专注（易，便于误判后快速弹回） */
  gazeReturnFocus: number;
  /** 非对称迟滞·进入分心：gaze ≤ 该值 才判看屏分心（难，防误判） */
  gazeEnterDistract: number;
}

export interface AttentionReading {
  state: AttnState;
  faceDetected: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  eyeOpenness: number;
  /** 眼睛中心在画面里的归一化纵坐标 0~1（0=顶，1=底） */
  eyeY: number;
  /** 视线向下量（>0 朝下看桌面，<0 朝上看）。与相机机位无关 */
  gazeDown: number;
  /** 合成俯视量 = gazeDown + 0.03*pitch（转眼或转头看下方都计入） */
  worldDown: number;
  fps: number;
  /** 去抖前的瞬时信号 */
  raw: 'down' | 'up' | 'none';
  /** 当前 desired 已稳定的时长(ms)，便于观察去抖 */
  dwellMs: number;
}

// 2026-05-31 在真实低机位/仰拍环境下标定通过的默认值：
// 只有 gaze（视线方向）信号稳定可分，pitch / eyeY 受机位影响均不可靠。
export const DEFAULT_CONFIG: AttentionConfig = {
  pitchDownThreshold: -8,
  enterDistractMs: 2000, // 进入分心：需目光持续离开工作 2s（兼顾抬头思考宽容度与响应）
  returnFocusMs: 500, // 回到专注：易（误判后约 0.5s 弹回）
  awayMs: 20000,
  fps: 10,
  lookDownIsNegative: true,
  signal: 'combined', // 合成 gaze+pitch；阈值由进场校准覆盖（下为未校准时的兜底）
  eyeYThreshold: 0.6,
  gazeDownThreshold: 0.44,
  gazeReturnFocus: 0.27,
  gazeEnterDistract: 0.2,
};

// 左右眼若干眼睑/眼角关键点的索引，用来取「眼睛中心」的归一化纵坐标。
const EYE_IDX = [33, 133, 159, 145, 263, 362, 386, 374];

// 合成俯视里 pitch（度）的权重：1 度 ≈ 0.03 视线量。
const PITCH_WEIGHT = 0.03;

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// 从 MediaPipe 的 4x4 列主序变换矩阵里抽 Tait-Bryan 欧拉角（度）。
// 符号/零点会因坐标系而异 —— 没关系，UI 实时显示数值 + 阈值滑块，现场标定即可。
function eulerFromMatrix(m: Float32Array) {
  // R[i][j] = m[j*4 + i]
  const r00 = m[0],
    r10 = m[1],
    r20 = m[2];
  const r21 = m[6],
    r22 = m[10];
  const pitch = Math.atan2(r21, r22);
  const yaw = Math.atan2(-r20, Math.hypot(r21, r22));
  const roll = Math.atan2(r10, r00);
  const deg = (x: number) => (x * 180) / Math.PI;
  return { pitch: deg(pitch), yaw: deg(yaw), roll: deg(roll) };
}

export function useAttention(initial: AttentionConfig = DEFAULT_CONFIG) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const cfgRef = useRef<AttentionConfig>(initial);
  const [config, setConfigState] = useState<AttentionConfig>(initial);
  const setConfig = useCallback((patch: Partial<AttentionConfig>) => {
    cfgRef.current = { ...cfgRef.current, ...patch };
    setConfigState(cfgRef.current);
  }, []);

  const [status, setStatus] = useState<'idle' | 'camera' | 'loading' | 'running' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<AttentionReading>({
    state: 'IDLE',
    faceDetected: false,
    pitch: 0,
    yaw: 0,
    roll: 0,
    eyeOpenness: 1,
    eyeY: 0,
    gazeDown: 0,
    worldDown: 0,
    fps: 0,
    raw: 'none',
    dwellMs: 0,
  });

  // 状态机内部计时
  const lastTickRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const fpsRef = useRef(0);
  const stateRef = useRef<AttnState>('IDLE');
  const lastFaceRef = useRef(0);
  const desiredRef = useRef<AttnState>('IDLE');
  const desiredSinceRef = useRef(0);
  const downHoldRef = useRef(true); // 迟滞：缓冲带内保持的上一次「低头/专注」判断

  const detect = useCallback((now: number) => {
    const v = videoRef.current;
    const lm = landmarkerRef.current;
    if (!v || !lm || v.readyState < 2) return;
    if (v.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = v.currentTime;

    const res = lm.detectForVideo(v, now);
    const faceDetected = !!res.faceLandmarks && res.faceLandmarks.length > 0;

    let pitch = 0,
      yaw = 0,
      roll = 0;
    const matrix = res.facialTransformationMatrixes?.[0]?.data;
    if (matrix) ({ pitch, yaw, roll } = eulerFromMatrix(matrix));

    let eyeOpenness = 1;
    let gazeDown = 0;
    const cats = res.faceBlendshapes?.[0]?.categories;
    if (cats) {
      const bs = (name: string) => cats.find((c) => c.categoryName === name)?.score ?? 0;
      eyeOpenness = 1 - Math.max(bs('eyeBlinkLeft'), bs('eyeBlinkRight'));
      const lookDown = (bs('eyeLookDownLeft') + bs('eyeLookDownRight')) / 2;
      const lookUp = (bs('eyeLookUpLeft') + bs('eyeLookUpRight')) / 2;
      gazeDown = lookDown - lookUp; // >0 朝下看
    }

    let eyeY = 0;
    const lms = res.faceLandmarks?.[0];
    if (lms) {
      let sum = 0;
      for (const i of EYE_IDX) sum += lms[i]?.y ?? 0;
      eyeY = sum / EYE_IDX.length;
    }

    // 合成俯视 = 眼球相对头的俯角 + 头本身的俯角。转眼或转头看下方都能抓到。
    const worldDown = gazeDown + PITCH_WEIGHT * pitch;

    const cfg = cfgRef.current;
    if (faceDetected) lastFaceRef.current = now;
    const sinceFace = now - lastFaceRef.current;

    // 判「低头/专注(down)」。gaze/combined 用非对称迟滞（难进分心、易回专注）；其余对称迟滞。
    let down: boolean;
    if (cfg.signal === 'gaze' || cfg.signal === 'combined') {
      const metric = cfg.signal === 'combined' ? worldDown : gazeDown;
      if (metric >= cfg.gazeReturnFocus) down = true; // 易回专注
      else if (metric <= cfg.gazeEnterDistract) down = false; // 难进分心
      else down = downHoldRef.current; // 死区：维持
    } else {
      let m: number, t: number, margin: number;
      if (cfg.signal === 'eyeY') {
        m = eyeY;
        t = cfg.eyeYThreshold;
        margin = 0.05;
      } else if (cfg.lookDownIsNegative) {
        m = -pitch;
        t = -cfg.pitchDownThreshold;
        margin = 4;
      } else {
        m = pitch;
        t = cfg.pitchDownThreshold;
        margin = 4;
      }
      if (m >= t + margin) down = true;
      else if (m <= t - margin) down = false;
      else down = downHoldRef.current;
    }
    downHoldRef.current = down;
    const raw: AttentionReading['raw'] = !faceDetected ? 'none' : down ? 'down' : 'up';

    // 瞬时期望状态
    let desired: AttnState;
    if (sinceFace > cfg.awayMs) desired = 'AWAY';
    else if (faceDetected && raw === 'up') desired = 'DISTRACTED';
    else desired = 'FOCUS'; // 低头 / 脸暂时消失(还没到 away) 都按专注

    if (desired !== desiredRef.current) {
      desiredRef.current = desired;
      desiredSinceRef.current = now;
    }
    const dwell = now - desiredSinceRef.current;

    if (desired !== stateRef.current) {
      const need =
        desired === 'DISTRACTED'
          ? cfg.enterDistractMs
          : desired === 'FOCUS'
          ? cfg.returnFocusMs
          : 0; // AWAY / IDLE 立即生效
      if (dwell >= need) stateRef.current = desired;
    }

    // fps EMA
    const dt = now - lastTickRef.current;
    if (dt > 0) fpsRef.current = fpsRef.current * 0.8 + (1000 / dt) * 0.2;
    lastTickRef.current = now;

    setReading({
      state: stateRef.current,
      faceDetected,
      pitch,
      yaw,
      roll,
      eyeOpenness,
      eyeY,
      gazeDown,
      worldDown,
      fps: fpsRef.current,
      raw,
      dwellMs: dwell,
    });
  }, []);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const now = performance.now();
    const interval = 1000 / cfgRef.current.fps;
    if (now - lastTickRef.current >= interval) detect(now);
    rafRef.current = requestAnimationFrame(loop);
  }, [detect]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    stateRef.current = 'IDLE';
    desiredRef.current = 'IDLE';
    setStatus('idle');
    setReading((r) => ({ ...r, state: 'IDLE', faceDetected: false, raw: 'none' }));
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setError(null);
    // 1) 先请求摄像头 —— 立刻弹授权框，与模型下载解耦，方便排错。
    setStatus('camera');
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('此浏览器不支持 getUserMedia（请用 Chrome，且地址须是 http://localhost:3000/probe.html）');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
    } catch (e: any) {
      setError(`摄像头未启动：${e?.name ?? ''} ${e?.message ?? e}`);
      setStatus('error');
      return;
    }
    // 2) 摄像头拿到后，再加载模型。
    setStatus('loading');
    try {
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();

      if (!landmarkerRef.current) {
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
      }

      const now = performance.now();
      lastTickRef.current = now;
      lastFaceRef.current = now;
      desiredSinceRef.current = now;
      runningRef.current = true;
      setStatus('running');
      loop();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStatus('error');
      stop();
    }
  }, [loop, stop]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, status, error, reading, config, setConfig, start, stop };
}
