'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search, UserPlus, Download, ChevronDown, X,
  Mail, Phone, Globe, MapPin, Tag, Trash2, FileText, Edit3
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Types ───────────────────────────────────────────────────────
interface Contact {
  id: string
  name: string
  title?: string
  company?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  tags?: string[]
  source?: string
  notes?: string
  avatar_url?: string
  is_new?: boolean
  created_at?: string
  linked_profile_id?: string
}

// ─── Helpers ──────────────────────────────────────────────────────
function getInitials(name: string) {
  return (name || '').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Add Contact Modal ────────────────────────────────────────────
function AddContactModal({ onClose, onSave, dict = {} }: { onClose: () => void; onSave: () => void; dict?: any }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    name: '', title: '', company: '', email: '',
    phone: '', website: '', address: '', notes: '', tags: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const { error: err } = await supabase.from('connections').insert({
      user_id: user.id,
      name: form.name.trim(),
      title: form.title.trim() || null,
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      tags,
      source: 'Manual (CRM)',
      is_new: false,
    })

    if (err) { setError(err.message); setSaving(false); return }
    onSave()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{dict.add_contact || 'Add Contact'}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{dict.full_name || 'Full Name'} *</label>
              <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">{dict.job_title || 'Job Title'}</label>
              <input className="form-input" placeholder="Product Manager" value={form.title} onChange={set('title')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{dict.company || 'Company'}</label>
              <input className="form-input" placeholder="Acme Corp" value={form.company} onChange={set('company')} />
            </div>
            <div className="form-group">
              <label className="form-label">{dict.email || 'Email'}</label>
              <input type="email" className="form-input" placeholder="jane@acme.com" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{dict.phone || 'Phone'}</label>
              <input className="form-input" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" placeholder="https://acme.com" value={form.website} onChange={set('website')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="City, Country" value={form.address} onChange={set('address')} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="investor, tech, startup" value={form.tags} onChange={set('tags')} />
          </div>
          <div className="form-group">
            <label className="form-label">{dict.notes || 'Notes'}</label>
            <textarea className="form-input" placeholder="Met at TechConf 2026…" value={form.notes} onChange={set('notes')} rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{dict.cancel || 'Cancel'}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '...' : (dict.add_contact || 'Add Contact')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Drawer ───────────────────────────────────────────────
function ContactDrawer({
  contact,
  onClose,
  onDelete,
  onUpdate,
  dict = {}
}: {
  contact: Contact
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: () => void
  dict?: any
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState(contact.notes || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const saveNotes = async () => {
    setSaving(true)
    await supabase.from('connections').update({ notes }).eq('id', contact.id)
    setSaving(false)
    onUpdate()
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = (contact.tags || []).filter((t) => t !== tagToRemove)
    await supabase.from('connections').update({ tags: updatedTags }).eq('id', contact.id)
    contact.tags = updatedTags
    onUpdate()
  }

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim()
    if (!trimmed) return
    const currentTags = contact.tags || []
    if (currentTags.includes(trimmed)) {
      setNewTagInput('')
      setShowAddTag(false)
      return
    }
    const updatedTags = [...currentTags, trimmed]
    await supabase.from('connections').update({ tags: updatedTags }).eq('id', contact.id)
    contact.tags = updatedTags
    setNewTagInput('')
    setShowAddTag(false)
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('connections').delete().eq('id', contact.id)
    onDelete(contact.id)
    onClose()
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{dict.details || 'Contact Details'}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="drawer-body">
          {/* Avatar & Name */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="drawer-avatar">
              {contact.avatar_url ? <img src={contact.avatar_url} alt={contact.name} /> : getInitials(contact.name)}
            </div>
            <div>
              <div className="drawer-name">{contact.name}</div>
              <div className="drawer-title">
                {[contact.title, contact.company].filter(Boolean).join(' @ ') || 'No title'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {contact.is_new && <span className="badge badge-new">{dict.status_new || 'New'}</span>}
                {contact.source && <span className="badge badge-gray">{contact.source}</span>}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="drawer-section">
            <div className="drawer-section-title">{dict.details || 'Contact Info'}</div>
            {[
              { icon: Mail, label: dict.email || 'Email', value: contact.email },
              { icon: Phone, label: dict.phone || 'Phone', value: contact.phone },
              { icon: Globe, label: 'Website', value: contact.website },
              { icon: MapPin, label: 'Address', value: contact.address },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div className="info-row" key={label}>
                <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                <span className="info-row-label">{label}</span>
                <span className="info-row-value">
                  {label === 'Email' ? <a href={`mailto:${value}`} style={{ color: 'var(--accent-light)' }}>{value}</a> :
                   label === 'Website' ? <a href={value} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)' }}>{value}</a> :
                   value}
                </span>
              </div>
            ) : null)}
            <div className="info-row">
              <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
              <span className="info-row-label">Added</span>
              <span className="info-row-value">{formatDate(contact.created_at)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="drawer-section">
            <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{dict.filter_tags ? dict.filter_tags.split(' ')[2] : 'Tags'}</span>
              {!showAddTag && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setShowAddTag(true)}
                >
                  + {dict.add_tag || 'Add Tag'}
                </button>
              )}
            </div>
            <div className="tags-wrap" style={{ marginTop: 8 }}>
              {(contact.tags || []).map((t) => (
                <span key={t} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                    title={`Remove tag "${t}"`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {(!contact.tags || contact.tags.length === 0) && !showAddTag && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No tags attached</span>
              )}
            </div>
            {showAddTag && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  placeholder="New tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddTag}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTag(false)}><X size={12} /></button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="drawer-section">
            <div className="drawer-section-title">{dict.notes || 'Notes'}</div>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Add notes about this contact…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={saveNotes}
              disabled={saving}
              style={{ marginTop: 8 }}
            >
              {saving ? '...' : (dict.save || 'Save Notes')}
            </button>
          </div>
        </div>

        <div className="drawer-footer">
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
            style={{ flex: 1 }}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────
function exportCSV(contacts: Contact[]) {
  const rows = contacts.map((c) => ({
    Name: c.name,
    'Job Title': c.title || '',
    Company: c.company || '',
    Email: c.email || '',
    Phone: c.phone || '',
    Website: c.website || '',
    Address: c.address || '',
    Tags: (c.tags || []).join(', '),
    Source: c.source || '',
    Notes: c.notes || '',
    'Added On': formatDate(c.created_at),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `eventzone-contacts-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function exportExcel(contacts: Contact[]) {
  const rows = contacts.map((c) => ({
    Name: c.name,
    'Job Title': c.title || '',
    Company: c.company || '',
    Email: c.email || '',
    Phone: c.phone || '',
    Website: c.website || '',
    Address: c.address || '',
    Tags: (c.tags || []).join(', '),
    Source: c.source || '',
    Notes: c.notes || '',
    'Added On': formatDate(c.created_at),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
  XLSX.writeFile(wb, `eventzone-contacts-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ContactsClient({ dict = {} }: { dict?: any }) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [showExport, setShowExport] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadContacts() }, [])

  // Click outside export dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter
  const sources = Array.from(new Set(contacts.map((c) => c.source).filter(Boolean))) as string[]
  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || [c.name, c.email, c.company, c.title].some((v) => v?.toLowerCase().includes(q))
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter
    return matchSearch && matchSource
  })

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{dict.title || 'Contacts'}</h1>
          <p className="page-subtitle">{contacts.length} {dict.contact_count || 'Contact'}{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Export */}
          <div className="dropdown-wrap" ref={exportRef}>
            <button className="btn btn-ghost" onClick={() => setShowExport(!showExport)}>
              <Download size={16} /> Export <ChevronDown size={14} />
            </button>
            {showExport && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { exportCSV(filtered); setShowExport(false) }}>
                  <FileText size={14} /> Export CSV
                </button>
                <button className="dropdown-item" onClick={() => { exportExcel(filtered); setShowExport(false) }}>
                  <FileText size={14} /> Export Excel
                </button>
              </div>
            )}
          </div>
          {/* Add */}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> {dict.add_contact || 'Add Contact'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder={dict.search_placeholder || "Search by name, email, company…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="all">{dict.all_sources || 'All Sources'}</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || sourceFilter !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSourceFilter('all') }}>
            <X size={14} /> {dict.clear || 'Clear'}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">📇</div>
            <div className="table-empty-title">
              {search || sourceFilter !== 'all' ? (dict.no_match || 'No contacts match your filters') : (dict.empty_title || 'No contacts yet')}
            </div>
            <div className="table-empty-text">
              {search || sourceFilter !== 'all'
                ? (dict.try_adjusting || 'Try adjusting your search or filters')
                : (dict.empty_subtitle || 'Add contacts manually or connect with people at events')}
            </div>
          </div>
        ) : (
          <table className="contacts-table">
            <thead>
              <tr>
                <th>{dict.contact || 'Contact'}</th>
                <th>{dict.company || 'Company'}</th>
                <th>{dict.email || 'Email'}</th>
                <th>{dict.filter_tags ? dict.filter_tags.split(' ')[2] : 'Tags'}</th>
                <th>{dict.source || 'Source'}</th>
                <th>{dict.added || 'Added'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)}>
                  <td>
                    <div className="contact-cell">
                      <div className="contact-avatar">
                        {c.avatar_url ? <img src={c.avatar_url} alt={c.name} /> : getInitials(c.name)}
                      </div>
                      <div>
                        <div className="contact-name">
                          {c.name}
                          {c.is_new && <span className="badge badge-new" style={{ marginLeft: 8 }}>{dict.status_new || 'New'}</span>}
                        </div>
                        <div className="contact-email">{c.title || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="contact-meta">{c.company || '—'}</td>
                  <td className="contact-meta">{c.email || '—'}</td>
                  <td>
                    {c.tags && c.tags.length > 0 ? (
                      <div className="tags-wrap">
                        {c.tags.slice(0, 2).map((t) => <span key={t} className="tag">{t}</span>)}
                        {c.tags.length > 2 && <span className="tag">+{c.tags.length - 2}</span>}
                      </div>
                    ) : <span className="contact-meta">—</span>}
                  </td>
                  <td>
                    <span className={`badge ${c.source === 'Manual (CRM)' ? 'badge-blue' : 'badge-purple'}`}>
                      {c.source || 'Unknown'}
                    </span>
                  </td>
                  <td className="contact-meta">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddContactModal onClose={() => setShowAddModal(false)} onSave={loadContacts} dict={dict} />
      )}

      {/* Detail Drawer */}
      {selected && (
        <ContactDrawer
          contact={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
          onUpdate={loadContacts}
          dict={dict}
        />
      )}
    </>
  )
}
