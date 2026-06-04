import { useEffect, useRef, useState } from 'react';
import type { ScreenId, RoleProfile } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  profile: RoleProfile;
  onNavigate: (s: ScreenId) => void;
}

function SpectroFid() {
  const pathRef = useRef<SVGPathElement>(null);
  const animRef = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    function draw() {
      t.current += 0.022;
      const W = 520, H = 88, pts = 80;
      let d = '';
      for (let i = 0; i <= pts; i++) {
        const x = (i / pts) * W;
        const decay = Math.exp(-i / pts * 3.2);
        const y = H / 2 + Math.sin(i / pts * Math.PI * 12 + t.current * 2.1) * 30 * decay;
        d += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
      }
      pathRef.current?.setAttribute('d', d);
      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <svg className="spectro-fid" viewBox="0 0 520 88" preserveAspectRatio="none">
      <line x1="0" y1="44" x2="520" y2="44" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <path ref={pathRef} fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.85" />
    </svg>
  );
}

type SlotState = 'taken' | 'mine' | 'open';

interface Slot { time: string; state: SlotState; }

const INITIAL_SLOTS: Slot[] = [
  { time: '09:00', state: 'taken' },
  { time: '10:00', state: 'taken' },
  { time: '11:00', state: 'open' },
  { time: '13:00', state: 'open' },
  { time: '14:00', state: 'mine' },
  { time: '15:00', state: 'open' },
  { time: '16:00', state: 'open' },
];

export function Dashboard({ isActive, profile, onNavigate }: Props) {
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);

  const selectSlot = (time: string) => {
    setSlots(prev => prev.map(s => ({
      ...s,
      state: s.state === 'taken' ? 'taken' : s.time === time ? 'mine' : s.state === 'mine' ? 'open' : s.state,
    })));
  };

  const openCount = slots.filter(s => s.state === 'open').length;

  return (
    <section className={`screen${isActive ? ' active' : ''}`} data-screen="dashboard" data-temp="cool2" data-knob="66">
      <div className="canvas">
        <div className="page">
          <div className="topbar">
            <div className="bmark"><KatmaiLogo size={20} /> Katmai</div>
            <div className="sep" />
            <span className="crumb">{profile.crumb}</span>
            <div className="spacer" />
            <div className="who"><span className="avatar">{profile.initial}</span> <span>{profile.name}</span></div>
          </div>
          <div className="page-body">
            <div className="role-banner">
              <span className="rbi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                  <path d="M12 12v9M12 12L4 7.5M12 12l8-4.5" />
                </svg>
              </span>
              <div dangerouslySetInnerHTML={{ __html: profile.banner }} />
            </div>

            <div className="dash">
              <div>
                <div className="panel-h">
                  <span className="pt">Shared instrument — Earth's-field NMR</span>
                  <span className="pa">1 spectrometer · Bench 1, Room 114</span>
                </div>
                <div className="devices">
                  <div className="device sel spectro">
                    <div className="spectro-top">
                      <div className="spectro-id">
                        <div className="dn">EFNMR-01</div>
                        <div className="spectro-sub">Arduino spectrometer · ~US$200 build</div>
                      </div>
                      <span className="dstat online"><span className="sdot ok" />Online · idle</span>
                    </div>
                    <SpectroFid />
                    <div className="spectro-specs">
                      <div className="sp"><span className="spk">Larmor frequency</span><span className="spv">2083 Hz</span></div>
                      <div className="sp"><span className="spk">Polarization field</span><span className="spv">10.5 mT</span></div>
                      <div className="sp"><span className="spk">Sample</span><span className="spv">H₂O · 0.55 L</span></div>
                      <div className="sp"><span className="spk">Controller</span><span className="spv">Arduino · USB</span></div>
                    </div>
                    <div className="slot-head">
                      <span className="slh-t">Book a 1-hour slot — today</span>
                      <span className="slh-m">{openCount} of {slots.length} open</span>
                    </div>
                    <div className="slots">
                      {slots.map(s => (
                        <span
                          key={s.time}
                          className={`slot${s.state === 'taken' ? ' taken' : s.state === 'mine' ? ' mine' : ''}`}
                          onClick={() => { if (s.state !== 'taken') selectSlot(s.time); }}
                        >
                          {s.time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel-h"><span className="pt">{profile.context.eyebrow}</span></div>
                <div className="card-s">
                  <div className="spread">
                    <div>
                      <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--text)' }}>{profile.context.title}</div>
                      <div className="meta mt8">{profile.context.meta}</div>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: 12 }}>{profile.context.action}</button>
                  </div>
                </div>
              </div>

              <div>
                <div className="rail-card">
                  <div className="panel-h"><span className="pt">Your bookings</span></div>
                  <div className="booking next">
                    <span className="badge-next">Next up</span>
                    <span className="bt">EFNMR-01 · Bench 1</span>
                    <span className="bm">Today · 14:00 – 15:00 · 52 min</span>
                  </div>
                  <div className="booking">
                    <span className="bt">EFNMR-01 · Bench 1</span>
                    <span className="bm">Thu · 14:00 – 15:00</span>
                  </div>
                  <button className="btn btn-primary btn-block mt16" onClick={() => onNavigate('connect')}>
                    Go to bench &amp; connect <span className="arr">→</span>
                  </button>
                </div>
                <div className="rail-card">
                  <div className="panel-h"><span className="pt">{profile.railTitle}</span></div>
                  {profile.rail.map((item, i) => (
                    <div key={i} className="course">
                      <span className="cdot" style={{ background: item.color }} />
                      <div>
                        <div className="ctitle">{item.title}</div>
                        <div className="cmeta">{item.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
