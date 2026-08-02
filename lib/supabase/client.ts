import { createBrowserClient } from '@supabase/ssr'

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awkreadldqmidcrrqukm.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a3JlYWRsZHFtaWRjcnJxdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDY2MzgsImV4cCI6MjA5ODE4MjYzOH0.OuXsk83gk4b9IUkS5K_cwCcM2u0JYUv6m-H4V5H8P5E'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
