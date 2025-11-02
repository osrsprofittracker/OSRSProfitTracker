import * as Sentry from "@sentry/react";
import { supabase } from './supabase';

export async function logError(error, context = {}) {
  // Log to Sentry
  Sentry.captureException(error, {
    extra: context
  });

  // Also log to your own database (optional)
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