import { useState } from 'react';
import type { ScreenId, Role, RoleProfile } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  role: Role;
  profile: RoleProfile;
  onNavigate: (s: ScreenId) => void;
}

type SheetId = 'profile' | 'safety' | 'physics' | 'tour' | null;

interface CheckItem {
  id: string;
  label: string;
  desc: string;
  sheet: SheetId;
  done: boolean;
  cur: boolean;
}

function useChecklist() {
  const [items, setItems] = useState<CheckItem[]>([
    { id: 'verified', label: 'Account verified', desc: 'Identity confirmed via email.', sheet: null, done: true, cur: false },
    { id: 'profile', label: 'Complete your profile', desc: 'Add your institution and class code so bookings route correctly.', sheet: 'profile', done: false, cur: true },
    { id: 'safety', label: 'Read the safety primer', desc: '2-minute read on lock, drive power, and safe-band limits.', sheet: 'safety', done: false, cur: false },
    { id: 'physics', label: 'How your qubit works', desc: 'The spin-physics your qubit is built on — and what each control really does.', sheet: 'physics', done: false, cur: false },
    { id: 'tour', label: 'Take the 2-minute tour', desc: 'See how the coach, safe-bands, and Run & analyse step fit together.', sheet: 'tour', done: false, cur: false },
  ]);

  const complete = (id: string) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, done: true, cur: false } : it);
      const firstPending = next.find(it => !it.done && it.id !== 'verified');
      if (firstPending) {
        return next.map(it => ({ ...it, cur: it.id === firstPending.id }));
      }
      return next;
    });
  };

  return { items, complete };
}

function ProfileSheet({ onClose, onComplete, profile }: { onClose: () => void; onComplete: () => void; profile: RoleProfile }) {
  return (
    <>
      <div className="sheet-head">
        <div className="si">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>
        <div>
          <div className="st">Complete your profile</div>
          <div className="ss">Add your institution and class code so bookings route correctly.</div>
        </div>
        <div className="sheet-x" onClick={onClose}>✕</div>
      </div>
      <div className="sheet-body">
        <div className="row2">
          <div className="field"><label>First name</label><input className="input" defaultValue="Ada" /></div>
          <div className="field"><label>Last name</label><input className="input" defaultValue="Lovelace" /></div>
        </div>
        <div className="field"><label>Institution</label><input className="input" defaultValue="Harvard University" /></div>
        <div className="row2">
          <div className="field"><label>Department</label><input className="input" defaultValue="Physics" /></div>
          <div className="field"><label>Role</label><input className="input" defaultValue="Student" /></div>
        </div>
        <div className="field">
          <label>{profile.pf.label}</label>
          <input className="input mono" placeholder={profile.pf.placeholder} />
        </div>
        <div className="note-row">
          <span className="sdot cyan" style={{ marginTop: 5, flexShrink: 0 }} />
          <span dangerouslySetInnerHTML={{ __html: profile.pf.note }} />
        </div>
      </div>
      <div className="sheet-foot">
        <span className="meta">Profile · onboarding</span>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onComplete}>Save profile</button>
      </div>
    </>
  );
}

function SafetySheet({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [ack, setAck] = useState(false);
  return (
    <>
      <div className="sheet-head">
        <div className="si">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <div className="eyebrow">2-minute read</div>
          <div className="st">Safety primer</div>
          <div className="ss">Three things to know before you fire a pulse.</div>
        </div>
        <div className="sheet-x" onClick={onClose}>✕</div>
      </div>
      <div className="sheet-body">
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></div>
          <div>
            <h4>Lock <span className="tag">42.577 MHz</span></h4>
            <p>The drive stays frequency-<b>locked</b> to the qubit. If lock drifts, runs are <b>blocked</b> until it re-acquires — you'll see lock status live in the top strip.</p>
          </div>
        </div>
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg></div>
          <div>
            <h4>Drive power <span className="tag">dBm</span></h4>
            <p>Pulses are delivered in <b>dBm</b>. Stay under your assigned ceiling — the coach warns before you cross it. <b>More power isn't more signal.</b></p>
          </div>
        </div>
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12" /><rect x="9" y="8" width="6" height="8" rx="1" fill="rgba(82,165,67,0.25)" stroke="#52A543" /><circle cx="12" cy="12" r="2.4" fill="#52A543" stroke="none" /></svg></div>
          <div>
            <h4>Safe-band limits <span className="tag">green band</span></h4>
            <p>Every parameter slider has a <b>green safe band</b>. Inside it, the hardware is protected. Outside it, the run is blocked and you're offered a <b>one-tap correction</b>.</p>
          </div>
        </div>
        <div className={`checkrow mt24${ack ? ' on' : ''}`} onClick={() => setAck(!ack)}>
          <span className="cb">{ack ? '✓' : ''}</span>
          I understand the lock, drive-power, and safe-band limits.
        </div>
      </div>
      <div className="sheet-foot">
        <span className="meta">Safety · onboarding</span>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" disabled={!ack} onClick={onComplete}>I understand</button>
      </div>
    </>
  );
}

function PhysicsSheet({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  return (
    <>
      <div className="sheet-head">
        <div className="si">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="2.4" />
            <ellipse cx="12" cy="12" rx="10" ry="4.2" />
            <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
          </svg>
        </div>
        <div>
          <div className="eyebrow">The basis</div>
          <div className="st">How your qubit works</div>
          <div className="ss">Your qubit is a real spin. Here's the physics — and how it maps to the controls you'll use.</div>
        </div>
        <div className="sheet-x" onClick={onClose}>✕</div>
      </div>
      <div className="sheet-body">
        <div className="lineage-hero">
          <div className="lh-art">
            <svg viewBox="0 0 168 152" preserveAspectRatio="xMidYMid meet">
              <defs><marker id="ah" markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="#E59C3B" /></marker></defs>
              <line x1="84" y1="14" x2="84" y2="138" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4" />
              <text x="90" y="22" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="#5a606b">B₀</text>
              <ellipse cx="84" cy="60" rx="42" ry="13" fill="none" stroke="rgba(127,209,214,0.35)" strokeWidth="1" />
              <line x1="84" y1="92" x2="120" y2="50" stroke="#7fd1d6" strokeWidth="2" strokeLinecap="round" />
              <circle cx="120" cy="50" r="3.5" fill="#7fd1d6" />
              <path d="M50 60 A 42 13 0 0 1 84 47" fill="none" stroke="#E59C3B" strokeWidth="1.2" markerEnd="url(#ah)" />
              <text x="84" y="118" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="#9aa0ab" textAnchor="middle">ω = γB₀</text>
              <text x="84" y="132" fontFamily="'JetBrains Mono',monospace" fontSize="7.5" fill="#5a606b" textAnchor="middle">Larmor precession</text>
            </svg>
          </div>
          <div className="lh-copy">
            <div className="eyebrow">Spin → qubit</div>
            <h3>A controlled nuclear spin is a two-level system.</h3>
            <p>Place a spin in a magnetic field and it settles into two energy states — <span className="ket">|0⟩</span> and <span className="ket">|1⟩</span>. Tip it with a resonant pulse and it <b>precesses</b>, tracing the Bloch sphere.</p>
          </div>
        </div>
        <div className="map-head"><span className="mh-from">Spin physics · Earth's-field NMR</span><span /><span className="mh-to">On your qubit</span></div>
        {[
          ['Larmor resonance', 'omega=gamma*B0, ~2 kHz Earth field', 'Drive lock', '42.577 MHz'],
          ['Resonant pulse', 'tips magnetization into the plane', 'Single-qubit gate', 'a rotation, flip angle theta'],
          ['90deg / inversion pulses', 'excite, then invert the spin', 'X / Y operations', 'excite, then refocus with pi pulse'],
          ['Free precession (delay tau)', 'phase winds up between pulses', 'Phase evolution (Z)', 'echo delay tau controls wind-up'],
          ['Spin echo / CPMG', 'cancels static dephasing', 'Dynamical decoupling', 'the spin-echo recipe run first'],
          ['T1 / T2 relaxation', 'signal averaging over transients', 'Coherence time', 'T2* the number your experiment measures'],
        ].map(([ft, fd, tt, td]) => (
          <div key={ft} className="map-row">
            <div className="map-cell from"><div className="mc-t">{ft}</div><div className="mc-d">{fd}</div></div>
            <div className="map-arrow">→</div>
            <div className="map-cell to"><div className="mc-t">{tt}</div><div className="mc-d">{td}</div></div>
          </div>
        ))}
        <div className="heritage">
          <div className="h-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h11a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4z" /><path d="M20 5h-3a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h3z" /></svg></div>
          <div className="h-body">
            <b>Heritage.</b> The pulse-and-precession control behind Katmai's qubit was first proven on benchtop <b>Earth's-field NMR</b>, where a single coil manipulates nuclear spins at audio frequency.
            <span className="cite">Reference · C A Michal, "A low-cost spectrometer for NMR measurements in the Earth's magnetic field," Meas. Sci. Technol. 21 (2010) 105902.</span>
          </div>
        </div>
      </div>
      <div className="sheet-foot">
        <span className="meta">The basis · onboarding</span>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onComplete}>Got it</button>
      </div>
    </>
  );
}

const TOUR_STEPS = [
  {
    num: '01 · Workflow', title: 'Four steps, left to right.',
    body: 'Pick recipe → Calibrate channel → Set parameters → Run & analyse. The stepper on the left always shows where you are and what\'s next.',
    art: (
      <svg viewBox="0 0 400 168" preserveAspectRatio="xMidYMid meet">
        <line x1="60" y1="84" x2="340" y2="84" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <g fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#9aa0ab" textAnchor="middle">
          <circle cx="60" cy="84" r="9" fill="#52A543" /><text x="60" y="112">Recipe</text>
          <circle cx="153" cy="84" r="9" fill="#52A543" /><text x="153" y="112">Calibrate</text>
          <circle cx="247" cy="84" r="11" fill="#E59C3B" /><text x="247" y="114" fill="#eef0f3">Parameters</text>
          <circle cx="340" cy="84" r="9" fill="none" stroke="#5a606b" strokeWidth="1.5" /><text x="340" y="112" fill="#5a606b">Run</text>
        </g>
      </svg>
    ),
  },
  {
    num: '02 · The coach', title: 'Plain-language guidance, in context.',
    body: 'At each step the coach tells you what the control does and why it matters — no manual required.',
    art: (
      <svg viewBox="0 0 400 168" preserveAspectRatio="xMidYMid meet">
        <rect x="70" y="44" width="260" height="80" rx="6" fill="#11141d" stroke="rgba(255,255,255,0.1)" />
        <rect x="70" y="44" width="3" height="80" fill="#E59C3B" />
        <rect x="92" y="58" width="48" height="11" rx="2" fill="rgba(229,156,59,0.2)" />
        <rect x="92" y="80" width="210" height="7" rx="3" fill="rgba(255,255,255,0.16)" />
        <rect x="92" y="94" width="170" height="7" rx="3" fill="rgba(255,255,255,0.1)" />
      </svg>
    ),
  },
  {
    num: '03 · Safe-band sliders', title: 'Stay inside the green.',
    body: 'Drag each parameter until the knob sits in its safe band. The knob turns green when you\'re in range; stray out and the run is blocked with a one-tap fix.',
    art: (
      <svg viewBox="0 0 400 168" preserveAspectRatio="xMidYMid meet">
        <rect x="60" y="80" width="280" height="9" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" />
        <rect x="150" y="78" width="120" height="13" rx="3" fill="rgba(82,165,67,0.22)" stroke="#52A543" />
        <circle cx="210" cy="84" r="9" fill="#52A543" />
        <g fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#5a606b"><text x="60" y="112">min</text><text x="318" y="112">max</text><text x="150" y="64" fill="#52A543">safe band</text></g>
      </svg>
    ),
  },
  {
    num: '04 · Run & analyse', title: 'Fire shots, compare to target.',
    body: 'Arm, then run your shots. The live readout and histogram fill in, and you compare the measured T₂* against the experiment\'s target band.',
    art: (
      <svg viewBox="0 0 400 168" preserveAspectRatio="xMidYMid meet">
        <line x1="60" y1="130" x2="340" y2="130" stroke="rgba(255,255,255,0.12)" />
        <rect x="92" y="64" width="34" height="66" fill="rgba(229,156,59,0.5)" />
        <rect x="150" y="48" width="34" height="82" fill="#E59C3B" />
        <rect x="208" y="86" width="34" height="44" fill="rgba(229,156,59,0.35)" />
        <rect x="266" y="104" width="34" height="26" fill="rgba(229,156,59,0.22)" />
        <line x1="60" y1="60" x2="340" y2="60" stroke="#52A543" strokeWidth="1" strokeDasharray="4 3" />
        <text x="338" y="56" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#52A543" textAnchor="end">target</text>
      </svg>
    ),
  },
];

function TourSheet({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === TOUR_STEPS.length - 1;
  const s = TOUR_STEPS[step];

  return (
    <>
      <div className="sheet-head">
        <div className="si">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-4 1 2-6 4-1z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div>
          <div className="eyebrow">2-minute tour</div>
          <div className="st">How the operate view works</div>
          <div className="ss">Four things you'll use every session.</div>
        </div>
        <div className="sheet-x" onClick={onClose}>✕</div>
      </div>
      <div className="sheet-body">
        <div className="tour-stage">
          <div className="tour-step on">
            <div className="tour-art">{s.art}</div>
            <span className="tnum">{s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </div>
      </div>
      <div className="sheet-foot">
        <div className="tour-dots">
          {TOUR_STEPS.map((_, i) => <i key={i} className={i === step ? 'on' : ''} onClick={() => setStep(i)} />)}
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>← Back</button>
        <button className="btn btn-primary" onClick={() => { if (isLast) { onComplete(); onClose(); } else setStep(s => s + 1); }}>
          {isLast ? 'Finish tour ✓' : 'Next →'}
        </button>
      </div>
    </>
  );
}

export function Onboarding({ isActive, profile, onNavigate }: Props) {
  const { items, complete } = useChecklist();
  const [sheet, setSheet] = useState<SheetId>(null);

  const openSheet = (id: SheetId) => setSheet(id);
  const closeSheet = () => setSheet(null);
  const completeAndClose = (id: string) => { complete(id); setSheet(null); };

  const renderSheet = () => {
    if (!sheet) return null;
    switch (sheet) {
      case 'profile': return <ProfileSheet onClose={closeSheet} onComplete={() => completeAndClose('profile')} profile={profile} />;
      case 'safety': return <SafetySheet onClose={closeSheet} onComplete={() => completeAndClose('safety')} />;
      case 'physics': return <PhysicsSheet onClose={closeSheet} onComplete={() => completeAndClose('physics')} />;
      case 'tour': return <TourSheet onClose={closeSheet} onComplete={() => complete('tour')} />;
    }
  };

  return (
    <section className={`screen${isActive ? ' active' : ''}`} data-screen="onboarding" data-temp="cool1" data-knob="45">
      <div className="canvas">
        <div className="page">
          <div className="topbar">
            <div className="bmark"><KatmaiLogo size={20} /> Katmai</div>
            <div className="sep" />
            <span className="crumb">First run · Getting set up</span>
            <div className="spacer" />
            <div className="who"><span className="avatar">{profile.initial}</span> <span>{profile.name}</span></div>
          </div>
          <div className="page-body">
            <div className="page-head">
              <div className="eyebrow">Welcome aboard</div>
              <h1 className="title" dangerouslySetInnerHTML={{ __html: profile.onbTitle.replace('first pulse', '<em>first pulse</em>').replace('first pulse', '<em>first pulse</em>').replace('reserve hardware', '<em>reserve hardware</em>').replace('students join', '<em>students join</em>') }} />
              <p>{profile.onbSub}</p>
            </div>
            <div className="checklist">
              {items.map(it => (
                <div key={it.id} className={`ci-row${it.done ? ' done' : ''}${it.cur ? ' cur' : ''}`}>
                  <span className="ci-check">{it.done ? '✓' : ''}</span>
                  <div><div className="cn">{it.label}</div><div className="cd">{it.desc}</div></div>
                  {it.done ? (
                    <span className="ca">DONE</span>
                  ) : it.sheet ? (
                    <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => openSheet(it.sheet)}>
                      {it.id === 'profile' ? 'Add details' : it.id === 'safety' ? 'Read primer' : it.id === 'physics' ? 'Learn the basis' : 'Start tour'}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flexbtns">
              <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>Continue to workspace <span className="arr">→</span></button>
              <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>Skip for now</button>
            </div>
          </div>
        </div>

        {(['profile', 'safety', 'physics', 'tour'] as SheetId[]).map(id => (
          <div key={id} className={`sheet-backdrop${sheet === id ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && closeSheet()}>
            <div className={`sheet${id === 'physics' || id === 'tour' ? ' wide' : ''}`}>
              {sheet === id && renderSheet()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
