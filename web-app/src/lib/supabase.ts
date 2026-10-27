// ==============================================================================
// HOW WE SPEAK — SHARED SUPABASE CLIENT INITIALIZATION
// Production Supabase project: yzodegkrcbjevxurhanc
// Client-safe configuration: Uses public project URL and publishable/anon key.
// Never exposes service_role key to client bundles.
// ==============================================================================

import { createClient } from '@supabase/supabase-js'

// Official TryHowWeSpeak production Supabase credentials (public/anon)
const PRODUCTION_SUPABASE_URL = 'https://yzodegkrcbjevxurhanc.supabase.co'
const PRODUCTION_SUPABASE_ANON_KEY = 'sb_publishable_us6bwKSn7m3czRxMku--uw_Gli6d9oq'

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  PRODUCTION_SUPABASE_URL
).trim()

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  PRODUCTION_SUPABASE_ANON_KEY
).trim()

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'hws-auth-token',
    },
  }
)
