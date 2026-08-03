'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Hash, Monitor } from 'lucide-react'

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
        // Direct session — set it in the Supabase client
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
        // Redirect to magic link — Supabase handles auth
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
      {/* Background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={22} color="white" />
          </div>
          <div>
            <div className="login-logo-text">EventZone</div>
            <div className="login-logo-sub">CRM Platform</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-sm)',
          padding: 4,
          marginBottom: 28,
          border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={() => { setTab('email'); setError(null) }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: tab === 'email' ? 'var(--accent)' : 'transparent',
              color: tab === 'email' ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <Mail size={13} />
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setTab('code'); setError(null) }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: tab === 'code' ? 'var(--accent)' : 'transparent',
              color: tab === 'code' ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <Monitor size={13} />
            Login with Code
          </button>
        </div>

        {/* ── Email form ── */}
        {tab === 'email' && (
          <>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in with your EventZone account</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8, padding: '11px 18px' }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}

        {/* ── Code form ── */}
        {tab === 'code' && (
          <>
            <h1 className="login-title">Login with Code</h1>
            <p className="login-subtitle">
              Find your code in the EventZone app → Settings → Desktop CRM
            </p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleCodeLogin}>
              <div className="form-group">
                <label className="form-label">Your login code</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: 36,
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '4px',
                      textAlign: 'center',
                      textTransform: 'uppercase',
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

              {/* Visual hint */}
              <div style={{
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <Monitor size={15} style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Open the <strong style={{ color: 'var(--text-primary)' }}>EventZone app</strong> on your phone →{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> →{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Desktop CRM</strong> to find your code.
                </p>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '11px 18px' }}>
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Verifying…</>
                  : <>Login with Code <ArrowRight size={16} /></>
                }
              </button>
            </form>
          </>
        )}

        <p className="login-footer" style={{ marginTop: 20 }}>
          {tab === 'email'
            ? 'Use the same credentials as the EventZone app'
            : 'Your code is unique and refreshable from the app'}
        </p>
      </div>
    </div>
  )
}
