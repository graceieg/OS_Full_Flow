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
    { id: 'safety', label: 'Read the safety primer', desc: '2-minute read on the magnetic field, polarization-coil current, and coil tuning.', sheet: 'safety', done: false, cur: false },
    { id: 'physics', label: 'How NMR works', desc: 'Proton spin in the Earth\'s field, Larmor precession, and the free-induction decay you\'ll measure.', sheet: 'physics', done: false, cur: false },
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
          <div className="ss">Three things to know before you energize the coils.</div>
        </div>
        <div className="sheet-x" onClick={onClose}>✕</div>
      </div>
      <div className="sheet-body">
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4v7a6 6 0 0 0 12 0V4"/><line x1="5" y1="4" x2="9" y2="4"/><line x1="15" y1="4" x2="19" y2="4"/></svg></div>
          <div>
            <h4>Magnetic field <span className="tag">10.5 mT</span></h4>
            <p>During polarization the coil produces <b>~200× the Earth's field</b>. It's strong but <b>local to the bore</b> — keep phones, cards, and loose ferromagnetic tools clear, and stay back if you have a pacemaker or metal implant.</p>
          </div>
        </div>
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg></div>
          <div>
            <h4>Polarization-coil current <span className="tag">13.4 A</span></h4>
            <p>The polarization coil draws <b>13.4 A</b> and gets <b>warm</b>. <b>Never touch the coil leads while a run is energized</b>, and let the coil cool between long CPMG trains.</p>
          </div>
        </div>
        <div className="primer-sec">
          <div className="pi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12c2.5 0 2.5-7 5-7s2.5 14 5 14 2.5-7 5-7h5" strokeLinecap="round"/></svg></div>
          <div>
            <h4>Coil resonance tuning <span className="tag">2083 Hz</span></h4>
            <p>The receive coil is tuned to resonance at the Larmor frequency. <b>Don't move ferromagnetic objects near the bore mid-run</b> — it shifts B₀ and ruins the average. Re-tune from the calibrate step if the peak drifts.</p>
          </div>
        </div>
        <div className={`checkrow mt24${ack ? ' on' : ''}`} onClick={() => setAck(!ack)}>
          <span className="cb">{ack ? '✓' : ''}</span>
          I understand the magnetic-field, coil-current, and resonance-tuning precautions.
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
          <div className="eyebrow">The physics</div>
          <div className="st">How NMR works</div>
          <div className="ss">Proton spin in the Earth's field, Larmor precession, and the free-induction decay — what each step of a run is doing.</div>
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
            <div className="eyebrow">Proton spin · Earth's field</div>
            <h3>A proton is a tiny magnet that precesses.</h3>
            <p>Every proton in the water sample carries a nuclear spin. In the Earth's field B₀ the spins line up, and once tipped they <b>precess</b> around the field. The precession rate is the <b>Larmor frequency</b>, ω = γB₀ — about <b>2083 Hz</b> here, right in the audio band.</p>
          </div>
        </div>
        <div className="map-head"><span className="mh-from">In the coil</span><span className="mh-mid" /><span className="mh-to">On the scope</span></div>
        {[
          ['1 · Pre-polarize', '10.5 mT coil · ~7 s · 13.4 A draw', 'Magnetization builds', 'net spin lines up along the coil axis'],
          ['2 · Adiabatic turn-off', 'coil current ramps down over ~10 ms', 'M follows the field', 'rotates to align with Earth\'s B₀'],
          ['3 · 90° pulse', 'audio burst at 2083 Hz · n cycles', 'Tipped into plane', 'precession about B₀ begins'],
          ['4 · Free precession', 'spins precess at ω = γB₀', 'Voltage induced', 'precessing M induces a signal in the coil'],
          ['5 · Dephasing', 'field inhomogeneity spreads the spins', 'Free-induction decay', 'the FID — a 2083 Hz tone decaying away'],
          ['6 · 180° refocus (spin-echo)', 'π pulse after delay τ', 'An echo forms', 'dephasing reverses · peak at 2τ'],
          ['7 · CPMG train', 'π/2 — (τ — π — τ)×16', 'Echo train decays', 'envelope measures T₂ · ~1.9 s for water'],
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
            <b>The instrument.</b> The Katmai 01 acts as pulse programmer, RF synthesizer, and digitizer — driving the transmit/receive coil and polarization coil from an ARM Cortex-A78 core running KatmaiOS. No superconducting magnet or cryogens required.
            <span className="cite">Reference · C A Michal, "A low-cost spectrometer for NMR measurements in the Earth's magnetic field," Meas. Sci. Technol. 21 (2010) 105902.</span>
          </div>
        </div>
      </div>
      <div className="sheet-foot">
        <span className="meta">The physics · onboarding</span>
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
    body: 'Pick sequence → Tune to resonance → Set parameters → Run & analyse. The stepper on the left always shows where you are and what\'s next.',
    art: (
      <svg viewBox="0 0 400 168" preserveAspectRatio="xMidYMid meet">
        <line x1="60" y1="84" x2="340" y2="84" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <g fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#9aa0ab" textAnchor="middle">
          <circle cx="60" cy="84" r="9" fill="#52A543" /><text x="60" y="112">Sequence</text>
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
    body: 'Arm, then run your transients. The live FID and spectrum fill in, and you compare the measured value (e.g. T₂) against the experiment\'s target band.',
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
