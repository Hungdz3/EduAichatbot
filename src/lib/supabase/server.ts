import { 
  createRouteHandlerClient, 
  createServerComponentClient,
  createMiddlewareClient
} from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mgmenuzamkwrctcfxait.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWVudXphbWt3cmN0Y2Z4YWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzMzNjUsImV4cCI6MjA4OTc0OTM2NX0.fevOENz_q3xNQBYyj_4EQQiKxtw-IFN7jCysSazYZRM'

export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

export const createRouteClient = () => {
  return createRouteHandlerClient({ cookies }, {
    supabaseUrl,
    supabaseKey
  })
}

export const createServerComponentClientResilient = () => {
  return createServerComponentClient({ cookies }, {
    supabaseUrl,
    supabaseKey
  })
}

export const createMiddlewareClientResilient = (req: NextRequest, res: NextResponse) => {
  return createMiddlewareClient({ req, res }, {
    supabaseUrl,
    supabaseKey
  })
}
