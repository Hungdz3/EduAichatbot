import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createServerClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgmenuzamkwrctcfxait.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWVudXphbWt3cmN0Y2Z4YWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzMzNjUsImV4cCI6MjA4OTc0OTM2NX0.fevOENz_q3xNQBYyj_4EQQiKxtw-IFN7jCysSazYZRM'
  )
}
