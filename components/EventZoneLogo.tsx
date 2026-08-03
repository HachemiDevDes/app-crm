import React from 'react'

interface EventZoneLogoProps {
  height?: number
  showCrm?: boolean
  className?: string
}

export default function EventZoneLogo({ height = 36, showCrm = true, className }: EventZoneLogoProps) {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Official White EventZone Logo Image */}
      <img
        src="/eventzone_logo.png"
        alt="EventZone Logo"
        style={{
          height: height,
          width: 'auto',
          filter: 'brightness(0) invert(1)',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showCrm && (
        <span
          style={{
            fontFamily: "var(--font-sans), 'Space Grotesk', sans-serif",
            fontSize: Math.round(height * 0.48),
            fontWeight: 800,
            color: '#1A73E8',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginLeft: 2,
          }}
        >
          CRM
        </span>
      )}
    </div>
  )
}
