import type { Role, RoleProfile } from './types';

export const ROLES: Record<Role, RoleProfile> = {
  student: {
    name: 'Ada Lovelace', initial: 'A',
    crumb: 'Workspace · PHYS 191 — NMR Lab',
    onbTitle: 'Four steps before your first pulse, Ada.',
    onbSub: 'The instrument fires real audio-frequency pulses at protons in a water sample. These steps make sure you — and the hardware — are ready.',
    pf: { label: 'Class code', placeholder: 'e.g. PHYS191-Q4', note: 'Your class code links you to <b>PHYS 191 — NMR Lab</b>. Bookings, assigned sequences, and seat limits route through your educator automatically.' },
    banner: '<b>Student access.</b> You share one spectrometer with your class — book an open slot below. Your educator assigned <b>spin-echo (T₂)</b> as this week\'s experiment.',
    context: { eyebrow: 'Assigned experiment', title: 'Spin-echo · measure T₂', meta: 'π/2 — τ — π refocus · 10 ms echo · compare against target 1.7–2.1 s', action: 'View brief' },
    railTitle: 'Assigned sequences',
    rail: [
      { color: 'var(--cyan)', title: 'Spin-echo · T₂', meta: 'Due Fri · π/2 — τ — π' },
      { color: 'var(--accent)', title: 'CPMG-16 · echo train', meta: 'Next week · 16 echoes' },
      { color: '#9C5FE8', title: 'Nutation · 90° calibration', meta: 'Practice · simulator' },
    ],
    operator: 'A. Lovelace · student',
  },
  researcher: {
    name: 'Dr. Lena Carver', initial: 'L',
    crumb: 'Workspace · Carver Lab — NMR',
    onbTitle: 'A couple of steps before you reserve hardware, Lena.',
    onbSub: 'Researcher accounts get full booking, sequence authoring, and a priority queue. Confirm your details and review the access policy to unlock hardware.',
    pf: { label: 'Lab / Principal investigator', placeholder: 'e.g. Carver Lab', note: 'Bookings, sequences, and device allocations bill to <b>Carver Lab</b>. Priority queue and extended slots apply to researcher accounts.' },
    banner: '<b>Researcher access.</b> Full booking with priority queue and extended slots. Author and version your own pulse sequences — no class code required.',
    context: { eyebrow: 'Active sequence', title: 'CPMG-16 · T₂ measurement', meta: 'Authored by you · v4 · last run T₂ = 1.94 s', action: 'Open in composer' },
    railTitle: 'Recent experiments',
    rail: [
      { color: 'var(--accent)', title: 'CPMG-16 echo train', meta: 'Today · T₂ = 1.94 s' },
      { color: 'var(--cyan)', title: 'Spin-echo sweep', meta: 'Yesterday · τ scan · 5–50 ms' },
      { color: '#9C5FE8', title: 'Nutation calibration', meta: '2 days ago · 90° = 48 cycles' },
    ],
    operator: 'Dr. L. Carver · researcher',
  },
  educator: {
    name: 'Prof. Alan Reyes', initial: 'A',
    crumb: 'Workspace · PHYS 191 — Instructor',
    onbTitle: 'Set up your class before students join, Alan.',
    onbSub: 'Educator accounts manage seats, assign pulse sequences, and reserve the spectrometer for class sessions. Confirm your details and create a class to begin.',
    pf: { label: 'Department', placeholder: 'e.g. Physics', note: 'You\'ll create a <b>class code</b> next for students to join. Seats, sequence assignments, and the spectrometer pool are managed from your workspace.' },
    banner: '<b>Educator access.</b> Manage your class roster and seats, assign pulse sequences, and reserve the spectrometer for each session. Students join with your class code.',
    context: { eyebrow: 'This week\'s assignment', title: 'Spin-echo · measure T₂ — assigned', meta: 'Assigned to PHYS 191 · 24 of 31 students completed', action: 'Edit assignment' },
    railTitle: 'Your classes',
    rail: [
      { color: 'var(--cyan)', title: 'PHYS 191 — NMR Lab', meta: '31 students · 1 spectrometer' },
      { color: 'var(--accent)', title: 'PHYS 270 — Adv. NMR', meta: '12 students · 1 spectrometer' },
      { color: '#9C5FE8', title: 'Office hours pool', meta: 'Drop-in · shared' },
    ],
    operator: 'Prof. A. Reyes · educator',
  },
};

export const SCREEN_KNOB: Record<string, number> = {
  signup: 8, signin: 8, verify: 26, onboarding: 45, dashboard: 66, connect: 92, operate: 100,
};

export const HAPPY_PATH = ['signup', 'verify', 'onboarding', 'dashboard', 'connect', 'operate'];
