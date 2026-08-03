'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Hash, Monitor, ShieldCheck, Users, RefreshCw } from 'lucide-react'

type Tab = 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('email')

  // ── Email/Password state ──
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Code state ──
  const [code, setCode] = useState('')

  // ── Shared state ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Email login ─────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // ─── Code login ──────────────────────────────────────────────────
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '')
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid login code')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/crm-token-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token: cleanCode }),
        }
      )

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Invalid login code. Please try again.')
        setLoading(false)
        return
      }

      if (data.type === 'session') {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        if (sessionErr) {
          setError('Session error: ' + sessionErr.message)
          setLoading(false)
          return
        }

        router.push('/dashboard')
        router.refresh()

      } else if (data.type === 'magic_link' && data.magic_link) {
        window.location.href = data.magic_link
      } else {
        setError('Unexpected response from server.')
        setLoading(false)
      }

    } catch (err) {
      setError('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-split-card">

        {/* ── Left Side: Form ── */}
        <div className="login-form-side">
          {/* Logo & Header */}
          <div className="login-header-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-accent)',
              }}>
                <Zap size={20} color="white" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>EventZone CRM</span>
            </div>

            <h1 className="login-title-bold">
              Welcome to our CRM.<br />Sign In to get started.
            </h1>
            <p className="login-subtitle-muted">
              Enter your details or Desktop CRM code to proceed further
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="login-tab-container">
            <button
              type="button"
              className={`login-tab-btn ${tab === 'email' ? 'active' : ''}`}
              onClick={() => { setTab('email'); setError(null) }}
            >
              <Mail size={14} />
              Email & Password
            </button>
            <button
              type="button"
              className={`login-tab-btn ${tab === 'code' ? 'active' : ''}`}
              onClick={() => { setTab('code'); setError(null) }}
            >
              <Monitor size={14} />
              Login with Code
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          {/* ── Email Form ── */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 40, height: 46 }}
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 40, paddingRight: 42, height: 46 }}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
                  : <>Sign In <ArrowRight size={16} /></>
                }
              </button>
            </form>
          )}

          {/* ── Code Form ── */}
          {tab === 'code' && (
            <form onSubmit={handleCodeLogin}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Enter your 8-character login code</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-light)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '5px',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: 'var(--accent-light)',
                    }}
                    placeholder="XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={9}
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Instructions Box */}
              <div style={{
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <Monitor size={16} style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Open the <strong style={{ color: 'var(--text-primary)' }}>EventZone app</strong> on your phone →{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> →{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Desktop CRM</strong> to find or refresh your unique code.
                </p>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying code…</>
                  : <>Login with Code <ArrowRight size={16} /></>
                }
              </button>
            </form>
          )}

          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            EventZone App Integration &bull; Instant Realtime Sync
          </div>
        </div>

        {/* ── Right Side: Hero Visual ── */}
        <div className="login-hero-side">
          <div className="login-hero-bg-wave" />

          <div className="login-hero-img-wrap">
            <img src="/crm_hero.jpg" alt="EventZone CRM Illustration" />
          </div>

          <div className="login-hero-content">
            <h2 className="login-hero-title">EventZone CRM Platform</h2>
            <p className="login-hero-sub">
              Seamlessly check, manage, and export your event network contacts from your phone or desktop.
            </p>

            <div className="login-hero-badges">
              <span className="login-hero-badge">⚡ Realtime Mobile Sync</span>
              <span className="login-hero-badge">📇 CSV & Excel Export</span>
              <span className="login-hero-badge">🔐 Code Login</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
