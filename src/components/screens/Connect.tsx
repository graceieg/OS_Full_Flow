import { useState, useEffect, useCallback } from 'react';
import type { ScreenId, RoleProfile } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  profile: RoleProfile;
  onNavigate: (s: ScreenId) => void;
}

type HsState = 'idle' | 'active' | 'done';

const HS_STEPS = [
  { label: 'Claim device lease', value: 'ok', finalValue: '✓ claimed' },
  { label: 'Authenticate session token', value: 'ok', finalValue: '✓ 0xA4F2' },
  { label: 'Sync drive lock 42.577 MHz', value: 'ok', finalValue: '✓ locked' },
  { label: 'Confirm fridge base 12.4 mK', value: 'ok', finalValue: '✓ 12.4 mK' },
];

function QrCode() {
  const N = 21;
  const cells: { x: number; y: number }[] = [];

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const finder = (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
      let on: boolean;
      if (finder) {
        const inFinder = (fx: number, fy: number) =>
          (fx < 7 && fy < 7 && (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4))) ||
          (fx >= N - 7 && fy < 7 && ((fx === N - 7 || fx === N - 1 || fy === 0 || fy === 6 || (fx >= N - 5 && fx <= N - 3 && fy >= 2 && fy <= 4)))) ||
          (fx < 7 && fy >= N - 7 && (fx === 0 || fx === 6 || fy === N - 7 || fy === N - 1 || (fx >= 2 && fx <= 4 && fy >= N - 5 && fy <= N - 3)));
        on = inFinder(x, y);
      } else {
        const hash = (x * 31 + y * 17 + x * y * 7) % 100;
        on = hash < 45;
      }
      if (on) cells.push({ x, y });
    }
  }

  const size = 100;
  const cell = size / N;

  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell - 0.3} height={cell - 0.3} fill="#000" />
      ))}
    </svg>
  );
}

export function Connect({ isActive, profile, onNavigate }: Props) {
  const [hsStates, setHsStates] = useState<HsState[]>(['idle', 'idle', 'idle', 'idle']);
  const [termLines, setTermLines] = useState<string[]>(['<span class="pr">grace$</span> awaiting bench check-in…']);
  const [showEnter, setShowEnter] = useState(false);
  const [running, setRunning] = useState(false);

  const addLine = useCallback((line: string) => {
    setTermLines(prev => [...prev, line]);
  }, []);

  const startHandshake = useCallback(() => {
    if (running) return;
    setRunning(true);
    setHsStates(['active', 'idle', 'idle', 'idle']);
    addLine('<span class="pr">grace$</span> connect KAT-0429-A');

    const delays = [0, 600, 1200, 1800];
    const msgs = [
      'claiming device lease…',
      'authenticating session token…',
      'syncing drive lock 42.577 MHz…',
      'confirming fridge base 12.4 mK…',
    ];
    const dones = [
      'lease claimed ✓',
      'token 0xA4F2 ✓',
      'lock acquired 42.577 MHz ✓',
      'fridge confirmed 12.4 mK ✓',
    ];

    delays.forEach((d, i) => {
      setTimeout(() => {
        addLine(msgs[i]);
        setHsStates(prev => prev.map((s, j) => j === i ? 'active' : j < i ? 'done' : s));
        setTimeout(() => {
          addLine(dones[i]);
          setHsStates(prev => prev.map((s, j) => j === i ? 'done' : s));
          if (i === HS_STEPS.length - 1) {
            setTimeout(() => {
              addLine('<span style="color:#e8b478">connection established · ready to operate</span>');
              setShowEnter(true);
            }, 400);
          }
        }, 500);
      }, d);
    });
  }, [running, addLine]);

  useEffect(() => {
    if (!isActive) {
      setHsStates(['idle', 'idle', 'idle', 'idle']);
      setTermLines(['<span class="pr">grace$</span> awaiting bench check-in…']);
      setShowEnter(false);
      setRunning(false);
    }
  }, [isActive]);

  return (
    <section className={`screen${isActive ? ' active' : ''}`} data-screen="connect" data-temp="cold" data-knob="92">
      <div className="canvas">
        <div className="connect">
          <div className="cleft">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
              <KatmaiLogo size={20} />
              CatMayOS
            </div>
            <div className="eyebrow mt32">Bench check-in</div>
            <h1 className="title" style={{ fontSize: 32 }}>Connect to Quantum-04.</h1>
            <p className="lede mt8" style={{ maxWidth: '44ch' }}>Your booking is active. Scan the QR on the bench unit, or enter its serial, to claim the device for your session.</p>

            <div className="booked-card">
              <div className="bcrow"><span className="bck">DEVICE</span><span className="bcv accent">Quantum-04</span></div>
              <div className="bcrow"><span className="bck">BENCH</span><span className="bcv">2 · Room 114</span></div>
              <div className="bcrow"><span className="bck">SLOT</span><span className="bcv">14:00 – 15:00 · 52 min left</span></div>
              <div className="bcrow"><span className="bck">OPERATOR</span><span className="bcv">{profile.operator}</span></div>
            </div>

            <div className="handshake-vis">
              {HS_STEPS.map((s, i) => (
                <div key={i} className={`hs-step${hsStates[i] === 'done' ? ' hs-done' : hsStates[i] === 'active' ? ' hs-active' : ''}`}>
                  <span className="hsm">{hsStates[i] === 'done' ? '✓' : ''}</span>
                  <span className="hsl">{s.label}</span>
                  <span className="hsv">{hsStates[i] === 'done' ? s.finalValue : '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cright">
            <div style={{ maxWidth: 340, margin: '0 auto', width: '100%' }}>
              <div className="qr-box"><QrCode /></div>
              <div className="meta" style={{ textAlign: 'center' }}>Point the bench camera here, or enter serial</div>
              <div className="serial-entry">
                <input className="input mono" defaultValue="KAT-0429-A" />
                <button className="btn btn-primary" onClick={startHandshake} disabled={running}>Connect</button>
              </div>
              <div className="term">
                {termLines.map((line, i) => (
                  <span key={i} className="ln" dangerouslySetInnerHTML={{ __html: line }} />
                ))}
                {!showEnter && <span className="ln"><span className="caret" /></span>}
              </div>
              {showEnter && (
                <button className="btn btn-primary btn-block mt16" onClick={() => onNavigate('operate')}>
                  Enter operate view <span className="arr">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
