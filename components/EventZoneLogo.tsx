import React from 'react'

interface EventZoneLogoProps {
  height?: number
  showCrm?: boolean
  className?: string
}

export default function EventZoneLogo({ height = 40, showCrm = true, className }: EventZoneLogoProps) {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {/* Official EventZone Icon Mark */}
      <div
        style={{
          height: height,
          width: height,
          borderRadius: Math.round(height * 0.28),
          background: 'linear-gradient(135deg, #001029 0%, #00388F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0, 56, 143, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 1981 1981"
          style={{ width: '62%', height: '62%' }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M827.957 518.918H560.168V786.707V1504H827.957V786.707H1191.39V1504H1459.17V786.707H1191.39V518.918H827.957Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Official Horizontal Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-sans), 'Space Grotesk', sans-serif",
            fontSize: Math.round(height * 0.55),
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          EventZone
        </span>
        {showCrm && (
          <span
            style={{
              fontFamily: "var(--font-sans), 'Space Grotesk', sans-serif",
              fontSize: Math.round(height * 0.42),
              fontWeight: 700,
              color: '#1A73E8',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            CRM
          </span>
        )}
      </div>
    </div>
  )
}
