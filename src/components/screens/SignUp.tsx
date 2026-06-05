import { useEffect, useRef, useState } from 'react';
import type { ScreenId, Role } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';
import { supabase } from '../../lib/supabase';

interface Props {
  isActive: boolean;
  role: Role;
  onNavigate: (s: ScreenId) => void;
  onRoleChange: (r: Role) => void;
  onPendingEmail: (email: string) => void;
}

function BrandWave() {
  const pathRef = useRef<SVGPathElement>(null);
  const ghostRef = useRef<SVGPathElement>(null);
  const animRef = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    function draw() {
      t.current += 0.018;
      const W = 480, H = 120, pts = 60;
      let d = '', gd = '';
      for (let i = 0; i <= pts; i++) {
        const x = (i / pts) * W;
        const y = H / 2 + Math.sin(i / pts * Math.PI * 3 + t.current) * 22 + Math.sin(i / pts * Math.PI * 5 + t.current * 1.3) * 8;
        const gy = H / 2 + Math.sin(i / pts * Math.PI * 3 + t.current + 1.2) * 18 + Math.sin(i / pts * Math.PI * 4 + t.current * 0.8) * 10;
        d += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
        gd += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${gy.toFixed(1)}`;
      }
      pathRef.current?.setAttribute('d', d);
      ghostRef.current?.setAttribute('d', gd);
      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <svg className="bwave" viewBox="0 0 480 120" preserveAspectRatio="none">
      <path ref={pathRef} fill="none" stroke="#d9a066" strokeWidth="1.4" opacity="0.85" />
      <path ref={ghostRef} fill="none" stroke="#7fd1d6" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function SignUp({ isActive, role, onNavigate, onRoleChange, onPendingEmail }: Props) {
  const [selRole, setSelRole] = useState<Role>(role);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleRole = (r: Role) => {
    setSelRole(r);
    onRoleChange(r);
  };

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, role: selRole },
      },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onPendingEmail(email);
    onNavigate('verify');
  };

  return (
    <section
      className={`screen${isActive ? ' active' : ''}`}
      data-screen="signup"
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
              <div className="eyebrow">NMR in the Earth's field</div>
              <h2>Record a real <em>free-induction decay</em> by Friday.</h2>
              <p>Create an account to book the shared NMR spectrometer, follow guided pulse-sequence labs, and watch protons precess — no superconducting magnet required.</p>
              <BrandWave />
              <div className="bstats">
                <div className="bstat"><div className="n">2083<span style={{ fontSize: 14, color: 'var(--dim)' }}> Hz</span></div><div className="l">Larmor frequency</div></div>
                <div className="bstat"><div className="n">10.5<span style={{ fontSize: 14, color: 'var(--dim)' }}> mT</span></div><div className="l">Polarization field</div></div>
                <div className="bstat"><div className="n">H₂O</div><div className="l">Water sample</div></div>
              </div>
              <div className="seed-chip"><span className="sc-dot" />Built on the <b>Katmai 01</b> — real NMR in a handheld instrument</div>
            </div>
          </div>

          <div className="formside">
            <div className="formwrap">
              <div className="fh">
                <h1 className="title">Create your account</h1>
                <p>Practice on the FID simulator instantly. Book the spectrometer once you're verified.</p>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button className="btn btn-ghost btn-block" onClick={() => onNavigate('verify')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16M4 6l8 7 8-7M4 6v12h16V6" /></svg>
                Continue with University SSO
              </button>
              <div className="divline">or with email</div>

              <div className="row2">
                <div className="field"><label>First name</label><input className="input" placeholder="Ada" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div className="field"><label>Last name</label><input className="input" placeholder="Lovelace" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div className="field"><label>Email</label><input className="input" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="field"><label>Password</label><input className="input" type="password" placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>

              <div className="field">
                <label>I am a…</label>
                <div className="opts">
                  {([
                    ['student', 'Student', 'Enrolled in a course — join with a class code.'],
                    ['researcher', 'Researcher', 'Independent access — book the spectrometer and write your own pulse sequences.'],
                    ['educator', 'Educator', 'Set up classes, manage seats, and assign pulse-sequence experiments.'],
                  ] as [Role, string, string][]).map(([r, label, desc]) => (
                    <div key={r} className={`opt${selRole === r ? ' sel' : ''}`} onClick={() => handleRole(r)}>
                      <div className="rk" />
                      <div><div className="ot">{label}</div><div className="od">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-block mt8" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating account…' : <span>Create account <span className="arr">→</span></span>}
              </button>
              <div className="foot-note">
                Already have an account?{' '}
                <span className="linklike" onClick={() => onNavigate('signin')}>Sign in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
