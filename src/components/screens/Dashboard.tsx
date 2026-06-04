import { useState } from 'react';
import type { ScreenId, RoleProfile } from '../../types';
import { KatmaiLogo } from '../KatmaiLogo';

interface Props {
  isActive: boolean;
  profile: RoleProfile;
  onNavigate: (s: ScreenId) => void;
}

interface DeviceData {
  id: string;
  name: string;
  status: 'online' | 'busy' | 'cooling';
  statusLabel: string;
  rows: [string, string][];
  bench: string;
  slots: { time: string; state: 'taken' | 'mine' | 'open' }[];
}

const INITIAL_DEVICES: DeviceData[] = [
  {
    id: 'Quantum-04', name: 'Quantum-04', status: 'online', statusLabel: 'Online',
    rows: [['Drive lock', '42.577 MHz'], ['Fridge', '12.4 mK']],
    bench: 'Bench 2 · open slots today',
    slots: [
      { time: '10:00', state: 'taken' }, { time: '11:00', state: 'taken' },
      { time: '13:00', state: 'open' }, { time: '14:00', state: 'mine' },
      { time: '15:00', state: 'open' }, { time: '16:00', state: 'open' },
    ],
  },
  {
    id: 'Quantum-01', name: 'Quantum-01', status: 'busy', statusLabel: 'In use',
    rows: [['Drive lock', '42.580 MHz'], ['Fridge', '12.6 mK']],
    bench: 'Bench 1 · next open 17:00',
    slots: [
      { time: '13:00', state: 'taken' }, { time: '14:00', state: 'taken' },
      { time: '15:00', state: 'taken' }, { time: '16:00', state: 'taken' },
      { time: '17:00', state: 'open' },
    ],
  },
  {
    id: 'Quantum-06', name: 'Quantum-06', status: 'cooling', statusLabel: 'Cooling',
    rows: [['Fridge', '184 mK ↓'], ['Ready in', '~38 min']],
    bench: 'Bench 3 · cooldown in progress',
    slots: [
      { time: '15:00', state: 'open' }, { time: '16:00', state: 'open' }, { time: '17:00', state: 'open' },
    ],
  },
  {
    id: 'Simulator', name: 'Simulator', status: 'online', statusLabel: 'Always on',
    rows: [['Backend', 'noise-model v3'], ['Queue', 'none']],
    bench: 'No booking required · practice freely',
    slots: [{ time: 'Launch now', state: 'open' }],
  },
];

export function Dashboard({ isActive, profile, onNavigate }: Props) {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [selectedId, setSelectedId] = useState('Quantum-04');

  const selectSlot = (devId: string, slotTime: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === devId) {
        return { ...d, slots: d.slots.map(s => ({ ...s, state: s.state === 'mine' ? 'open' : s.state, ...(s.time === slotTime && s.state !== 'taken' ? { state: 'mine' as const } : {}) })) };
      }
      return d;
    }));
    setSelectedId(devId);
  };

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
                  <span className="pt">Lab fleet — quantum devices</span>
                  <span className="pa">6 units · 12.4 mK base</span>
                </div>
                <div className="devices">
                  {devices.map(d => (
                    <div key={d.id} className={`device${d.id === selectedId ? ' sel' : ''}`} onClick={() => setSelectedId(d.id)}>
                      <div className="dh">
                        <span className="dn">{d.name}</span>
                        <span className={`dstat ${d.status}`}>
                          <span className={`sdot${d.status === 'online' ? ' ok' : d.status === 'cooling' ? ' cyan pulse' : ' idle'}`} />
                          {d.statusLabel}
                        </span>
                      </div>
                      {d.rows.map(([k, v]) => (
                        <div key={k} className="drow"><span className="dk">{k}</span><span>{v}</span></div>
                      ))}
                      <div className="dimg" />
                      <div className="meta" style={{ fontSize: 10 }}>{d.bench}</div>
                      <div className="slots">
                        {d.slots.map(s => (
                          <span
                            key={s.time}
                            className={`slot${s.state === 'taken' ? ' taken' : s.state === 'mine' ? ' mine' : ''}`}
                            onClick={e => { e.stopPropagation(); if (s.state !== 'taken') selectSlot(d.id, s.time); }}
                          >
                            {s.time}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
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
                    <span className="bt">Quantum-04 · Bench 2</span>
                    <span className="bm">Today · 14:00 – 15:00 · 52 min</span>
                  </div>
                  <div className="booking">
                    <span className="bt">Quantum-04 · Bench 2</span>
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
