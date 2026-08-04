'use client'

import Link from 'next/link'
import { Users, UserPlus, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

interface Props {
  total: number
  newThisWeek: number
  newContacts: number
  recent: any[]
  profile: any
  allConnections?: any[]
  dict?: any
}

function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}

export default function DashboardClient({ total, newThisWeek, newContacts, recent, profile, allConnections = [], dict = {} }: Props) {
  const stats = [
    {
      label: dict.total_contacts || 'Total Contacts',
      value: total,
      icon: Users,
      color: 'purple',
      change: `+${newThisWeek} ${dict.this_week || 'this week'}`,
      changeDir: 'up',
    },
    {
      label: dict.new_this_week || 'New This Week',
      value: newThisWeek,
      icon: UserPlus,
      color: 'green',
      change: dict.since_last_week || 'since last week',
      changeDir: 'up',
    },
    {
      label: dict.new_unreviewed || 'New & Unreviewed',
      value: newContacts,
      icon: Zap,
      color: 'yellow',
      change: dict.awaiting_review || 'awaiting review',
      changeDir: 'up',
    },
    {
      label: dict.network_growth || 'Network Growth',
      value: total > 0 ? `${Math.round((newThisWeek / Math.max(total, 1)) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'blue',
      change: dict.weekly_rate || 'weekly rate',
      changeDir: 'up',
    },
  ]

  // Pipeline Data
  const loadedStages = profile?.pipeline_stages || ['New', 'Contacted', 'Proposal', 'Won', 'Lost']
  const stageCounts: Record<string, number> = {}
  loadedStages.forEach((s: string) => stageCounts[s] = 0)

  allConnections.forEach(c => {
    const stage = c.pipeline_stage || loadedStages[0]
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++
    }
  })
  
  const pipelineData = Object.keys(stageCounts).map(key => ({
    name: key,
    value: stageCounts[key]
  }))

  const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#06b6d4', '#ec4899']
  const stageColors: Record<string, string> = {}
  loadedStages.forEach((s: string, i: number) => {
    stageColors[s] = DEFAULT_COLORS[i % DEFAULT_COLORS.length]
  })

  // Timeline Data (Last 7 Days)
  const timelineData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = allConnections.filter(c => c.created_at?.startsWith(dateStr)).length
    timelineData.push({ name: shortDate, Contacts: count })
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {dict.good || 'Good'} {dict[getGreeting()] || getGreeting()},{' '}
            {profile?.full_name?.split(' ')[0] || dict.there || 'there'} 👋
          </h1>
          <p className="page-subtitle">
            {dict.subtitle || "Here's an overview of your EventZone network"}
          </p>
        </div>
        <Link href="/dashboard/contacts">
          <button className="btn btn-primary">
            <UserPlus size={16} />
            {dict.add_contact || 'Add Contact'}
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
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{dict.recent_contacts || 'Recent Contacts'}</h2>
        <Link href="/dashboard/contacts" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-light)', fontWeight: 500 }}>
          {dict.view_all || 'View all'} <ArrowRight size={14} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📇</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {dict.no_contacts || 'No contacts yet'}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            {dict.start_networking || 'Start networking at events or add contacts manually.'}
          </p>
          <Link href="/dashboard/contacts">
            <button className="btn btn-primary btn-sm">{dict.go_to_contacts || 'Go to Contacts'}</button>
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

      {/* Analytics Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '32px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{dict.network_analytics || 'Network Analytics'}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Connections Over Time */}
        <div className="card" style={{ padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>{dict.connections_chart || 'Connections (Last 7 Days)'}</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="Contacts" stroke="#1A73E8" strokeWidth={3} fillOpacity={1} fill="url(#colorContacts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="card" style={{ padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>{dict.deals_pipeline || 'Deals Pipeline'}</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={stageColors[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
