import { useState } from 'react';
import type { ScreenId, Role, AuthFeel } from './types'; // AuthFeel kept for data-auth attribute
import { ROLES } from './data';
import { SignUp } from './components/screens/SignUp';
import { SignIn } from './components/screens/SignIn';
import { Verify } from './components/screens/Verify';
import { Onboarding } from './components/screens/Onboarding';
import { Dashboard } from './components/screens/Dashboard';
import { Connect } from './components/screens/Connect';
import { Operate } from './components/screens/Operate';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('signup');
  const [role, setRole] = useState<Role>('student');
  const [authFeel] = useState<AuthFeel>('warm');
  const [pendingEmail, setPendingEmail] = useState('');
  const profile = ROLES[role];

  return (
    <div className="app" data-auth={authFeel}>
      <div className="screens">
        <SignUp isActive={screen === 'signup'} role={role} onNavigate={setScreen} onRoleChange={setRole} onPendingEmail={setPendingEmail} />
        <SignIn isActive={screen === 'signin'} onNavigate={setScreen} onPendingEmail={setPendingEmail} />
        <Verify isActive={screen === 'verify'} email={pendingEmail} onNavigate={setScreen} />
        <Onboarding isActive={screen === 'onboarding'} role={role} profile={profile} onNavigate={setScreen} />
        <Dashboard isActive={screen === 'dashboard'} profile={profile} onNavigate={setScreen} />
        <Connect isActive={screen === 'connect'} profile={profile} onNavigate={setScreen} />
        <Operate isActive={screen === 'operate'} onNavigate={setScreen} />
      </div>
    </div>
  );
}
