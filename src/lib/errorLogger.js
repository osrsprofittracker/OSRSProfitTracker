import { supabase } from './supabase';

export async function logError(error, context = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('error_logs').insert({
      error_message: error.message,
      error_stack: error.stack,
      user_id: user?.id || null,
      user_email: user?.email || null,
      context: context,
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason), {
      type: 'unhandledRejection',
      promise: true
    });
  });

  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}