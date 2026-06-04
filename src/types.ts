export type ScreenId = 'signup' | 'signin' | 'verify' | 'onboarding' | 'dashboard' | 'connect' | 'operate';
export type Role = 'student' | 'researcher' | 'educator';
export type AuthFeel = 'warm' | 'technical';

export interface RoleProfile {
  name: string;
  initial: string;
  crumb: string;
  onbTitle: string;
  onbSub: string;
  pf: { label: string; placeholder: string; note: string };
  banner: string;
  context: { eyebrow: string; title: string; meta: string; action: string };
  railTitle: string;
  rail: { color: string; title: string; meta: string }[];
  operator: string;
}
