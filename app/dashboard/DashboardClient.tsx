'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, UserPlus, Zap, TrendingUp, ArrowRight, Flame, PenLine, ScanLine, FileEdit, X } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [goals, setGoals] = useState({
    daily: profile?.networking_goals?.daily || '',
    weekly: profile?.networking_goals?.weekly || '',
    monthly: profile?.networking_goals?.monthly || '',
    yearly: profile?.networking_goals?.yearly || '',
  })
  const [isSavingGoals, setIsSavingGoals] = useState(false)

  const handleSaveGoals = async () => {
    setIsSavingGoals(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ networking_goals: goals }).eq('id', profile.id)
    setIsSavingGoals(false)
    setShowGoalsModal(false)
    router.refresh()
  }

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

  // Advanced Analytics Variables
  let qrCount = 0
  let manualCount = 0
  const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
  const daysOfWeek = [
    { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 }
  ]
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5] // JS getDay() 0=Sun -> maps to 6 (Sun). 1=Mon -> maps to 0 (Mon).
  const companyCounts: Record<string, number> = {}
  const uniqueDates = new Set<string>()

  allConnections.forEach(c => {
    // Pipeline
    const stage = c.pipeline_stage || loadedStages[0]
    if (stageCounts[stage] !== undefined) stageCounts[stage]++

    // Source
    if (c.source?.toLowerCase().includes('qr') || c.source?.toLowerCase().includes('scan')) {
      qrCount++
    } else {
      manualCount++
    }

    // Dates & Times
    if (c.created_at) {
      const d = new Date(c.created_at)
      uniqueDates.add(d.toLocaleDateString())

      const h = d.getHours()
      if (h >= 6 && h < 12) timeOfDay.Morning++
      else if (h >= 12 && h < 17) timeOfDay.Afternoon++
      else if (h >= 17 && h < 21) timeOfDay.Evening++
      else timeOfDay.Night++

      daysOfWeek[dayIndexMap[d.getDay()]].value++
    }

    // Companies
    if (c.company) {
      companyCounts[c.company] = (companyCounts[c.company] || 0) + 1
    }
  })

  // Streak Calculation
  let streak = 0
  let currentDate = new Date()
  while (true) {
    if (uniqueDates.has(currentDate.toLocaleDateString())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (streak === 0 && new Date().toLocaleDateString() === currentDate.toLocaleDateString()) {
      // Check yesterday if no connection today yet
      currentDate.setDate(currentDate.getDate() - 1)
      if (uniqueDates.has(currentDate.toLocaleDateString())) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    } else {
      break
    }
  }

  // Chart Data Preparation
  const pipelineData = Object.keys(stageCounts).map(key => ({ name: key, value: stageCounts[key] }))
  const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#06b6d4', '#ec4899']
  const stageColors: Record<string, string> = {}
  loadedStages.forEach((s: string, i: number) => { stageColors[s] = DEFAULT_COLORS[i % DEFAULT_COLORS.length] })

  const timelineData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = allConnections.filter(c => c.created_at?.startsWith(dateStr)).length
    timelineData.push({ name: shortDate, Contacts: count })
  }

  const sourcesData = [
    { name: 'QR Code', value: qrCount, color: '#1A73E8' },
    { name: 'Manual Entry', value: manualCount, color: '#D946EF' }
  ].filter(d => d.value > 0)

  const timeOfDayData = [
    { name: 'Morning', value: timeOfDay.Morning },
    { name: 'Afternoon', value: timeOfDay.Afternoon },
    { name: 'Evening', value: timeOfDay.Evening },
    { name: 'Night', value: timeOfDay.Night },
  ]

  const topCompaniesData = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, value]) => ({ name, value }))
  const maxCompanyValue = topCompaniesData.length > 0 ? topCompaniesData[0].value : 1

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

      {/* Mobile-Style Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '32px' }}>
        
        {/* Streak & Goals Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Flame size={24} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Connection Streak</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Consecutive days networking</div>
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{streak}</div>
          </div>

          <div className="card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Networking Goals</div>
              <button onClick={() => setShowGoalsModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <PenLine size={16} />
              </button>
            </div>
            {!(goals.daily || goals.weekly || goals.monthly || goals.yearly) ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                No goals set. Tap the edit icon to set your daily, weekly, monthly, or yearly goals!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {goals.daily && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Daily</span>
                    <span style={{ fontWeight: 600 }}>{goals.daily}</span>
                  </div>
                )}
                {goals.weekly && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Weekly</span>
                    <span style={{ fontWeight: 600 }}>{goals.weekly}</span>
                  </div>
                )}
                {goals.monthly && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly</span>
                    <span style={{ fontWeight: 600 }}>{goals.monthly}</span>
                  </div>
                )}
                {goals.yearly && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Yearly</span>
                    <span style={{ fontWeight: 600 }}>{goals.yearly}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Sources */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Contact Sources</h3>
          {sourcesData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={(props: any) => {
                      const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                          {value}
                        </text>
                      );
                    }}
                  >
                    {sourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '120px' }}>
                {sourcesData.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Scan vs Manual</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <ScanLine size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{qrCount}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Scans</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <FileEdit size={24} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{manualCount}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manual</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time of Day & Companies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', height: '220px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Networking Time-of-Day</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" fill="#1A73E8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Top Companies</h3>
            {topCompaniesData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topCompaniesData.map((company, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{company.name}</span>
                      <span style={{ fontWeight: 600 }}>{company.value}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(company.value / maxCompanyValue) * 100}%`, height: '100%', background: '#D946EF', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No companies logged yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Advanced Line/Bar Charts Row */}
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

        {/* Pipeline Distribution & Busiest Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>{dict.deals_pipeline || 'Deals Pipeline'}</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stageColors[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card" style={{ padding: '24px', flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Busiest Networking Days</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daysOfWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" fill="#1A73E8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Contacts List */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{dict.recent_contacts || 'Recent Contacts'}</h3>
            <Link href="/dashboard/contacts" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-light)', fontWeight: 500 }}>
              {dict.view_all || 'View all'} <ArrowRight size={14} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📇</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {dict.no_contacts || 'No contacts yet'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                {dict.start_networking || 'Start networking at events or add contacts manually.'}
              </p>
              <Link href="/dashboard/contacts">
                <button className="btn btn-primary btn-sm">{dict.go_to_contacts || 'Go to Contacts'}</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {recent.map((c: any) => (
                <Link href="/dashboard/contacts" key={c.id} style={{ textDecoration: 'none' }}>
                  <div className="recent-contact-card" style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="contact-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} />
                      ) : (
                        getInitials(c.name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="contact-name" style={{ fontSize: 13 }}>{c.name}</div>
                      <div className="contact-email" style={{ fontSize: 11 }}>{c.title || c.company || '—'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-elevated)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Set Networking Goals</h2>
              <button onClick={() => setShowGoalsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Leave a field empty to disable that goal.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Daily:</label>
                <input 
                  type="number" 
                  value={goals.daily}
                  onChange={(e) => setGoals({...goals, daily: e.target.value})}
                  placeholder="Number of connections" 
                  className="input" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Weekly:</label>
                <input 
                  type="number" 
                  value={goals.weekly}
                  onChange={(e) => setGoals({...goals, weekly: e.target.value})}
                  placeholder="Number of connections" 
                  className="input" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Monthly:</label>
                <input 
                  type="number" 
                  value={goals.monthly}
                  onChange={(e) => setGoals({...goals, monthly: e.target.value})}
                  placeholder="Number of connections" 
                  className="input" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Yearly:</label>
                <input 
                  type="number" 
                  value={goals.yearly}
                  onChange={(e) => setGoals({...goals, yearly: e.target.value})}
                  placeholder="Number of connections" 
                  className="input" 
                  style={{ width: '100%' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowGoalsModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveGoals} className="btn btn-primary" disabled={isSavingGoals}>
                {isSavingGoals ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
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
