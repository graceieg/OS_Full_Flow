import { useState } from 'react';
import type { ScreenId } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';
import { supabase } from '../../lib/supabase';

interface Props {
  isActive: boolean;
  onNavigate: (s: ScreenId) => void;
  onPendingEmail: (email: string) => void;
}

export function SignIn({ isActive, onNavigate, onPendingEmail }: Props) {
  const [remember, setRemember] = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      // Supabase returns "Email not confirmed" if the user hasn't verified yet
      if (err.message.toLowerCase().includes('not confirmed')) {
        onPendingEmail(email);
        onNavigate('verify');
      } else {
        setError(err.message);
      }
      return;
    }
    onNavigate('dashboard');
  };

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

              {error && <div className="form-error">{error}</div>}

              <button className="btn btn-ghost btn-block" onClick={() => onNavigate('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16M4 6l8 7 8-7M4 6v12h16V6" /></svg>
                Continue with University SSO
              </button>
              <div className="divline">or with email</div>
              <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              <div className="spread mt8" style={{ marginBottom: 18 }}>
                <div className={`checkrow${remember ? ' on' : ''}`} onClick={() => setRemember(!remember)}>
                  <span className="cb">{remember ? '✓' : ''}</span>
                  Remember this device
                </div>
                <span className="linklike" style={{ fontSize: 13 }}>Forgot password?</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Signing in…' : <span>Sign in <span className="arr">→</span></span>}
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
