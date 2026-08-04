'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

export default function LanguageToggle() {
  const router = useRouter()
  const [lang, setLang] = useState('en')

  useEffect(() => {
    // Read the cookie on mount
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'))
    if (match && match[2]) {
      setLang(match[2])
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'fr' : 'en'
    setLang(newLang)
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`
    // Refresh the router to reload server components with the new cookie
    router.refresh()
  }

  return (
    <button
      onClick={toggleLanguage}
      className="lang-toggle-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      <Globe size={16} />
      <span style={{ minWidth: '22px', textAlign: 'center' }}>
        {lang.toUpperCase()}
      </span>
    </button>
  )
}
