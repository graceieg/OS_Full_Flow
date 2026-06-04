import { useCallback, useRef, useState } from 'react';

export interface NMRParams {
  pulse_frequency_hz:  number;
  pulse_duration_us:   number;
  echo_spacing_ms:     number;
  polarization_time_s: number;
  n_shots:             number;
}

export interface NMRProgress {
  shot:    number;
  total:   number;
  status:  'arming' | 'running' | 'complete' | 'error';
  message: string;
}

export interface NMRResult {
  fid:        number[];
  t2_ms:      number;
  snr:        number;
  larmor_hz:  number;
  echo_count: number;
}

const WS_URL = import.meta.env.VITE_BACKEND_WS_URL ?? 'ws://localhost:8000/ws/experiment';

export function useNMRExperiment() {
  const wsRef = useRef<WebSocket | null>(null);
  const [progress, setProgress] = useState<NMRProgress | null>(null);
  const [result,   setResult]   = useState<NMRResult   | null>(null);
  const [error,    setError]    = useState<string      | null>(null);

  const run = useCallback((params: NMRParams) => {
    // Close any existing connection
    wsRef.current?.close();
    setProgress(null);
    setResult(null);
    setError(null);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'run', params }));
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'progress') {
        setProgress({ shot: msg.shot, total: msg.total, status: msg.status, message: msg.message });
      } else if (msg.type === 'result') {
        setResult({
          fid:       msg.fid,
          t2_ms:     msg.t2_ms,
          snr:       msg.snr,
          larmor_hz: msg.larmor_hz,
          echo_count: msg.echo_count,
        });
        setProgress(prev => prev ? { ...prev, status: 'complete' } : null);
      } else if (msg.type === 'error') {
        setError(msg.message);
      }
    };

    ws.onerror = () => setError('Connection to backend failed. Is the server running?');
  }, []);

  const abort = useCallback(() => {
    wsRef.current?.close();
    setProgress(null);
  }, []);

  return { run, abort, progress, result, error };
}
