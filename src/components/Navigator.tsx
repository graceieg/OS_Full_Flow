import type { ScreenId, Role, AuthFeel } from '../types';
import { SCREEN_KNOB, HAPPY_PATH } from '../data';
import { KatmaiLogo } from './KatmaiLogo';

interface Props {
  current: ScreenId;
  role: Role;
  authFeel: AuthFeel;
  onNavigate: (s: ScreenId) => void;
  onRoleChange: (r: Role) => void;
  onAuthFeel: (a: AuthFeel) => void;
}

const STEPS: { id: string; label: string; sn?: string; t: string }[] = [
  { id: 'signup', label: 'Sign up', sn: '01', t: 'warm' },
  { id: 'signin', label: 'Sign in ↩', t: 'branch' },
  { id: 'verify', label: 'Verify', sn: '02', t: 'warm' },
  { id: 'onboarding', label: 'Onboarding', sn: '03', t: 'cool1' },
  { id: 'dashboard', label: 'Book device', sn: '04', t: 'cool2' },
  { id: 'connect', label: 'Connect', sn: '05', t: 'cold' },
  { id: 'operate', label: 'Operate →', t: 'cold' },
];

export function Navigator({ current, role, authFeel, onNavigate, onRoleChange, onAuthFeel }: Props) {
  const knob = SCREEN_KNOB[current] ?? 8;
  const curIdx = HAPPY_PATH.indexOf(current);

  return (
    <div className="nav">
      <div className="mark">
        <KatmaiLogo size={20} />
        Katmai
      </div>
      <span className="chip">Onboarding → Operate</span>

      <div className="steps">
        {STEPS.map((s) => {
          const stepIdx = HAPPY_PATH.indexOf(s.id);
          const isOn = s.id === current;
          const isDone = stepIdx > -1 && curIdx > -1 && stepIdx < curIdx;
          return (
            <div
              key={s.id}
              className={`step${isOn ? ' on' : ''}${isDone ? ' done' : ''}`}
              data-t={s.t}
              onClick={() => s.id !== 'operate' && onNavigate(s.id as ScreenId)}
            >
              <span className="tdot" />
              {s.sn && <span className="sn">{s.sn}</span>}
              {s.label}
            </div>
          );
        })}
      </div>

      <div className="right">
        <div className="tweak">
          <span className="tlbl">Account</span>
          <div className="seg">
            {(['student', 'researcher', 'educator'] as Role[]).map((r) => (
              <button key={r} className={role === r ? 'on' : ''} onClick={() => onRoleChange(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="tlbl">Auth feel</span>
          <div className="seg">
            <button className={authFeel === 'warm' ? 'on' : ''} onClick={() => onAuthFeel('warm')}>Warm</button>
            <button className={authFeel === 'technical' ? 'on' : ''} onClick={() => onAuthFeel('technical')}>Technical</button>
          </div>
        </div>
        <div className="temp-meter">
          <span className="lbl">Warm</span>
          <div className="temp-bar">
            <div className="knob" style={{ left: `${knob}%` }} />
          </div>
          <span className="lbl">Cold</span>
        </div>
      </div>
    </div>
  );
}
