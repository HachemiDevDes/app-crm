'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client'
import { ArrowRight, Monitor } from 'lucide-react'
import EventZoneLogo from '@/components/EventZoneLogo'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    const rotateX = (-y / rect.height) * 2.5
    const rotateY = (x / rect.width) * 2.5

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`
  }

  const performAuth = async (rawCode: string) => {
    setLoading(true)
    setError(null)

    const cleanCode = rawCode.trim().toUpperCase()
    if (cleanCode.length < 8) {
      setError('Please enter all 8 characters of your login code')
      setLoading(false)
      return
    }

    // Format XXXX-XXXX for server API query
    const formattedCode = `${cleanCode.slice(0, 4)}-${cleanCode.slice(4, 8)}`

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/crm-token-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token: formattedCode }),
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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (raw.length <= 8) {
      setCode(raw)
      if (raw.length === 8) {
        performAuth(raw)
      }
    }
  }

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    performAuth(code)
  }

  return (
    <div className="login-page">
      {/* 3D Ambient Orbs */}
      <div className="ag-orb ag-orb-1" />
      <div className="ag-orb ag-orb-2" />
      <div className="ag-orb ag-orb-3" />

      {/* 3D Tilt Spatial Container */}
      <div
        ref={cardRef}
        className="ag-split-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >

        {/* ── Left Panel: Form ── */}
        <div className="ag-form-side">

          {/* Official EventZone Horizontal Logo */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'flex-start' }}>
            <EventZoneLogo height={24} showCrm={true} />
          </div>

          {/* Heading */}
          <h1 className="ag-heading">
            Link your device
          </h1>
          <p className="ag-subheading">
            Enter the 8-character code from your mobile app.
          </p>

          {error && <div className="ag-error-msg">{error}</div>}

          {/* Code Input Form */}
          <form onSubmit={handleCodeLogin} style={{ transform: 'translateZ(20px)' }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div className="ag-slots-container">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const val = code[idx] || ''
                  const isActive = idx === code.length
                  const isLastFilled = idx === code.length - 1 && code.length === 8
                  
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={`ag-slot ${val ? 'filled' : ''} ${isActive ? 'active' : ''} ${isLastFilled ? 'active' : ''}`}>
                        {val}
                      </div>
                      {idx === 3 && <span className="ag-slot-dash">-</span>}
                    </div>
                  )
                })}
              </div>

              {/* Hidden input overlay for native mobile keyboard input */}
              <div style={{ position: 'absolute', inset: 0 }}>
                <input
                  ref={inputRef}
                  type="text"
                  className="ag-hidden-input"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={8}
                  autoComplete="off"
                  autoFocus
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Simple, spacious caption instead of heavy helper box */}
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5, marginTop: 12, marginBottom: 28 }}>
              Open <strong>EventZone app</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Desktop CRM</strong> to view your code.
            </p>

            {/* Submit Button */}
            <button type="submit" className="ag-submit-btn" disabled={loading || code.length < 8}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#ffffff', borderTopColor: 'transparent' }} />
                  Verifying Code…
                </>
              ) : (
                <>
                  Authenticate <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* ── Right Panel: Spatial 3D Hero ── */}
        <div className="ag-hero-side">
          <div className="ag-hero-bg-grid" />

          <div className="ag-hero-card" style={{ transform: 'translateZ(40px) rotateY(-4deg) rotateX(2deg)' }}>
            <img src="/crm_hero.jpg" alt="EventZone Antigravity Illustration" />
          </div>
        </div>

      </div>
    </div>
  )
}
