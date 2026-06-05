import { useEffect, useState } from 'react';
import type { ScreenId, Role, AuthFeel } from './types'; // AuthFeel kept for data-auth attribute
import { ROLES } from './data';
import { supabase } from './lib/supabase';
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

  // Handle Supabase auth events — covers both the OTP path and the
  // magic-link / confirmation-link path (link click sets a session
  // automatically, which fires SIGNED_IN here).
  useEffect(() => {
    // Check immediately on mount — covers the confirmation-link redirect case where
    // Supabase exchanges the ?code= param and establishes a session before our
    // onAuthStateChange listener is registered.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setScreen(prev =>
          prev === 'verify' || prev === 'signup' ? 'onboarding' : 'dashboard'
        );
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setScreen(prev =>
          prev === 'verify' || prev === 'signup' ? 'onboarding' : 'dashboard'
        );
      }
      if (event === 'SIGNED_OUT') {
        setScreen('signin');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
