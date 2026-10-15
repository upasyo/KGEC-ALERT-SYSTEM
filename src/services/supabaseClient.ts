import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
// Users can provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables or configure them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase Phone OTP Authentication helper
 */
export async function signInWithSupabasePhone(phoneNumber: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  });
  if (error) throw error;
  return data;
}

export async function verifySupabaseOtp(phoneNumber: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
}
