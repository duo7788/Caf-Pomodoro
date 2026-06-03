import { createRoot } from 'react-dom/client';
import { AttentionProbe } from './probe/AttentionProbe';
import './index.css';

// NOTE: 故意不套 StrictMode —— 避免开发期 effect 双调用导致摄像头初始化两次。
createRoot(document.getElementById('probe-root')!).render(<AttentionProbe />);
