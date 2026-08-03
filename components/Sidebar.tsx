'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  User,
  Zap,
  LogOut,
  Settings,
  GitBranch,
} from 'lucide-react'
import EventZoneLogo from './EventZoneLogo'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; job_title?: string } | null>(null)

  useEffect(() => {
    let channel: any

    const fetchProfileAndListen = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, job_title')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)

      // Listen for crm_token refresh in mobile app -> instantly log out CRM session
      channel = supabase
        .channel(`crm-token-monitor-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          async (payload: any) => {
            if (
              payload.new &&
              payload.old &&
              payload.new.crm_token !== payload.old.crm_token
            ) {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }
          }
        )
        .subscribe()
    }

    fetchProfileAndListen()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '4px 0' }}>
        <EventZoneLogo height={34} showCrm={true} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item) ? 'active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
            ) : (
              initials
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.full_name || 'Loading…'}</div>
            <div className="sidebar-user-role">{profile?.job_title || 'Member'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
