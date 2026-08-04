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
import LanguageToggle from './LanguageToggle'

export default function Sidebar({ dict = {} }: { dict?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; job_title?: string } | null>(null)

  const NAV_ITEMS = [
    { href: '/dashboard', label: dict.dashboard || 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/contacts', label: dict.contacts || 'Contacts', icon: Users },
    { href: '/dashboard/pipeline', label: dict.pipeline || 'Pipeline', icon: GitBranch },
    { href: '/dashboard/profile', label: dict.my_profile || 'My Profile', icon: User },
  ]

  useEffect(() => {
    let channel: any

    const fetchProfileAndListen = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, job_title, crm_token')
        .eq('id', user.id)
        .single()
      
      let currentCrmToken = data?.crm_token

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
            // Only trigger logout if the new payload has a crm_token and it differs from the one we loaded
            if (
              payload.new && 
              payload.new.crm_token !== undefined && 
              payload.new.crm_token !== currentCrmToken
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

  const isActive = (item: any) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <EventZoneLogo height={20} showCrm={false} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{dict.menu || 'MENU'}</div>
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
            <span>{dict.logout || 'Logout'}</span>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
