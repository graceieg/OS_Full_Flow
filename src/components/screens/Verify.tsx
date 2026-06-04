import { useEffect, useRef, useState } from 'react';
import type { ScreenId } from '../../types';

interface Props {
  isActive: boolean;
  onNavigate: (s: ScreenId) => void;
}

export function Verify({ isActive, onNavigate }: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(24);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) return;
    setCountdown(24);
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const handleInput = (i: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const full = digits.every(d => d.length === 1);

  return (
    <section
      className={`screen${isActive ? ' active' : ''}`}
      data-screen="verify"
      data-temp="cool1"
      data-phase="auth"
      data-knob="26"
    >
      <div className="canvas">
        <div className="center">
          <div className="cwrap">
            <div className="mini-steps">
              <i className="on" /><i className="on" /><i /><i /><i />
            </div>
            <div className="ci">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </div>
            <h1 className="title">Verify your email</h1>
            <p>We sent a 6-digit code to <b>ada@harvard.edu</b>. Enter it below to confirm your identity.</p>
            <div className="codes">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el; }}
                  maxLength={1}
                  inputMode="numeric"
                  value={d}
                  className={d ? 'filled' : ''}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                />
              ))}
            </div>
            <button className="btn btn-primary btn-block" disabled={!full} onClick={() => onNavigate('onboarding')}>
              Verify &amp; continue <span className="arr">→</span>
            </button>
            <div className="resend mt24">
              Didn't get it?{' '}
              <b onClick={() => countdown === 0 && setCountdown(30)}>
                {countdown > 0 ? `Resend in 0:${String(countdown).padStart(2, '0')}` : 'Resend code'}
              </b>
            </div>
            <div className="foot-note">
              <span className="linklike" onClick={() => onNavigate('signup')}>← Use a different email</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
