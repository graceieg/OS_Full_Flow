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
  { label: 'Detect Arduino over USB', finalValue: '✓ /dev/cu.usbserial-1420' },
  { label: 'Sync Larmor frequency 2083 Hz', finalValue: '✓ 2083 Hz' },
  { label: 'Polarization coil check 10.5 mT', finalValue: '✓ 10.5 mT · 13.4 A' },
  { label: 'Ready for handoff', finalValue: '✓ ready' },
];

function ArduinoUSB({ connected }: { connected: boolean }) {
  return (
    <svg viewBox="0 0 220 132" aria-hidden="true">
      <path d="M8 66 H70" stroke="var(--faint)" strokeWidth="3" strokeLinecap="round" />
      <rect x="6" y="60" width="10" height="12" rx="2" fill="var(--faint)" />
      <rect x="68" y="56" width="20" height="20" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
      <rect x="92" y="34" width="118" height="64" rx="4" fill="var(--card)" stroke="var(--border-hi)" strokeWidth="1" />
      <rect x="100" y="52" width="34" height="28" rx="2" fill="none" stroke="var(--dim)" strokeWidth="1" />
      <g fill="var(--faint)">
        <rect x="144" y="40" width="3" height="7" /><rect x="150" y="40" width="3" height="7" />
        <rect x="156" y="40" width="3" height="7" /><rect x="162" y="40" width="3" height="7" />
        <rect x="168" y="40" width="3" height="7" /><rect x="174" y="40" width="3" height="7" />
        <rect x="150" y="85" width="3" height="7" /><rect x="156" y="85" width="3" height="7" />
        <rect x="162" y="85" width="3" height="7" /><rect x="168" y="85" width="3" height="7" />
      </g>
      <circle cx="192" cy="56" r="3.4" fill={connected ? '#52A543' : 'var(--faint)'} />
      <text x="151" y="120" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="var(--faint)" textAnchor="middle">ATmega328 · 16 MHz</text>
    </svg>
  );
}

export function Connect({ isActive, profile, onNavigate }: Props) {
  const [hsStates, setHsStates] = useState<HsState[]>(['idle', 'idle', 'idle', 'idle']);
  const [termLines, setTermLines] = useState<string[]>(['<span class="pr">catmay$</span> awaiting USB connection…']);
  const [showEnter, setShowEnter] = useState(false);
  const [running, setRunning] = useState(false);

  const addLine = useCallback((line: string) => {
    setTermLines(prev => [...prev, line]);
  }, []);

  const startHandshake = useCallback(() => {
    if (running) return;
    setRunning(true);
    setHsStates(['active', 'idle', 'idle', 'idle']);
    addLine('<span class="pr">catmay$</span> connect EFNMR-01');

    const delays = [0, 600, 1200, 1800];
    const msgs = [
      'detecting Arduino over USB…',
      'syncing Larmor frequency 2083 Hz…',
      'checking polarization coil 10.5 mT…',
      'ready for handoff…',
    ];
    const dones = [
      'Arduino detected · /dev/cu.usbserial-1420 ✓',
      'Larmor synced · 2083 Hz ✓',
      'coil ok · 10.5 mT · 13.4 A ✓',
      'ready ✓',
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
      setTermLines(['<span class="pr">catmay$</span> awaiting USB connection…']);
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
            <h1 className="title" style={{ fontSize: 32 }}>Connect to EFNMR-01.</h1>
            <p className="lede mt8" style={{ maxWidth: '46ch' }}>Your booking is active. Plug the spectrometer's Arduino into your laptop over USB to claim the instrument for your session.</p>

            <div className="booked-card">
              <div className="bcrow"><span className="bck">DEVICE</span><span className="bcv accent">EFNMR-01</span></div>
              <div className="bcrow"><span className="bck">CONTROLLER</span><span className="bcv">Arduino Duemilanove</span></div>
              <div className="bcrow"><span className="bck">BENCH</span><span className="bcv">1 · Room 114</span></div>
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
            <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
              <div className="usb-box">
                <ArduinoUSB connected={showEnter} />
              </div>
              <div className="meta" style={{ textAlign: 'center' }}>USB serial · 9600 baud · detected port</div>
              <div className="serial-entry">
                <input className="input mono" defaultValue="/dev/cu.usbserial-1420" readOnly />
                <button className="btn btn-primary" onClick={startHandshake} disabled={running}>Connect over USB</button>
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
