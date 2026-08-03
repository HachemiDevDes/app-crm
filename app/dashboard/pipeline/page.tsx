'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  GitBranch, Check, X, Search, Sliders, ChevronRight, ChevronLeft,
  Mail, Phone, Globe, MapPin, Tag, FileText, Trash2
} from 'lucide-react'

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
  pipeline_stage: string
}

const STAGES = [
  { id: 'New', label: 'New', color: 'blue' },
  { id: 'Contacted', label: 'Contacted', color: 'purple' },
  { id: 'Proposal', label: 'Proposal', color: 'yellow' },
  { id: 'Won', label: 'Won', color: 'green' },
  { id: 'Lost', label: 'Lost', color: 'red' },
]

function getInitials(name: string) {
  return (name || '').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PipelinePage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Contact | null>(null)
  
  // Drawer state
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    // Normalize pipeline stage. If empty/null, default to 'New'
    const normalized = (data || []).map((c: any) => ({
      ...c,
      pipeline_stage: c.pipeline_stage || 'New'
    }))
    setContacts(normalized)
    setLoading(false)
  }

  useEffect(() => {
    loadContacts()
  }, [])

  // Sync drawer notes when selected contact changes
  useEffect(() => {
    if (selected) {
      setNotes(selected.notes || '')
    }
  }, [selected])

  // Drag and Drop Handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (stage: string) => {
    if (!draggedId) return
    
    // Update locally
    const updated = contacts.map(c => c.id === draggedId ? { ...c, pipeline_stage: stage } : c)
    setContacts(updated)

    // Update in Supabase
    await supabase
      .from('connections')
      .update({ pipeline_stage: stage })
      .eq('id', draggedId)

    // If selected is currently being dragged, update selected state too
    if (selected?.id === draggedId) {
      setSelected({ ...selected, pipeline_stage: stage })
    }

    setDraggedId(null)
  }

  // Back / Next action buttons for better accessibility
  const moveStage = async (contact: Contact, direction: 'next' | 'prev') => {
    const currentIdx = STAGES.findIndex(s => s.id === contact.pipeline_stage)
    if (currentIdx === -1) return

    let nextIdx = currentIdx
    if (direction === 'next' && currentIdx < STAGES.length - 1) nextIdx++
    if (direction === 'prev' && currentIdx > 0) nextIdx--

    if (nextIdx === currentIdx) return
    const newStage = STAGES[nextIdx].id

    // Update locally
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, pipeline_stage: newStage } : c))

    // Update in Supabase
    await supabase
      .from('connections')
      .update({ pipeline_stage: newStage })
      .eq('id', contact.id)

    if (selected?.id === contact.id) {
      setSelected({ ...selected, pipeline_stage: newStage })
    }
  }

  // Drawer Action Handlers
  const saveNotes = async () => {
    if (!selected) return
    setSavingNotes(true)
    await supabase.from('connections').update({ notes }).eq('id', selected.id)
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, notes } : c))
    setSelected({ ...selected, notes })
    setSavingNotes(false)
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selected) return
    const updatedTags = (selected.tags || []).filter((t) => t !== tagToRemove)
    await supabase.from('connections').update({ tags: updatedTags }).eq('id', selected.id)
    
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, tags: updatedTags } : c))
    setSelected({ ...selected, tags: updatedTags })
  }

  const handleAddTag = async () => {
    if (!selected) return
    const trimmed = newTagInput.trim()
    if (!trimmed) return
    const currentTags = selected.tags || []
    if (currentTags.includes(trimmed)) {
      setNewTagInput('')
      setShowAddTag(false)
      return
    }
    const updatedTags = [...currentTags, trimmed]
    await supabase.from('connections').update({ tags: updatedTags }).eq('id', selected.id)
    
    setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, tags: updatedTags } : c))
    setSelected({ ...selected, tags: updatedTags })
    setNewTagInput('')
    setShowAddTag(false)
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm(`Delete ${selected.name}? This cannot be undone.`)) return
    
    await supabase.from('connections').delete().eq('id', selected.id)
    setContacts(prev => prev.filter(c => c.id !== selected.id))
    setSelected(null)
  }

  // Conversion calculations
  const total = contacts.length
  const won = contacts.filter(c => c.pipeline_stage === 'Won').length
  const lost = contacts.filter(c => c.pipeline_stage === 'Lost').length
  const active = total - won - lost
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0

  // Filter contacts by search
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.name, c.company, c.title, c.email].some(v => v?.toLowerCase().includes(q))
  })

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Deals Pipeline</h1>
          <p className="page-subtitle">Track, follow up, and close your connections visually</p>
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Sliders size={20} /></div>
          <div className="stat-body">
            <div className="stat-value">{active}</div>
            <div className="stat-label">Active Deals</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><Check size={20} /></div>
          <div className="stat-body">
            <div className="stat-value">{won}</div>
            <div className="stat-label">Deals Won</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><X size={20} /></div>
          <div className="stat-body">
            <div className="stat-value">{lost}</div>
            <div className="stat-label">Deals Lost</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><GitBranch size={20} /></div>
          <div className="stat-body">
            <div className="stat-value">{conversionRate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <div className="search-wrap" style={{ maxWidth: '100%' }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search deals by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Board Layout */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <div className="ag-board">
          {STAGES.map((stage) => {
            const stageContacts = filtered.filter(c => c.pipeline_stage === stage.id)
            return (
              <div
                key={stage.id}
                className="ag-column"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Column Header */}
                <div className={`ag-column-header ${stage.color}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ag-column-dot" />
                    <span className="ag-column-title">{stage.label}</span>
                  </div>
                  <span className="ag-column-badge">{stageContacts.length}</span>
                </div>

                {/* Cards Container */}
                <div className="ag-cards-container">
                  {stageContacts.length === 0 ? (
                    <div className="ag-column-empty">
                      Drop deals here
                    </div>
                  ) : (
                    stageContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`ag-deal-card ${draggedId === contact.id ? 'dragging' : ''} ${selected?.id === contact.id ? 'selected' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(contact.id)}
                        onClick={() => setSelected(contact)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <div className="contact-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {contact.avatar_url ? (
                              <img src={contact.avatar_url} alt={contact.name} />
                            ) : (
                              getInitials(contact.name)
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="contact-name" style={{ fontSize: 13.5, lineHeight: 1.2 }}>{contact.name}</div>
                            <div className="contact-email" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {contact.title || 'No Title'}
                            </div>
                          </div>
                        </div>

                        {/* Company & Source */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                            {contact.company || '—'}
                          </span>
                          
                          {/* Navigation Buttons for accessibility / touch screens */}
                          <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            {stage.id !== 'New' && (
                              <button
                                className="ag-deal-nav-btn"
                                onClick={() => moveStage(contact, 'prev')}
                                title="Move Back"
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}
                            {stage.id !== 'Lost' && (
                              <button
                                className="ag-deal-nav-btn"
                                onClick={() => moveStage(contact, 'next')}
                                title="Move Forward"
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contact Details Drawer */}
      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="drawer-header">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Deal Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="drawer-body">
              {/* Avatar & Name */}
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="drawer-avatar">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt={selected.name} />
                  ) : (
                    getInitials(selected.name)
                  )}
                </div>
                <div>
                  <div className="drawer-name">{selected.name}</div>
                  <div className="drawer-title">
                    {[selected.title, selected.company].filter(Boolean).join(' @ ') || 'No title'}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <span className="badge badge-blue">{selected.pipeline_stage}</span>
                    {selected.source && <span className="badge badge-gray">{selected.source}</span>}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="drawer-section">
                <div className="drawer-section-title">Contact Info</div>
                {[
                  { icon: Mail, label: 'Email', value: selected.email },
                  { icon: Phone, label: 'Phone', value: selected.phone },
                  { icon: Globe, label: 'Website', value: selected.website },
                  { icon: MapPin, label: 'Address', value: selected.address },
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
                  <span className="info-row-value">{formatDate(selected.created_at)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="drawer-section">
                <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Tags</span>
                  {!showAddTag && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => setShowAddTag(true)}
                    >
                      + Add Tag
                    </button>
                  )}
                </div>
                <div className="tags-wrap" style={{ marginTop: 8 }}>
                  {(selected.tags || []).map((t) => (
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
                  {(!selected.tags || selected.tags.length === 0) && !showAddTag && (
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
                <div className="drawer-section-title">Notes & Log</div>
                <textarea
                  className="form-input"
                  style={{ width: '100%', fontSize: 13, padding: 10, minHeight: 120 }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record deal progress, next steps, meeting outcomes..."
                />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={saveNotes}
                  disabled={savingNotes}
                  style={{ marginTop: 8 }}
                >
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                style={{ flex: 1 }}
              >
                <Trash2 size={14} />
                Delete Deal
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
