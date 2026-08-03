'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/client'
import { Zap, ArrowRight, Monitor, Check } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 3D Card Perspective Tilt
  const cardRef = useRef<HTMLDivElement>(null)

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (raw.length <= 8) {
      setCode(raw)
    }
  }

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanCode = code.trim().toUpperCase()
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

  // Parse raw code for 8 slots
  const chars = code.split('')
  const slotIndices = [0, 1, 2, 3, 4, 5, 6, 7]

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

          {/* Logo */}
          <div className="ag-brand">
            <div className="ag-brand-icon">
              <Zap size={22} color="white" />
            </div>
            <span className="ag-brand-name">EventZone CRM</span>
          </div>

          {/* Heading */}
          <h1 className="ag-heading">
            Antigravity CRM.<br />Enter your code.
          </h1>
          <p className="ag-subheading">
            Enter your 8-character desktop code from the EventZone mobile app to log in instantly.
          </p>

          {error && <div className="ag-error-msg">{error}</div>}

          {/* Code Input Form */}
          <form onSubmit={handleCodeLogin}>

            <div style={{ position: 'relative', marginBottom: 24 }}>

              {/* Segmented Glass Character Slots */}
              <div className="ag-slots-container">
                {/* First 4 Slots */}
                {slotIndices.slice(0, 4).map((idx) => {
                  const char = chars[idx] || ''
                  const isFilled = char !== ''
                  const isActive = code.length === idx
                  return (
                    <div
                      key={idx}
                      className={`ag-slot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}`}
                    >
                      {char}
                    </div>
                  )
                })}

                <div className="ag-slot-dash">-</div>

                {/* Last 4 Slots */}
                {slotIndices.slice(4, 8).map((idx) => {
                  const char = chars[idx] || ''
                  const isFilled = char !== ''
                  const isActive = code.length === idx
                  return (
                    <div
                      key={idx}
                      className={`ag-slot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}`}
                    >
                      {char}
                    </div>
                  )
                })}

                {/* Hidden Real Input covering the slots area */}
                <input
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

            {/* Helper Card */}
            <div className="ag-helper-box">
              <Monitor size={18} className="ag-helper-icon" />
              <p className="ag-helper-text">
                Open <strong>EventZone app</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Desktop CRM</strong> to view or refresh your code.
              </p>
            </div>

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

          <div className="ag-hero-card">
            <img src="/crm_hero.jpg" alt="EventZone Antigravity Illustration" />
          </div>

          <div className="ag-hero-text-wrap">
            <h2 className="ag-hero-title">EventZone CRM</h2>
            <p className="ag-hero-desc">
              Weightless, spatial contact management synced across mobile & desktop.
            </p>

            <div className="ag-hero-bullets">
              <div className="ag-hero-bullet-item">
                <div className="ag-hero-bullet-icon"><Check size={11} color="white" /></div>
                Realtime mobile & desktop sync
              </div>
              <div className="ag-hero-bullet-item">
                <div className="ag-hero-bullet-icon"><Check size={11} color="white" /></div>
                One-click CSV & Excel export
              </div>
              <div className="ag-hero-bullet-item">
                <div className="ag-hero-bullet-icon"><Check size={11} color="white" /></div>
                Passwordless code authentication
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
