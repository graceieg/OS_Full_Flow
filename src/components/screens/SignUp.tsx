import { useEffect, useRef, useState } from 'react';
import type { ScreenId, Role } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  role: Role;
  onNavigate: (s: ScreenId) => void;
  onRoleChange: (r: Role) => void;
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

export function SignUp({ isActive, role, onNavigate, onRoleChange }: Props) {
  const [selRole, setSelRole] = useState<Role>(role);

  const handleRole = (r: Role) => {
    setSelRole(r);
    onRoleChange(r);
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
              <div className="eyebrow">Quantum you can hold</div>
              <h2>Run a real <em>quantum experiment</em> by Friday.</h2>
              <p>Create an account to reserve a quantum device, follow guided courses, and fire your first pulse sequence — no cleanroom required.</p>
              <BrandWave />
              <div className="bstats">
                <div className="bstat"><div className="n">42.577<span style={{ fontSize: 14, color: 'var(--dim)' }}> MHz</span></div><div className="l">Drive lock</div></div>
                <div className="bstat"><div className="n">12.4<span style={{ fontSize: 14, color: 'var(--dim)' }}> mK</span></div><div className="l">Fridge base</div></div>
                <div className="bstat"><div className="n">6<span style={{ fontSize: 14, color: 'var(--dim)' }}> units</span></div><div className="l">Lab fleet</div></div>
              </div>
              <div className="seed-chip"><span className="sc-dot" />Qubit lineage — <b>controlled nuclear spin</b>, after Earth's-field NMR</div>
            </div>
          </div>

          <div className="formside">
            <div className="formwrap">
              <div className="fh">
                <h1 className="title">Create your account</h1>
                <p>Start with a simulator instantly. Book hardware once you're verified.</p>
              </div>

              <button className="btn btn-ghost btn-block" onClick={() => onNavigate('verify')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 6h16M4 6l8 7 8-7M4 6v12h16V6" /></svg>
                Continue with University SSO
              </button>
              <div className="divline">or with email</div>

              <div className="row2">
                <div className="field"><label>First name</label><input className="input" placeholder="Ada" /></div>
                <div className="field"><label>Last name</label><input className="input" placeholder="Lovelace" /></div>
              </div>
              <div className="field"><label>Email</label><input className="input" type="email" placeholder="you@university.edu" /></div>
              <div className="field"><label>Password</label><input className="input" type="password" placeholder="••••••••••" /></div>

              <div className="field">
                <label>I am a…</label>
                <div className="opts">
                  {([
                    ['student', 'Student', 'Enrolled in a course — join with a class code.'],
                    ['researcher', 'Researcher', 'Independent access to book devices and write recipes.'],
                    ['educator', 'Educator', 'Set up classes, manage seats, and assign experiments.'],
                  ] as [Role, string, string][]).map(([r, label, desc]) => (
                    <div key={r} className={`opt${selRole === r ? ' sel' : ''}`} onClick={() => handleRole(r)}>
                      <div className="rk" />
                      <div><div className="ot">{label}</div><div className="od">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-block mt8" onClick={() => onNavigate('verify')}>
                Create account <span className="arr">→</span>
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
