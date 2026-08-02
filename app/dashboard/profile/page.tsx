'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Save, Plus, Trash2, Globe, Link2, AtSign, Image, Phone, Mail } from 'lucide-react'

// ─── Social platform config ───────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',   icon: Link2,    placeholder: 'https://linkedin.com/in/yourname' },
  { id: 'twitter',   label: 'Twitter/X',  icon: AtSign,   placeholder: 'https://x.com/yourname' },
  { id: 'instagram', label: 'Instagram',  icon: Image,    placeholder: 'https://instagram.com/yourname' },
  { id: 'website',   label: 'Website',    icon: Globe,    placeholder: 'https://yourwebsite.com' },
  { id: 'phone',     label: 'Phone',      icon: Phone,    placeholder: '+1 555 000 0000' },
  { id: 'email',     label: 'Email',      icon: Mail,     placeholder: 'contact@email.com' },
]

function getInitials(name: string) {
  return (name || '').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' ? '✓' : '✗'} {message}
      </div>
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────
export default function ProfilePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [whatImLookingFor, setWhatImLookingFor] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [industries, setIndustries] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [socials, setSocials] = useState<{ platform: string; value: string }[]>([])
  const [industriesText, setIndustriesText] = useState('')
  const [interestsText, setInterestsText] = useState('')

  // Load profile
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setEmail(user.email || '')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || '')
        setJobTitle(data.job_title || '')
        setCompanyName(data.company_name || '')
        setPhone(data.phone || '')
        setBio(data.bio || '')
        setWhatImLookingFor(data.what_im_looking_for || '')
        setAvatarUrl(data.avatar_url || null)
        setIndustries(data.industries || [])
        setInterests(data.interests || [])
        setIndustriesText((data.industries || []).join(', '))
        setInterestsText((data.interests || []).join(', '))

        // Parse socials from metadata
        const meta = data.metadata || {}
        const socialsList: { platform: string; value: string }[] = Array.isArray(meta.socials)
          ? meta.socials
          : []
        setSocials(socialsList)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setToast({ msg: 'Avatar upload failed', type: 'error' }); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setToast({ msg: 'Avatar updated!', type: 'success' })
    setUploading(false)
  }

  // Save profile
  const handleSave = async () => {
    setSaving(true)

    const newIndustries = industriesText.split(',').map((s) => s.trim()).filter(Boolean)
    const newInterests = interestsText.split(',').map((s) => s.trim()).filter(Boolean)

    // Build metadata socials shortcuts
    const metaSocials: Record<string, string> = {}
    socials.forEach(({ platform, value }) => {
      if (value.trim()) metaSocials[platform.toLowerCase()] = value.trim()
    })

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      job_title: jobTitle,
      company_name: companyName,
      phone,
      bio,
      what_im_looking_for: whatImLookingFor,
      industries: newIndustries,
      interests: newInterests,
      metadata: {
        socials,
        ...metaSocials,
      },
    }).eq('id', userId)

    setSaving(false)
    if (error) {
      setToast({ msg: error.message, type: 'error' })
    } else {
      setToast({ msg: 'Profile saved successfully!', type: 'success' })
    }
  }

  // Socials helpers
  const updateSocial = (idx: number, value: string) => {
    setSocials((prev) => prev.map((s, i) => i === idx ? { ...s, value } : s))
  }
  const addSocial = (platform: string) => {
    if (socials.find((s) => s.platform === platform)) return
    setSocials((prev) => [...prev, { platform, value: '' }])
  }
  const removeSocial = (idx: number) => {
    setSocials((prev) => prev.filter((_, i) => i !== idx))
  }

  if (loading) {
    return (
      <div className="loading-wrap"><div className="spinner" /></div>
    )
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Changes sync instantly with the EventZone mobile app</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        {/* Left — Avatar & quick info */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar-preview" style={{ width: 100, height: 100, fontSize: 32, margin: '0 auto' }}>
                {avatarUrl ? <img src={avatarUrl} alt={fullName} /> : getInitials(fullName)}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: 'var(--accent)', border: '2px solid var(--bg-surface)',
                  borderRadius: '50%', width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                }}
                title="Change avatar"
              >
                {uploading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Camera size={14} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{fullName || 'Your Name'}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{jobTitle || 'Job Title'}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{companyName || 'Company'}</div>

          <hr className="divider" />

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
              Account
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 6 }}>📧 {email}</div>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div>
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Product Manager" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself…" />
            </div>
            <div className="form-group">
              <label className="form-label">What I'm Looking For</label>
              <textarea className="form-input" rows={2} value={whatImLookingFor} onChange={(e) => setWhatImLookingFor(e.target.value)} placeholder="Partnerships, investors, clients…" />
            </div>
          </div>

          {/* Industries & Interests */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Industries & Interests</h3>
            <div className="form-group">
              <label className="form-label">Industries (comma separated)</label>
              <input className="form-input" value={industriesText} onChange={(e) => setIndustriesText(e.target.value)} placeholder="Technology, Finance, Healthcare" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Interests / Tags (comma separated)</label>
              <input className="form-input" value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="AI, SaaS, Networking, Web3" />
            </div>
          </div>

          {/* Social Links */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Social Links</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              These appear on your profile in the app
            </p>

            {socials.map((s, idx) => {
              const platformCfg = SOCIAL_PLATFORMS.find((p) => p.id === s.platform)
              const Icon = platformCfg?.icon || Globe
              return (
                <div key={idx} className="social-item">
                  <Icon size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <span className="social-platform">{platformCfg?.label || s.platform}</span>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={platformCfg?.placeholder || 'Enter URL or value'}
                    value={s.value}
                    onChange={(e) => updateSocial(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeSocial(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {SOCIAL_PLATFORMS.filter((p) => !socials.find((s) => s.platform === p.id)).map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    className="btn btn-ghost btn-sm"
                    onClick={() => addSocial(p.id)}
                    style={{ gap: 6, fontSize: 12 }}
                  >
                    <Icon size={13} /> {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
