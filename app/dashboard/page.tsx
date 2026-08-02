import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch stats
  const [connectionsRes, profileRes] = await Promise.all([
    supabase
      .from('connections')
      .select('id, name, title, company, avatar_url, created_at, tags, source, is_new')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name, job_title, company_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  const connections = connectionsRes.data || []
  const profile = profileRes.data

  // Compute stats
  const total = connections.length
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newThisWeek = connections.filter((c: any) => c.created_at > oneWeekAgo).length
  const newContacts = connections.filter((c: any) => c.is_new).length
  const recent = connections.slice(0, 6)

  return (
    <DashboardClient
      total={total}
      newThisWeek={newThisWeek}
      newContacts={newContacts}
      recent={recent}
      profile={profile}
    />
  )
}
