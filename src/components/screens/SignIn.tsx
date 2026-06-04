import { useState } from 'react';
import type { ScreenId } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  onNavigate: (s: ScreenId) => void;
}

export function SignIn({ isActive, onNavigate }: Props) {
  const [remember, setRemember] = useState(true);

  return (
    <section
      className={`screen${isActive ? ' active' : ''}`}
      data-screen="signin"
      data-temp="warm"
      data-phase="auth"
      data-knob="8"
    >
      <div className="canvas">
        <div className="auth">
          <div className="brandside">
            <div className="bmark">
              <KatmaiLogo size={22} />
              Katmai Computing
            </div>
            <div className="bhero">
              <div className="eyebrow">Welcome back</div>
              <h2>Your <em>quantum device</em> session is waiting.</h2>
              <p>Pick up where you left off — last run: spin-echo · π/2 — τ — π, T₂* = 11.8 μs.</p>
              <div className="bstats mt32">
                <div className="bstat"><div className="n">3</div><div className="l">Saved recipes</div></div>
                <div className="bstat"><div className="n">14:00</div><div className="l">Next booking</div></div>
              </div>
            </div>
          </div>

          <div className="formside">
            <div className="formwrap">
              <div className="fh">
                <h1 className="title">Sign in</h1>
                <p>Returning users go straight to the workspace.</p>
              </div>
              <button className="btn btn-ghost btn-block" onClick={() => onNavigate('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16M4 6l8 7 8-7M4 6v12h16V6" /></svg>
                Continue with University SSO
              </button>
              <div className="divline">or with email</div>
              <div className="field"><label>Email</label><input className="input" type="email" defaultValue="ada@harvard.edu" /></div>
              <div className="field"><label>Password</label><input className="input" type="password" defaultValue="••••••••••" /></div>
              <div className="spread mt8" style={{ marginBottom: 18 }}>
                <div className={`checkrow${remember ? ' on' : ''}`} onClick={() => setRemember(!remember)}>
                  <span className="cb">{remember ? '✓' : ''}</span>
                  Remember this device
                </div>
                <span className="linklike" style={{ fontSize: 13 }}>Forgot password?</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => onNavigate('dashboard')}>
                Sign in <span className="arr">→</span>
              </button>
              <div className="foot-note">
                New to Katmai?{' '}
                <span className="linklike" onClick={() => onNavigate('signup')}>Create an account</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
