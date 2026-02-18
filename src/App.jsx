import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import MainApp from './MainApp';
import UpdatePassword from './components/UpdatePassword';
import LandingPage from './pages/LandingPage';
import './styles/components.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_IN') {
        setSession(session);
        setIsPasswordRecovery(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsPasswordRecovery(false);
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    );
  }

  // Show password update form if user is recovering password
  if (isPasswordRecovery) {
    return <UpdatePassword onComplete={() => setIsPasswordRecovery(false)} />;
  }


  // At the bottom, replace the return statement with:
  if (!session) {
    return showLanding ? (
      <LandingPage onGetStarted={() => setShowLanding(false)} />
    ) : (
      <Auth onBack={() => setShowLanding(true)} />
    );
  }

  return <MainApp session={session} onLogout={() => setShowLanding(false)} />;

}