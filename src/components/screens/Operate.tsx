import { useState } from 'react';
import type { ScreenId } from '../../types';
import './Operate.css';

type OperateState =
  | 'ready'
  | 'out-of-band'
  | 'run-blocked'
  | 'arming'
  | 'running'
  | 'completed'
  | 'lock-lost'
  | 'mid-run-fail';

interface Props {
  isActive: boolean;
  onNavigate: (s: ScreenId) => void;
}

export function Operate({ isActive, onNavigate: _onNavigate }: Props) {
  const [operateState, setOperateState] = useState<OperateState>('ready');

  // Derived booleans
  const isParam4Error  = operateState === 'out-of-band' || operateState === 'run-blocked';
  const showAlert      = operateState === 'out-of-band' || operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const isRunBlocked   = operateState === 'run-blocked';
  const isProgress     = operateState === 'arming' || operateState === 'running' || operateState === 'completed';
  const runDisabled    = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const lockDanger     = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const footerWarn     = operateState === 'out-of-band' || operateState === 'run-blocked';
  const footerDanger   = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  const footerInfo     = operateState === 'arming' || operateState === 'running';
  const colRIdle       = operateState === 'ready' || operateState === 'out-of-band' || operateState === 'run-blocked' || operateState === 'lock-lost';
  const colRFailure    = operateState === 'mid-run-fail';

  // Param 4 knob: out of band when isParam4Error
  const p4InBand = !isParam4Error;

  // Stepper
  // ready/out-of-band/run-blocked/lock-lost/arming: steps 0,1 done; step 2 active; step 3 next-up
  // running/mid-run-fail: steps 0,1,2 done; step 3 active
  // completed: all done
  const getStepClass = (idx: number): string => {
    if (operateState === 'completed') return 'v-step done';
    if (operateState === 'running' || operateState === 'mid-run-fail') {
      if (idx < 3) return 'v-step done';
      if (idx === 3) return 'v-step active';
      return 'v-step';
    }
    // ready, out-of-band, run-blocked, lock-lost, arming
    if (idx < 2) return 'v-step done';
    if (idx === 2) return 'v-step active';
    if (idx === 3) return 'v-step is-next-up';
    return 'v-step';
  };

  // Run card class
  const runCardClass = [
    'run-card',
    isRunBlocked ? 'is-blocked' : '',
    isProgress ? 'is-progress' : '',
    operateState === 'arming' ? 'is-arming' : '',
    operateState === 'running' ? 'is-running' : '',
    operateState === 'completed' ? 'is-complete' : '',
  ].filter(Boolean).join(' ');

  // Alert content
  const alertIsDanger = operateState === 'lock-lost' || operateState === 'mid-run-fail';
  let alertCopy = '';
  if (operateState === 'out-of-band') {
    alertCopy = '<b>1 parameter outside its safe band</b> · Parameter 4 is below its calibrated window. Acquire is allowed but readout may not be reliable.';
  } else if (operateState === 'lock-lost') {
    alertCopy = '<b>Field lock lost</b> · The field lock lost — coil may be detuned. Recalibrate before acquiring — current readouts will be unreliable.';
  } else if (operateState === 'mid-run-fail') {
    alertCopy = '<b>Field lock lost mid-run</b> · The lock dropped at shot 37 / 100. Partial data discarded. Re-lock field and retry.';
  }

  const alertActions = (): { label: string; primary: boolean }[] => {
    if (operateState === 'out-of-band') {
      return [{ label: 'Snap to safe', primary: true }, { label: 'Review', primary: false }];
    }
    if (operateState === 'lock-lost' || operateState === 'mid-run-fail') {
      return [{ label: 'Re-lock field', primary: true }, { label: 'View diagnostics', primary: false }];
    }
    return [];
  };

  // Run blocked content
  const rbTitle = 'Acquire blocked';
  const rbBody  = '<b>Parameter 4</b> ([value]) is below its safe band of [lo]–[hi]. Bring it into the band, or override if you understand the trade-off.';
  const rbActions = [
    { label: 'Snap to safe & acquire', primary: true },
    { label: 'Override (type "I understand")', primary: false },
    { label: 'Cancel', primary: false },
  ];

  // Run progress content
  let rpTitle   = '';
  let rpCount   = '';
  let rpFillPct = 0;
  let rpBody    = '';
  const rpActions: { label: string; primary: boolean }[] = [];

  if (operateState === 'arming') {
    rpTitle   = 'Compiling sequence…';
    rpCount   = '';
    rpFillPct = 0;
    rpBody    = 'Translating UI commands into firmware-ready packets and validating round-trip timing.';
    rpActions.push({ label: 'Cancel', primary: false });
  } else if (operateState === 'running') {
    rpTitle   = 'Acquiring';
    rpCount   = '37 / 100 shots';
    rpFillPct = 37;
    rpBody    = 'Live trace updating on the right. Pause to inspect mid-run; abort discards partial data.';
    rpActions.push({ label: 'Pause', primary: false }, { label: 'Abort run', primary: false });
  } else if (operateState === 'completed') {
    rpTitle   = 'Acquisition complete';
    rpCount   = '100 / 100 shots';
    rpFillPct = 100;
    rpBody    = 'All readouts within target. Save the result, compare against a previous result, or acquire again with a tweaked parameter.';
    rpActions.push(
      { label: 'Save result', primary: true },
      { label: 'Acquire again', primary: false },
      { label: 'Compare to previous', primary: false },
    );
  }

  // Run button text/state
  let runBtnLabel = 'Acquire';
  if (runDisabled) {
    runBtnLabel = operateState === 'mid-run-fail' ? 'Re-acquire to retry' : 'Acquire · locked';
  }

  // Right column stage cue
  let stageCueText = 'Step 4 · readout populates after Acquire';
  let stageCueIsFailure = false;
  if (operateState === 'running') {
    stageCueText = 'Acquiring · shot 37 of 100';
  } else if (operateState === 'completed') {
    stageCueText = 'Acquisition complete · readout reflects last shot';
  } else if (operateState === 'mid-run-fail') {
    stageCueText = 'Field lock lost at shot 37 / 100 — partial data discarded';
    stageCueIsFailure = true;
  }

  // Acquisition state
  let acqClass = 'acq';
  let acqText  = 'Acquired';
  if (operateState === 'running') { acqClass = 'acq live'; acqText = 'Acquiring'; }
  else if (operateState === 'completed') { acqClass = 'acq complete'; acqText = 'Complete'; }
  else if (operateState === 'mid-run-fail') { acqClass = 'acq lost'; acqText = 'Unlocked'; }

  // Footer
  let footerMsg = 'Ready — all parameters inside safe bands';
  if (operateState === 'out-of-band')   footerMsg = '1 parameter outside safe band · review before acquiring';
  if (operateState === 'run-blocked')   footerMsg = 'Acquire blocked — out-of-band parameter';
  if (operateState === 'arming')        footerMsg = 'Compiling sequence — please wait';
  if (operateState === 'running')       footerMsg = 'Acquiring shot 37 / 100 · field locked';
  if (operateState === 'completed')     footerMsg = 'Acquisition complete — all targets met';
  if (operateState === 'lock-lost')     footerMsg = 'Field lock lost — recalibrate before acquiring';
  if (operateState === 'mid-run-fail')  footerMsg = 'Field lock lost mid-run · re-acquire and retry';

  // Stat tiles
  type StatTile = {
    k: string;
    v: string;
    u: string;
    targetClass: string;
    targetText: string;
    empty?: boolean;
  };

  const defaultStats: StatTile[] = [
    { k: 'T₂ (ms)',           v: '[value]', u: '[unit]', targetClass: 'target', targetText: 'target [range]' },
    { k: 'SNR',               v: '[value]', u: '[unit]', targetClass: 'target ok', targetText: 'within target' },
    { k: 'Larmor freq (Hz)',  v: '[value]', u: '[unit]', targetClass: 'target', targetText: 'typical [range]' },
    { k: 'Echo count',        v: '[value]', u: '[unit]', targetClass: 'target', targetText: 'aim [range]' },
  ];

  const stats: StatTile[] = defaultStats.map((s, i) => {
    if (operateState === 'running' && (i === 2 || i === 3)) {
      return { ...s, v: '—', empty: true, targetClass: 'target', targetText: 'pending' };
    }
    if (operateState === 'completed') {
      return { ...s, targetClass: 'target ok', targetText: 'within target' };
    }
    if (operateState === 'mid-run-fail' && (i === 0 || i === 3)) {
      return { ...s, v: '—', empty: true, targetClass: 'target fail', targetText: 'no data' };
    }
    return s;
  });

  const footerClass = [
    'footer',
    footerWarn && !footerDanger ? 'is-warn' : '',
    footerDanger ? 'is-danger' : '',
    footerInfo ? 'is-info' : '',
  ].filter(Boolean).join(' ');

  const colRClass = [
    'col col-r',
    colRIdle ? 'is-idle' : '',
    colRFailure ? 'is-failure' : '',
  ].filter(Boolean).join(' ');

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
              <div>Operate</div>
              <div className="on">Learn</div>
            </div>
            <div className="help-link">Courses <span className="k">⌘?</span></div>
          </div>

          {/* ─── System status strip ─── */}
          <div className="status-strip">
            <div className="item neutral"><span className="dot" /><span className="k">Device</span><span className="v">[id]</span></div>
            <div className="item info"><span className="dot" /><span className="k">Polarization</span><span className="v">[value · unit]</span></div>
            <div className="item info"><span className="dot" /><span className="k">Coil resonance</span><span className="v">[value · unit]</span></div>
            <div className={`item${lockDanger ? ' danger' : ''}`}>
              <span className="dot" />
              <span className="k">Field lock</span>
              <span className="v">{lockDanger ? 'unlocked' : 'locked'}</span>
            </div>
            <div className="item neutral"><span className="dot" /><span className="k">Student</span><span className="v">[name]</span></div>
            <div className="spacer" />
          </div>

          {/* ─── Body ─── */}
          <div className="body">
            {/* LEFT COLUMN */}
            <div className="col col-l">
              <div className="eye is-active">This session</div>
              <div className="v-stepper">
                {[
                  { label: 'Pick recipe',        sub: 'Chose [Experiment]' },
                  { label: 'Calibrate channel',  sub: 'All 4 channels in range' },
                  { label: 'Set parameters',     sub: 'Tune each control inside its safe band' },
                  { label: 'Acquire & analyze',   sub: 'Compare readout against targets' },
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
                <div className="ttl">[Pulse sequence sketch]</div>
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
                  <div className="pad-title">[Experiment title]</div>
                  <div className="pad-sub">[One-line description of the pulse sequence and what it measures]</div>
                </div>
                <div className="recipe-pick">[Recipe] <span className="caret">⌄</span></div>
              </div>

              {/* Inline alert */}
              <div className={`inline-alert${showAlert ? ' is-visible' : ''}${alertIsDanger ? ' danger' : ''}`}>
                <div className="icn">!</div>
                <div className="copy" dangerouslySetInnerHTML={{ __html: alertCopy }} />
                <div className="actions">
                  {alertActions().map((a, i) => (
                    <button key={i} className={`a-btn${a.primary ? ' primary' : ''}`}>{a.label}</button>
                  ))}
                </div>
              </div>

              {/* Coach */}
              <div className="coach">
                <span className="badge">Why we're doing this</span>
                <div className="copy">
                  [2 sentences setting up the experiment in the student's words, ending with what to watch for on the readout. Hover any <span className="term">underlined term</span> for a definition.]
                </div>
              </div>

              {/* Objectives strip */}
              <div className="obj-strip">
                <div className="label">Objectives</div>
                <div className="list">
                  <div className="obj"><span className="num">01</span><span>[Objective 1 — one sentence, in the student's words.]</span></div>
                  <div className="obj"><span className="num">02</span><span>[Objective 2 — what they should be able to explain afterwards.]</span></div>
                  <div className="obj"><span className="num">03</span><span>[Objective 3 — the intuition this experiment is meant to build.]</span></div>
                </div>
              </div>

              {/* Parameters */}
              <div className="params-wrap">
                <div className="params-head">
                  <div className="ttl">Parameters</div>
                  <div className="hint-toggle"><span className="lbl">Expand all explanations</span></div>
                </div>
                <div className="params">
                  {/* Param 1 — anchor, expanded */}
                  <div className="param is-anchor is-expanded">
                    <div className="param-top">
                      <div className="param-name">Pulse frequency</div>
                      <div className="param-sym">f₀</div>
                    </div>
                    <div className="param-val">2083 <span className="unit">Hz</span></div>
                    <div className="param-track">
                      <span className="safe" style={{ left: '35%', right: '22%' }} />
                      <span className="fill" style={{ width: '41.5%' }} />
                      <span className="knob in-safe" style={{ left: '41.5%' }} />
                    </div>
                    <div className="param-scale"><span>2000 Hz</span><span>2200 Hz</span></div>
                    <div className="param-band-readout">
                      <span className="safe-tag">safe band <span className="nums">2070–2096 Hz</span></span>
                      <span className="state">inside · 2083 Hz</span>
                    </div>
                    <div className="param-toggle">Hide explanation</div>
                    <div className="param-hint">
                      Must be near the proton Larmor frequency in Earth's field (~2083 Hz). Small deviations reduce signal amplitude rapidly.
                    </div>
                  </div>

                  {/* Param 2 */}
                  <div className="param">
                    <div className="param-top">
                      <div className="param-name">Pulse duration</div>
                      <div className="param-sym">τ_p</div>
                    </div>
                    <div className="param-val">[value] <span className="unit">µs</span></div>
                    <div className="param-track">
                      <span className="safe" style={{ left: '12%', right: '64%' }} />
                      <span className="fill" style={{ width: '20%' }} />
                      <span className="knob in-safe" style={{ left: '20%' }} />
                    </div>
                    <div className="param-scale"><span>[min]</span><span>[max]</span></div>
                    <div className="param-band-readout">
                      <span className="safe-tag">safe band <span className="nums">[lo]–[hi]</span></span>
                      <span className="state">inside · [value]</span>
                    </div>
                    <div className="param-toggle">Show explanation</div>
                    <div className="param-hint">Sets the flip angle. A 90° pulse tips magnetization into the transverse plane; a 180° pulse inverts it.</div>
                  </div>

                  {/* Param 3 */}
                  <div className="param">
                    <div className="param-top">
                      <div className="param-name">Echo spacing</div>
                      <div className="param-sym">τ</div>
                    </div>
                    <div className="param-val">[value] <span className="unit">ms</span></div>
                    <div className="param-track">
                      <span className="safe" style={{ left: '50%', right: '25%' }} />
                      <span className="fill" style={{ width: '67%' }} />
                      <span className="knob in-safe" style={{ left: '67%' }} />
                    </div>
                    <div className="param-scale"><span>[min]</span><span>[max]</span></div>
                    <div className="param-band-readout">
                      <span className="safe-tag">safe band <span className="nums">[lo]–[hi]</span></span>
                      <span className="state">inside · [value]</span>
                    </div>
                    <div className="param-toggle">Show explanation</div>
                    <div className="param-hint">Time between π pulses in the CPMG train. Shorter spacing reduces T₂ decay losses.</div>
                  </div>

                  {/* Param 4 — state-driven */}
                  <div className={`param${isParam4Error ? ' is-error' : ''}`}>
                    <div className="param-top">
                      <div className="param-name">
                        Polarization time
                        <span className="error-chip">Out of safe band</span>
                      </div>
                      <div className="param-sym">t_pol</div>
                    </div>
                    <div className="param-val">[value] <span className="unit">s</span></div>
                    <div className="param-track">
                      <span className="safe" style={{ left: '46%', right: '46%' }} />
                      <span className="fill" style={{ width: p4InBand ? '50%' : '36%' }} />
                      <span className={`knob${p4InBand ? ' in-safe' : ''}`} style={{ left: p4InBand ? '50%' : '36%' }} />
                    </div>
                    <div className="param-scale"><span>[min]</span><span>[max]</span></div>
                    <div className="param-band-readout">
                      <span className="safe-tag">safe band <span className="nums">[lo]–[hi]</span></span>
                      <span className={`state${p4InBand ? '' : ' out'}`}>
                        {p4InBand ? 'inside · [value]' : 'below band · [value]'}
                      </span>
                    </div>
                    <div className="param-toggle">Show explanation</div>
                    <div className="param-hint">How long the polarization coil runs before acquisition. Longer times increase SNR but slow the experiment.</div>
                    <div className="param-recovery">
                      <span className="lbl">Recover:</span>
                      <button className="r-btn primary">Snap to nearest safe value</button>
                      <button className="r-btn">Override</button>
                      <button className="r-btn ghost">What does this mean?</button>
                    </div>
                  </div>
                </div>
              </div>{/* /params-wrap */}

              {/* Run card */}
              <div className={runCardClass}>
                {/* Normal header — hidden when blocked or progress */}
                {!isRunBlocked && !isProgress && (
                  <>
                    <div>
                      <div className="ttl">Acquire</div>
                      <div className="step-link"><span className="arrow">→</span> advances to <b>Step 4 · Acquire &amp; analyze</b></div>
                    </div>
                    <div className="spacer" />
                    <div className="shots">
                      <span>Shots</span>
                      <span className="input">[N]</span>
                    </div>
                    <button className={`btn primary${runDisabled ? ' is-disabled' : ''}`} disabled={runDisabled}>
                      {runBtnLabel} {!runDisabled && <span className="kbd">↵</span>}
                    </button>
                  </>
                )}

                {/* Run blocked panel */}
                <div className="run-blocked">
                  <div className="rb-head">
                    <span className="rb-icn">!</span>
                    <span className="rb-title">{rbTitle}</span>
                  </div>
                  <div className="rb-body" dangerouslySetInnerHTML={{ __html: rbBody }} />
                  <div className="rb-actions">
                    {rbActions.map((a, i) => (
                      <button key={i} className={`r-btn${a.primary ? ' primary' : ''}`}>{a.label}</button>
                    ))}
                  </div>
                </div>

                {/* Run progress panel */}
                <div className="run-progress">
                  <div className="rp-head">
                    <span className="rp-title">
                      <span className="indicator" />
                      <span>{rpTitle}</span>
                    </span>
                    <span className="rp-count">{rpCount}</span>
                  </div>
                  <div className="rp-bar">
                    <div
                      className="fill"
                      style={operateState === 'arming' ? undefined : { width: `${rpFillPct}%` }}
                    />
                  </div>
                  <div className="rp-body">{rpBody}</div>
                  <div className="rp-actions">
                    {rpActions.map((a, i) => (
                      <button key={i} className={`r-btn${a.primary ? ' primary' : ''}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="advanced" style={{ marginTop: 8, paddingLeft: 2 }}>Advanced · Arm, Compile, Reset</div>
            </div>

            {/* RIGHT COLUMN */}
            <div className={colRClass}>
              <div className={`stage-cue${stageCueIsFailure ? ' is-failure' : ''}`}>{stageCueText}</div>

              <div className="eye">Signal readout</div>
              <div className="readout-grid">
                {stats.map((s, i) => (
                  <div key={i} className="stat">
                    <div className="k">{s.k}</div>
                    <div className={`v${s.empty ? ' empty' : ''}`}>
                      {s.v} <span className="u">{s.u}</span>
                    </div>
                    <div className={s.targetClass}>{s.targetText}</div>
                  </div>
                ))}
              </div>

              <div className="scope-card">
                <div className="scope-head">
                  <span className="title">[Signal trace · last shot]</span>
                  <span className={acqClass}>{acqText}</span>
                </div>
                <svg className="scope-svg" viewBox="0 0 280 76" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grat4" width="28" height="19" patternUnits="userSpaceOnUse">
                      <path d="M28 0 L0 0 0 19" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="280" height="76" fill="url(#grat4)"/>
                  <path
                    d="M0 38 Q 8 12, 16 38 T 32 38 T 48 38 T 64 38 T 80 38 T 96 38 T 112 38 T 128 38 T 144 38 T 160 38 T 176 38 T 192 38 T 208 38 T 224 38 T 240 38 T 256 38 T 280 38"
                    fill="none" stroke="#DDD9C8" strokeWidth="1.4"
                  />
                </svg>
                {operateState !== 'mid-run-fail' && (
                  <div className="scope-note">
                    [Short annotation explaining what the trace shows and what the student should look for.]
                  </div>
                )}
                <div className={`scope-recovery${operateState === 'mid-run-fail' ? ' is-visible' : ''}`}>
                  <button className="r-btn primary">Re-lock field</button>
                  <button className="r-btn">Abort run</button>
                  <button className="r-btn">View diagnostics</button>
                </div>
              </div>

              <div className="eye-2">System checks</div>
              <details className="r-disclosure">
                <summary>
                  <span className="left">
                    <span>All checks passing</span>
                    <span className="count">3 / 3</span>
                  </span>
                  <span className="caret">▾</span>
                </summary>
                <div className="body-c">
                  <div className="analysis-row">
                    <span className="analysis-pill">[Check 1]</span>
                    <span className="analysis-pill">[Check 2]</span>
                    <span className="analysis-pill">[Check 3]</span>
                    <span className="analysis-pill">[Check 4]</span>
                  </div>
                </div>
              </details>

              <details className="r-disclosure">
                <summary>
                  <span className="left">
                    <span>Glossary</span>
                    <span className="count">7 terms</span>
                  </span>
                  <span className="caret">▾</span>
                </summary>
                <div className="body-c">
                  <div className="glossary-index">
                    <a>[Term]</a><a>[Term]</a><a>[Term]</a><a>[Term]</a><a>[Term]</a><a>[Term]</a><a>[Term]</a>
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

        {/* State switcher (dev/review chrome) */}
        <div style={{ marginTop: 16, padding: '10px 14px', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 10, background: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-sans, sans-serif)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8B8775', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: 12 }}>View state</span>
          {([
            { value: 'ready',        label: 'Ready',                color: '#52A543' },
            { value: 'out-of-band',  label: 'Param out of band',    color: '#E59C3B' },
            { value: 'run-blocked',  label: 'Run blocked',          color: '#E59C3B' },
            { value: 'arming',       label: 'Arming',               color: '#6FE6D8' },
            { value: 'running',      label: 'Running',              color: '#6FE6D8' },
            { value: 'completed',    label: 'Completed',            color: '#52A543' },
            { value: 'lock-lost',    label: 'Lock lost (pre-run)',  color: '#D8633F' },
            { value: 'mid-run-fail', label: 'Lock lost mid-run',    color: '#D8633F' },
          ] as { value: OperateState; label: string; color: string }[]).map(opt => (
            <label key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px', fontSize: 12, color: operateState === opt.value ? '#F0ECE2' : '#B8B4A6', border: `1px solid ${operateState === opt.value ? '#8B8775' : 'rgba(255,255,255,0.09)'}`, borderRadius: 999, cursor: 'pointer', background: operateState === opt.value ? 'rgba(255,255,255,0.06)' : 'transparent', userSelect: 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.color, display: 'inline-block' }} />
              <input type="radio" name="op-state" value={opt.value} checked={operateState === opt.value} onChange={() => setOperateState(opt.value)} style={{ display: 'none' }} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
}
