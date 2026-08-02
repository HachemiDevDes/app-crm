'use client'

import Link from 'next/link'
import { Users, UserPlus, Zap, TrendingUp, ArrowRight } from 'lucide-react'

interface Props {
  total: number
  newThisWeek: number
  newContacts: number
  recent: any[]
  profile: any
}

function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}

export default function DashboardClient({ total, newThisWeek, newContacts, recent, profile }: Props) {
  const stats = [
    {
      label: 'Total Contacts',
      value: total,
      icon: Users,
      color: 'purple',
      change: `+${newThisWeek} this week`,
      changeDir: 'up',
    },
    {
      label: 'New This Week',
      value: newThisWeek,
      icon: UserPlus,
      color: 'green',
      change: 'since last week',
      changeDir: 'up',
    },
    {
      label: 'New & Unreviewed',
      value: newContacts,
      icon: Zap,
      color: 'yellow',
      change: 'awaiting review',
      changeDir: 'up',
    },
    {
      label: 'Network Growth',
      value: total > 0 ? `${Math.round((newThisWeek / Math.max(total, 1)) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'blue',
      change: 'weekly rate',
      changeDir: 'up',
    },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()},{' '}
            {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="page-subtitle">
            Here's an overview of your EventZone network
          </p>
        </div>
        <Link href="/dashboard/contacts">
          <button className="btn btn-primary">
            <UserPlus size={16} />
            Add Contact
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>
                <Icon size={20} />
              </div>
              <div className="stat-body">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className={`stat-change ${s.changeDir}`}>{s.change}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Contacts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Recent Contacts</h2>
        <Link href="/dashboard/contacts" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-light)', fontWeight: 500 }}>
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📇</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            No contacts yet
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Start networking at events or add contacts manually.
          </p>
          <Link href="/dashboard/contacts">
            <button className="btn btn-primary btn-sm">Go to Contacts</button>
          </Link>
        </div>
      ) : (
        <div className="recent-grid">
          {recent.map((c: any) => (
            <Link href="/dashboard/contacts" key={c.id} style={{ textDecoration: 'none' }}>
              <div className="recent-contact-card">
                <div className="contact-avatar">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.name} />
                  ) : (
                    getInitials(c.name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="contact-name" style={{ fontSize: 13 }}>{c.name}</div>
                  <div className="contact-email">{c.title || c.company || '—'}</div>
                </div>
                {c.is_new && <span className="badge badge-new">New</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
