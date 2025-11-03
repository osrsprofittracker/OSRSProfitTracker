import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import MainApp from './MainApp';
import UpdatePassword from './components/UpdatePassword';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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
      <div style={{
        minHeight: '100vh',
        background: 'rgb(15, 23, 42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  // Show password update form if user is recovering password
  if (isPasswordRecovery) {
    return <UpdatePassword onComplete={() => setIsPasswordRecovery(false)} />;
  }

  // If not logged in, show login page
  // If logged in, show main app
  return session ? <MainApp session={session} /> : <Auth />;
}