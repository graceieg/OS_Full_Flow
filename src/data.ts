import type { Role, RoleProfile } from './types';

export const ROLES: Record<Role, RoleProfile> = {
  student: {
    name: 'Ada Lovelace', initial: 'A',
    crumb: 'Workspace · PHYS 191 — Quantum Lab',
    onbTitle: 'Four steps before your first pulse, Ada.',
    onbSub: 'The instrument fires real microwave pulses at a real qubit. These steps make sure you — and the hardware — are ready.',
    pf: { label: 'Class code', placeholder: 'e.g. PHYS191-Q4', note: 'Your class code links you to <b>PHYS 191 — Quantum Lab</b>. Bookings, assigned experiments, and seat limits route through your educator automatically.' },
    banner: '<b>Student access.</b> You can book open slots on shared lab devices. Your educator assigned <b>spin-echo (T₂*)</b> as this week\'s experiment.',
    context: { eyebrow: 'Assigned experiment', title: 'Spin-echo · measure T₂*', meta: 'π/2 — τ — π refocus · readout · compare against target 11–13 μs', action: 'View brief' },
    railTitle: 'Courses',
    rail: [
      { color: 'var(--cyan)', title: 'PHYS 191 — Quantum Lab', meta: 'Module 4 of 9 · spin dynamics' },
      { color: 'var(--accent)', title: 'Pulse sequences 101', meta: 'Self-paced · 3 lessons left' },
      { color: '#9C5FE8', title: 'Reading the FID', meta: 'Not started' },
    ],
    operator: 'A. Lovelace · student',
  },
  researcher: {
    name: 'Dr. Lena Carver', initial: 'L',
    crumb: 'Workspace · Carver Lab — Coherence',
    onbTitle: 'A couple of steps before you reserve hardware, Lena.',
    onbSub: 'Researcher accounts get full booking, recipe authoring, and a priority queue. Confirm your details and review the access policy to unlock hardware.',
    pf: { label: 'Lab / Principal investigator', placeholder: 'e.g. Carver Lab', note: 'Bookings, recipes, and device allocations bill to <b>Carver Lab</b>. Priority queue and extended slots apply to researcher accounts.' },
    banner: '<b>Researcher access.</b> Full booking with priority queue and extended slots. Author and version your own pulse recipes — no class code required.',
    context: { eyebrow: 'Active recipe', title: 'CPMG-16 · dynamical decoupling', meta: 'Authored by you · v4 · last run T₂ = 38.2 μs', action: 'Open in composer' },
    railTitle: 'Recent experiments',
    rail: [
      { color: 'var(--accent)', title: 'CPMG-16 sweep', meta: 'Today · 2048 shots · T₂ 38.2 μs' },
      { color: 'var(--cyan)', title: 'Ramsey fringe', meta: 'Yesterday · Δf −2.4 kHz' },
      { color: '#9C5FE8', title: 'Cross-resonance q0→q1', meta: '2 days ago · draft' },
    ],
    operator: 'Dr. L. Carver · researcher',
  },
  educator: {
    name: 'Prof. Alan Reyes', initial: 'A',
    crumb: 'Workspace · PHYS 191 — Instructor',
    onbTitle: 'Set up your class before students join, Alan.',
    onbSub: 'Educator accounts manage seats, assign experiments, and reserve device pools for class sessions. Confirm your details and create a class to begin.',
    pf: { label: 'Department', placeholder: 'e.g. Physics', note: 'You\'ll create a <b>class code</b> next for students to join. Seats, assignments, and the device pool are managed from your workspace.' },
    banner: '<b>Educator access.</b> Manage your class roster and seats, assign experiments, and reserve a device pool for each session. Students join with your class code.',
    context: { eyebrow: 'This week\'s assignment', title: 'Spin-echo · measure T₂* — assigned', meta: 'Assigned to PHYS 191 · 24 of 31 students completed', action: 'Edit assignment' },
    railTitle: 'Your classes',
    rail: [
      { color: 'var(--cyan)', title: 'PHYS 191 — Quantum Lab', meta: '31 students · 6 devices' },
      { color: 'var(--accent)', title: 'PHYS 270 — Adv. Topics', meta: '12 students · 2 devices' },
      { color: '#9C5FE8', title: 'Office hours pool', meta: 'Drop-in · 1 device' },
    ],
    operator: 'Prof. A. Reyes · educator',
  },
};

export const SCREEN_KNOB: Record<string, number> = {
  signup: 8, signin: 8, verify: 26, onboarding: 45, dashboard: 66, connect: 92, operate: 100,
};

export const HAPPY_PATH = ['signup', 'verify', 'onboarding', 'dashboard', 'connect', 'operate'];
