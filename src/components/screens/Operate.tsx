import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScreenId } from '../../types';
import './Operate.css';

type OperateState =
  | 'ready' | 'out-of-band' | 'run-blocked' | 'arming'
  | 'running' | 'completed' | 'lock-lost' | 'mid-run-fail';

interface Props {
  isActive: boolean;
  onNavigate: (s: ScreenId) => void;
}

interface Param {
  id: string;
  name: string;
  sym: string;
  unit: string;
  min: number;
  max: number;
  safeLo: number;
  safeHi: number;
  value: number;
  hint: string;
}

const PARAM_DEFS: Param[] = [
  {
    id: 'freq', name: 'Pulse frequency', sym: 'f₀', unit: 'Hz',
    min: 2000, max: 2200, safeLo: 2070, safeHi: 2096, value: 2083,
    hint: 'Must match the proton Larmor frequency in Earth\'s field (~2083 Hz). Even small deviations reduce signal amplitude rapidly — the protons won\'t respond to a pulse that\'s off-resonance.',
  },
  {
    id: 'dur', name: 'Pulse duration', sym: 'τ_p', unit: 'µs',
    min: 100, max: 1000, safeLo: 200, safeHi: 600, value: 480,
    hint: 'Sets the flip angle. 480 µs tips the magnetization ~90° into the transverse plane. Double it for a 180° refocusing pulse. Too short → weak signal; too long → over-rotates past the transverse plane.',
  },
  {
    id: 'echo', name: 'Echo spacing', sym: 'τ', unit: 'ms',
    min: 5, max: 100, safeLo: 8, safeHi: 50, value: 20,
    hint: 'Half the time between the 90° pulse and the first echo. Shorter spacing means faster refocusing and less T₂ decay loss between echoes — but too short and the hardware can\'t switch between transmit and receive.',
  },
  {
    id: 'pol', name: 'Polarization time', sym: 't_pol', unit: 's',
    min: 1, max: 15, safeLo: 5, safeHi: 10, value: 7,
    hint: 'How long the 10.5 mT polarization coil runs before acquisition. Longer times build more net magnetization and improve SNR, but the coil draws 13.4 A — let it cool between long CPMG trains.',
  },
];

const RECIPES = [
  { id: 'spin-echo', label: 'Spin-echo · T₂', desc: 'π/2 — τ — π · measure T₂ from a single echo' },
  { id: 'cpmg-16',   label: 'CPMG-16 · echo train', desc: 'π/2 — (τ — π — τ)×16 · fit T₂ from echo envelope' },
  { id: 'nutation',  label: 'Nutation · 90° cal', desc: 'Sweep pulse duration to find the 90° flip angle' },
];

function pct(val: number, min: number, max: number) {
  return Math.round(((val - min) / (max - min)) * 1000) / 10;
}

function FidTrace({ active }: { active: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);
  const animRef = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    if (!active) { cancelAnimationFrame(animRef.current); return; }
    function draw() {
      t.current += 0.04;
      const W = 280, H = 76, pts = 80;
      let d = '';
      for (let i = 0; i <= pts; i++) {
        const x = (i / pts) * W;
        const decay = Math.exp(-i / pts * 2.8);
        const y = H / 2 + Math.sin(i / pts * Math.PI * 14 + t.current) * 28 * decay;
        d += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
      }
      pathRef.current?.setAttribute('d', d);
      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return <path ref={pathRef} fill="none" stroke="#E59C3B" strokeWidth="1.4" />;
}

function ParamSlider({
  param, onChange, disabled,
}: { param: Param; onChange: (id: string, val: number) => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(param.id === 'freq');
  const inSafe = param.value >= param.safeLo && param.value <= param.safeHi;
  const fillPct  = pct(param.value, param.min, param.max);
  const safeLeft = pct(param.safeLo, param.min, param.max);
  const safeRight = 100 - pct(param.safeHi, param.min, param.max);

  return (
    <div className={`param${!inSafe ? ' is-error' : ''}`}>
      <div className="param-top">
        <div className="param-name">
          {param.name}
          {!inSafe && <span className="error-chip">Out of safe band</span>}
        </div>
        <div className="param-sym">{param.sym}</div>
      </div>
      <div className="param-val">
        {param.value.toLocaleString()} <span className="unit">{param.unit}</span>
      </div>

      {/* Range input styled with custom track */}
      <div className="param-track-wrap">
        <div className="param-track">
          <span className="safe" style={{ left: `${safeLeft}%`, right: `${safeRight}%` }} />
          <span className="fill" style={{ width: `${fillPct}%` }} />
          <span className={`knob${inSafe ? ' in-safe' : ''}`} style={{ left: `${fillPct}%` }} />
        </div>
        <input
          type="range"
          className="param-range-input"
          min={param.min}
          max={param.max}
          step={param.id === 'freq' ? 1 : param.id === 'dur' ? 10 : param.id === 'echo' ? 1 : 0.5}
          value={param.value}
          disabled={disabled}
          onChange={e => onChange(param.id, Number(e.target.value))}
        />
      </div>

      <div className="param-scale">
        <span>{param.min.toLocaleString()} {param.unit}</span>
        <span>{param.max.toLocaleString()} {param.unit}</span>
      </div>
      <div className="param-band-readout">
        <span className="safe-tag">safe band <span className="nums">{param.safeLo.toLocaleString()}–{param.safeHi.toLocaleString()} {param.unit}</span></span>
        <span className={`state${inSafe ? '' : ' out'}`}>
          {inSafe ? `inside · ${param.value.toLocaleString()} ${param.unit}` : `outside · ${param.value.toLocaleString()} ${param.unit}`}
        </span>
      </div>

      <div className="param-toggle" onClick={() => setExpanded(e => !e)}>
        {expanded ? 'Hide explanation' : 'Show explanation'}
      </div>
      {expanded && <div className="param-hint">{param.hint}</div>}

      {!inSafe && (
        <div className="param-recovery">
          <span className="lbl">Recover:</span>
          <button className="r-btn primary" onClick={() => {
            const safe = Math.round((param.safeLo + param.safeHi) / 2);
            onChange(param.id, safe);
          }}>
            Snap to safe value
          </button>
        </div>
      )}
    </div>
  );
}

export function Operate({ isActive, onNavigate: _onNavigate }: Props) {
  const [operateState, setOperateState] = useState<OperateState>('ready');
  const [params, setParams] = useState<Param[]>(PARAM_DEFS);
  const [shots, setShots] = useState(100);
  const [shotsDone, setShotsDone] = useState(0);
  const [recipe, setRecipe] = useState(RECIPES[0]);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [mode, setMode] = useState<'operate' | 'learn'>('learn');
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allInBand = params.every(p => p.value >= p.safeLo && p.value <= p.safeHi);

  const handleParamChange = useCallback((id: string, val: number) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, value: val } : p));
  }, []);

  const snapAllToSafe = useCallback(() => {
    setParams(prev => prev.map(p => {
      if (p.value < p.safeLo) return { ...p, value: p.safeLo };
      if (p.value > p.safeHi) return { ...p, value: p.safeHi };
      return p;
    }));
  }, []);

  // Derive state from params
  useEffect(() => {
    if (operateState === 'ready' || operateState === 'out-of-band' || operateState === 'run-blocked') {
      if (!allInBand) {
        setOperateState('out-of-band');
      } else {
        setOperateState('ready');
      }
    }
  }, [allInBand, operateState]);

  const startAcquire = useCallback(() => {
    if (!allInBand) { setOperateState('run-blocked'); return; }
    setOperateState('arming');
    setShotsDone(0);
    setTimeout(() => {
      setOperateState('running');
      let done = 0;
      runTimerRef.current = setInterval(() => {
        done += Math.floor(Math.random() * 4) + 1;
        if (done >= shots) {
          done = shots;
          setShotsDone(done);
          clearInterval(runTimerRef.current!);
          setOperateState('completed');
        } else {
          setShotsDone(done);
        }
      }, 120);
    }, 1800);
  }, [allInBand, shots]);

  const resetRun = useCallback(() => {
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    setShotsDone(0);
    setOperateState(allInBand ? 'ready' : 'out-of-band');
  }, [allInBand]);

  useEffect(() => {
    if (!isActive && runTimerRef.current) clearInterval(runTimerRef.current);
  }, [isActive]);

  // Keyboard shortcut: Enter = acquire, R = reset
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && operateState === 'ready') startAcquire();
      if (e.key === 'r' || e.key === 'R') resetRun();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, operateState, startAcquire, resetRun]);

  // Derived
  const isProgress   = operateState === 'arming' || operateState === 'running' || operateState === 'completed';
  const isRunBlocked = operateState === 'run-blocked';
  const lockDanger   = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const showAlert    = operateState === 'out-of-band' || operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const alertIsDanger = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const runDisabled  = lockDanger;
  const footerWarn   = operateState === 'out-of-band' || operateState === 'run-blocked';
  const footerDanger = lockDanger;
  const footerInfo   = operateState === 'arming' || operateState === 'running';
  const colRIdle     = ['ready','out-of-band','run-blocked','lock-lost'].includes(operateState);
  const colRFailure  = operateState === 'mid-run-fail';

  const getStepClass = (idx: number) => {
    if (operateState === 'completed') return 'v-step done';
    if (['running','mid-run-fail'].includes(operateState)) {
      return idx < 3 ? 'v-step done' : idx === 3 ? 'v-step active' : 'v-step';
    }
    return idx < 2 ? 'v-step done' : idx === 2 ? 'v-step active' : idx === 3 ? 'v-step is-next-up' : 'v-step';
  };

  const runCardClass = ['run-card', isRunBlocked && 'is-blocked', isProgress && 'is-progress',
    operateState === 'arming' && 'is-arming', operateState === 'running' && 'is-running',
    operateState === 'completed' && 'is-complete'].filter(Boolean).join(' ');

  let alertCopy = '';
  if (operateState === 'out-of-band') {
    const bad = params.filter(p => p.value < p.safeLo || p.value > p.safeHi);
    alertCopy = `<b>${bad.length} parameter${bad.length > 1 ? 's' : ''} outside safe band</b> · ${bad.map(p => p.name).join(', ')} ${bad.length > 1 ? 'are' : 'is'} outside the calibrated window. Snap to safe or adjust manually.`;
  } else if (operateState === 'lock-lost') {
    alertCopy = '<b>Field lock lost</b> · The coil may be detuned. Recalibrate before acquiring — current readouts will be unreliable.';
  } else if (operateState === 'mid-run-fail') {
    alertCopy = `<b>Field lock lost mid-run</b> · The lock dropped at shot ${shotsDone} / ${shots}. Partial data discarded. Re-lock field and retry.`;
  }

  let rpTitle = '', rpBody = '';
  let rpFillPct = 0;
  if (operateState === 'arming') {
    rpTitle = 'Compiling sequence…'; rpFillPct = 0;
    rpBody = 'Translating UI parameters into firmware-ready packets and validating round-trip timing.';
  } else if (operateState === 'running') {
    rpTitle = 'Acquiring'; rpFillPct = Math.round((shotsDone / shots) * 100);
    rpBody = 'Live trace updating on the right. The FID appears after each shot; the echo envelope builds across shots.';
  } else if (operateState === 'completed') {
    rpTitle = 'Acquisition complete'; rpFillPct = 100;
    rpBody = 'All readouts within target. Save the result or acquire again with tweaked parameters.';
  }

  const acqClass = operateState === 'running' ? 'acq live' : operateState === 'completed' ? 'acq complete' : operateState === 'mid-run-fail' ? 'acq lost' : 'acq';
  const acqText  = operateState === 'running' ? 'Acquiring' : operateState === 'completed' ? 'Complete' : operateState === 'mid-run-fail' ? 'Unlocked' : 'Idle';

  const freqParam = params.find(p => p.id === 'freq')!;

  const stats = [
    {
      k: 'T₂', v: operateState === 'completed' ? '1.94' : '—',
      u: operateState === 'completed' ? 's' : '',
      targetClass: operateState === 'completed' ? 'target ok' : 'target',
      targetText: operateState === 'completed' ? '✓ within 1.7–2.1 s' : 'target 1.7–2.1 s',
    },
    {
      k: 'SNR', v: operateState === 'completed' ? '28.4' : operateState === 'running' ? String(Math.round(shotsDone * 0.28)) : '—',
      u: '',
      targetClass: operateState === 'completed' ? 'target ok' : 'target',
      targetText: operateState === 'completed' ? '✓ within 20–50' : 'target 20–50',
    },
    {
      k: 'Larmor freq', v: operateState === 'completed' || operateState === 'running' ? String(freqParam.value) : '—',
      u: operateState === 'completed' || operateState === 'running' ? 'Hz' : '',
      targetClass: operateState === 'completed' ? 'target ok' : 'target',
      targetText: 'typical 2080–2086 Hz',
    },
    {
      k: 'Echo count', v: operateState === 'completed' ? '16' : '—',
      u: '',
      targetClass: operateState === 'completed' ? 'target ok' : 'target',
      targetText: 'aim 8–32',
    },
  ];

  let footerMsg = 'Ready — all parameters inside safe bands';
  if (operateState === 'out-of-band')  footerMsg = `${params.filter(p => p.value < p.safeLo || p.value > p.safeHi).length} parameter(s) outside safe band · review before acquiring`;
  if (operateState === 'run-blocked')  footerMsg = 'Acquire blocked — bring all parameters into their safe bands first';
  if (operateState === 'arming')       footerMsg = 'Compiling sequence — please wait…';
  if (operateState === 'running')      footerMsg = `Acquiring shot ${shotsDone} / ${shots} · field locked`;
  if (operateState === 'completed')    footerMsg = 'Acquisition complete — all targets met';
  if (operateState === 'lock-lost')    footerMsg = 'Field lock lost — recalibrate before acquiring';
  if (operateState === 'mid-run-fail') footerMsg = `Field lock lost mid-run at shot ${shotsDone} · re-acquire to retry`;

  const footerClass = ['footer', footerWarn && !footerDanger && 'is-warn', footerDanger && 'is-danger', footerInfo && 'is-info'].filter(Boolean).join(' ');
  const colRClass   = ['col col-r', colRIdle && 'is-idle', colRFailure && 'is-failure'].filter(Boolean).join(' ');

  let stageCueText = 'Step 4 · readout populates after Acquire';
  let stageCueIsFailure = false;
  if (operateState === 'running')      stageCueText = `Acquiring · shot ${shotsDone} of ${shots}`;
  if (operateState === 'completed')    stageCueText = 'Acquisition complete · readout reflects last shot';
  if (operateState === 'mid-run-fail') { stageCueText = `Field lock lost at shot ${shotsDone} / ${shots} — partial data discarded`; stageCueIsFailure = true; }

  return (
    <section className={`screen${isActive ? ' active' : ''}`} data-screen="operate" data-temp="cold">
    <div className="operate-screen">
      <div className="frame">
        <div className="stage">
          {/* ─── Titlebar ─── */}
          <div className="tb">
            <div className="mark">
              <svg width="16" height="12" viewBox="0 0 22 16" fill="none">
                <path d="M7 1 L1 8 L7 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 1 L21 8 L15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="b">CatMayOS</span>
            <span className="view">Teaching session</span>
            <div className="spacer" />
            <div className="mode-toggle">
              <div className={mode === 'operate' ? 'on' : ''} onClick={() => setMode('operate')}>Operate</div>
              <div className={mode === 'learn' ? 'on' : ''} onClick={() => setMode('learn')}>Learn</div>
            </div>
            <div className="help-link">Courses <span className="k">⌘?</span></div>
          </div>

          {/* ─── System status strip ─── */}
          <div className="status-strip">
            <div className="item neutral"><span className="dot" /><span className="k">Device</span><span className="v">EFNMR-01</span></div>
            <div className="item info"><span className="dot" /><span className="k">Polarization</span><span className="v">10.5 mT</span></div>
            <div className="item info"><span className="dot" /><span className="k">Coil resonance</span><span className="v">{freqParam.value} Hz</span></div>
            <div className={`item${lockDanger ? ' danger' : ''}`}>
              <span className="dot" />
              <span className="k">Field lock</span>
              <span className="v">{lockDanger ? 'unlocked' : 'locked'}</span>
            </div>
            <div className="item neutral"><span className="dot" /><span className="k">Sequence</span><span className="v">{recipe.label}</span></div>
            <div className="spacer" />
          </div>

          {/* ─── Body ─── */}
          <div className="body">
            {/* LEFT COLUMN */}
            <div className="col col-l">
              <div className="eye is-active">This session</div>
              <div className="v-stepper">
                {[
                  { label: 'Pick sequence',      sub: recipe.label },
                  { label: 'Calibrate channel',  sub: 'All channels in range' },
                  { label: 'Set parameters',     sub: allInBand ? 'All parameters in safe band' : 'Adjust out-of-band parameters' },
                  { label: 'Acquire & analyze',  sub: operateState === 'completed' ? 'T₂ = 1.94 s · within target' : 'Compare readout against targets' },
                ].map((step, i) => (
                  <div key={i} className={getStepClass(i)}>
                    <div className="marker"><span>{i + 1}</span></div>
                    <div className="body-c">
                      <div className="n">{step.label}</div>
                      <div className="sub">{step.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="eye-2">Sequence diagram</div>
              <div className="card seq-card">
                <div className="ttl">{recipe.label}</div>
                <svg className="seq-svg" viewBox="0 0 240 64">
                  <line x1="0" y1="32" x2="240" y2="32" stroke="rgba(255,255,255,0.10)" strokeWidth="1"/>
                  <rect x="6" y="18" width="14" height="28" fill="rgba(229,156,59,0.25)" stroke="#E59C3B" strokeWidth="1" rx="1"/>
                  <text x="13" y="14" textAnchor="middle" fill="#B8B4A6" fontFamily="ui-monospace, monospace" fontSize="9">π/2</text>
                  <line x1="20" y1="32" x2="40" y2="32" stroke="#5F5C50" strokeWidth="1" strokeDasharray="2 2"/>
                  <rect x="40" y="14" width="14" height="36" fill="rgba(229,156,59,0.18)" stroke="#E59C3B" strokeWidth="1" rx="1"/>
                  <text x="47" y="10" textAnchor="middle" fill="#B8B4A6" fontFamily="ui-monospace, monospace" fontSize="9">π</text>
                  <line x1="54" y1="32" x2="84" y2="32" stroke="#5F5C50" strokeWidth="1" strokeDasharray="2 2"/>
                  <rect x="84" y="14" width="14" height="36" fill="rgba(229,156,59,0.18)" stroke="#E59C3B" strokeWidth="1" rx="1"/>
                  <text x="91" y="10" textAnchor="middle" fill="#B8B4A6" fontFamily="ui-monospace, monospace" fontSize="9">π</text>
                  <line x1="98" y1="32" x2="128" y2="32" stroke="#5F5C50" strokeWidth="1" strokeDasharray="2 2"/>
                  <rect x="128" y="14" width="14" height="36" fill="rgba(229,156,59,0.18)" stroke="#E59C3B" strokeWidth="1" rx="1"/>
                  <text x="135" y="10" textAnchor="middle" fill="#B8B4A6" fontFamily="ui-monospace, monospace" fontSize="9">π</text>
                  <line x1="142" y1="32" x2="172" y2="32" stroke="#5F5C50" strokeWidth="1" strokeDasharray="2 2"/>
                  <text x="157" y="46" textAnchor="middle" fill="#5F5C50" fontFamily="ui-monospace, monospace" fontSize="9">… ×N</text>
                  <rect x="180" y="18" width="14" height="28" fill="rgba(82,165,67,0.22)" stroke="#52A543" strokeWidth="1" rx="1"/>
                  <text x="187" y="14" textAnchor="middle" fill="#B8B4A6" fontFamily="ui-monospace, monospace" fontSize="9">read</text>
                  <path d="M 200 32 Q 215 28 230 30 T 240 32" fill="none" stroke="#B8B4A6" strokeWidth="1"/>
                </svg>
              </div>
            </div>

            {/* CENTER COLUMN */}
            <div className="col col-c">
              <div className="pad-head">
                <div>
                  <div className="pad-title">{recipe.label}</div>
                  <div className="pad-sub">{recipe.desc}</div>
                </div>
                <div className="recipe-pick" onClick={() => setShowRecipePicker(v => !v)}>
                  {recipe.id === 'spin-echo' ? 'Spin-echo' : recipe.id === 'cpmg-16' ? 'CPMG-16' : 'Nutation'} <span className="caret">⌄</span>
                  {showRecipePicker && (
                    <div className="recipe-dropdown">
                      {RECIPES.map(r => (
                        <div key={r.id} className={`recipe-opt${r.id === recipe.id ? ' sel' : ''}`}
                          onClick={e => { e.stopPropagation(); setRecipe(r); setShowRecipePicker(false); }}>
                          <div className="ro-label">{r.label}</div>
                          <div className="ro-desc">{r.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline alert */}
              <div className={`inline-alert${showAlert ? ' is-visible' : ''}${alertIsDanger ? ' danger' : ''}`}>
                <div className="icn">!</div>
                <div className="copy" dangerouslySetInnerHTML={{ __html: alertCopy }} />
                <div className="actions">
                  {(operateState === 'out-of-band') && (
                    <button className="a-btn primary" onClick={snapAllToSafe}>Snap all to safe</button>
                  )}
                  {(operateState === 'lock-lost' || operateState === 'mid-run-fail') && (
                    <button className="a-btn primary" onClick={resetRun}>Re-lock &amp; reset</button>
                  )}
                </div>
              </div>

              {/* Coach */}
              {mode === 'learn' && (
                <div className="coach">
                  <span className="badge">Why we're doing this</span>
                  <div className="copy">
                    The spin-echo sequence refocuses dephased magnetization — after a 90° pulse tips the spins into the transverse plane, a 180° pulse at time τ reverses the dephasing and produces an echo at 2τ. Repeating this with CPMG lets you measure <span className="term">T₂</span>, the true transverse relaxation time, by fitting the echo envelope.
                  </div>
                </div>
              )}

              {/* Objectives strip */}
              {mode === 'learn' && (
                <div className="obj-strip">
                  <div className="label">Objectives</div>
                  <div className="list">
                    <div className="obj"><span className="num">01</span><span>Understand why the 180° pulse refocuses dephased spins and when it can't.</span></div>
                    <div className="obj"><span className="num">02</span><span>Measure T₂ for water and compare it against the theoretical ~1.9 s value.</span></div>
                    <div className="obj"><span className="num">03</span><span>Explain the difference between T₂ (true decay) and T₂* (inhomogeneity-limited).</span></div>
                  </div>
                </div>
              )}

              {/* Parameters */}
              <div className="params-wrap">
                <div className="params-head">
                  <div className="ttl">Parameters</div>
                </div>
                <div className="params">
                  {params.map(p => (
                    <ParamSlider key={p.id} param={p} onChange={handleParamChange} disabled={isProgress} />
                  ))}
                </div>
              </div>

              {/* Run card */}
              <div className={runCardClass}>
                {!isRunBlocked && !isProgress && (
                  <>
                    <div>
                      <div className="ttl">Acquire</div>
                      <div className="step-link"><span className="arrow">→</span> advances to <b>Step 4 · Acquire &amp; analyze</b></div>
                    </div>
                    <div className="spacer" />
                    <div className="shots">
                      <span>Shots</span>
                      <input
                        className="input shots-input"
                        type="number"
                        min={1} max={500}
                        value={shots}
                        onChange={e => setShots(Math.max(1, Math.min(500, Number(e.target.value))))}
                        style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                      />
                    </div>
                    <button
                      className={`btn primary${runDisabled ? ' is-disabled' : ''}`}
                      disabled={runDisabled}
                      onClick={startAcquire}
                    >
                      Acquire {!runDisabled && <span className="kbd">↵</span>}
                    </button>
                  </>
                )}

                <div className="run-blocked">
                  <div className="rb-head">
                    <span className="rb-icn">!</span>
                    <span className="rb-title">Acquire blocked</span>
                  </div>
                  <div className="rb-body">Bring all parameters into their safe bands before acquiring.</div>
                  <div className="rb-actions">
                    <button className="r-btn primary" onClick={snapAllToSafe}>Snap all to safe &amp; acquire</button>
                    <button className="r-btn" onClick={() => setOperateState('ready')}>Cancel</button>
                  </div>
                </div>

                <div className="run-progress">
                  <div className="rp-head">
                    <span className="rp-title">
                      <span className="indicator" />
                      <span>{rpTitle}</span>
                    </span>
                    <span className="rp-count">{operateState !== 'arming' ? `${shotsDone} / ${shots} shots` : ''}</span>
                  </div>
                  <div className="rp-bar">
                    <div className="fill" style={operateState === 'arming' ? undefined : { width: `${rpFillPct}%` }} />
                  </div>
                  <div className="rp-body">{rpBody}</div>
                  <div className="rp-actions">
                    {operateState === 'running' && (
                      <button className="r-btn" onClick={resetRun}>Abort run</button>
                    )}
                    {operateState === 'completed' && (
                      <>
                        <button className="r-btn primary">Save result</button>
                        <button className="r-btn" onClick={resetRun}>Acquire again</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="advanced" style={{ marginTop: 8, paddingLeft: 2 }} onClick={resetRun}>Reset run · R</div>
            </div>

            {/* RIGHT COLUMN */}
            <div className={colRClass}>
              <div className={`stage-cue${stageCueIsFailure ? ' is-failure' : ''}`}>{stageCueText}</div>

              <div className="eye">Signal readout</div>
              <div className="readout-grid">
                {stats.map((s, i) => (
                  <div key={i} className="stat">
                    <div className="k">{s.k}</div>
                    <div className={`v${s.v === '—' ? ' empty' : ''}`}>{s.v} {s.u && <span className="u">{s.u}</span>}</div>
                    <div className={s.targetClass}>{s.targetText}</div>
                  </div>
                ))}
              </div>

              <div className="scope-card">
                <div className="scope-head">
                  <span className="title">FID trace · {operateState === 'completed' ? 'last shot' : 'idle'}</span>
                  <span className={acqClass}>{acqText}</span>
                </div>
                <svg className="scope-svg" viewBox="0 0 280 76" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grat4" width="28" height="19" patternUnits="userSpaceOnUse">
                      <path d="M28 0 L0 0 0 19" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="280" height="76" fill="url(#grat4)"/>
                  {(operateState === 'running' || operateState === 'completed') ? (
                    <FidTrace active={operateState === 'running' || operateState === 'completed'} />
                  ) : (
                    <line x1="0" y1="38" x2="280" y2="38" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                  )}
                </svg>
                {operateState === 'completed' && (
                  <div className="scope-note">
                    Echo envelope decays with time constant T₂ = 1.94 s — consistent with proton relaxation in bulk water. The 2083 Hz carrier is visible within each echo pulse.
                  </div>
                )}
                {operateState === 'mid-run-fail' && (
                  <div className="scope-recovery is-visible">
                    <button className="r-btn primary" onClick={resetRun}>Re-lock &amp; reset</button>
                    <button className="r-btn">View diagnostics</button>
                  </div>
                )}
              </div>

              <div className="eye-2">System checks</div>
              <details className="r-disclosure">
                <summary>
                  <span className="left"><span>All checks passing</span><span className="count">3 / 3</span></span>
                  <span className="caret">▾</span>
                </summary>
                <div className="body-c">
                  <div className="analysis-row">
                    <span className="analysis-pill">Field lock ✓</span>
                    <span className="analysis-pill">Polarization coil ✓</span>
                    <span className="analysis-pill">Coil resonance ✓</span>
                    <span className="analysis-pill">USB link ✓</span>
                  </div>
                </div>
              </details>

              <details className="r-disclosure">
                <summary>
                  <span className="left"><span>Glossary</span><span className="count">7 terms</span></span>
                  <span className="caret">▾</span>
                </summary>
                <div className="body-c">
                  <div className="glossary-index">
                    <a>FID</a><a>T₂</a><a>T₂*</a><a>Larmor frequency</a><a>Spin-echo</a><a>CPMG</a><a>Flip angle</a>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className={footerClass}>
            <span className="status-dot" />
            <span className="label">Status</span>
            <span>{footerMsg}</span>
            <div className="spacer" />
            <span className="keys">Acquire <kbd>↵</kbd> &nbsp; Reset <kbd>R</kbd></span>
          </div>
        </div>
      </div>
    </div>
    </section>
  );
}
