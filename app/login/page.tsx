'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client'
import { Zap, ArrowRight, Monitor, Check } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '')
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter your 8-character login code')
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
        setError(data.error || 'Invalid or expired login code. Please check your app.')
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

        {/* ── Left Side: Pure White & Crisp Code Login Form ── */}
        <div className="login-form-side">

          {/* Logo Branding */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Zap size={20} color="white" />
            </div>
            <span className="login-brand-name">EventZone CRM</span>
          </div>

          {/* Heading */}
          <h1 className="login-heading">
            Welcome to our CRM.<br />Enter your code to start.
          </h1>
          <p className="login-subheading">
            Enter your unique 8-character desktop CRM code from the EventZone mobile app to log in instantly.
          </p>

          {error && <div className="login-error-msg">{error}</div>}

          {/* Code Input Form */}
          <form onSubmit={handleCodeLogin}>
            <div className="login-code-input-wrap">
              <label className="login-code-label">Desktop CRM Code</label>
              <input
                type="text"
                className="login-code-field"
                placeholder="XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={9}
                autoComplete="off"
                autoFocus
                spellCheck={false}
              />
            </div>

            {/* Mobile App Helper Box */}
            <div className="login-helper-box">
              <Monitor size={18} className="login-helper-icon" />
              <p className="login-helper-text">
                Open <strong>EventZone app</strong> on your phone &rarr; <strong>Settings</strong> &rarr; <strong>Desktop CRM</strong> to view or refresh your code.
              </p>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-submit-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#ffffff', borderTopColor: 'transparent' }} />
                  Verifying Code…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* ── Right Side: Rich Purple Hero Illustration ── */}
        <div className="login-hero-side">
          <div className="login-hero-card">
            <img src="/crm_hero.jpg" alt="EventZone CRM Illustration" />
          </div>

          <div className="login-hero-text-wrap">
            <h2 className="login-hero-text-title">EventZone CRM</h2>
            <p className="login-hero-text-desc">
              Manage, organize, and export your event network contacts seamlessly across mobile and desktop.
            </p>

            <div className="login-hero-bullets">
              <div className="login-hero-bullet-item">
                <div className="login-hero-bullet-icon"><Check size={11} color="white" /></div>
                Realtime mobile & desktop sync
              </div>
              <div className="login-hero-bullet-item">
                <div className="login-hero-bullet-icon"><Check size={11} color="white" /></div>
                One-click CSV / Excel export
              </div>
              <div className="login-hero-bullet-item">
                <div className="login-hero-bullet-icon"><Check size={11} color="white" /></div>
                Passwordless 1-step code authentication
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
