import { api } from '../api'
import React, { useState, useEffect } from 'react'
import { Category } from '../types'

const EMOJIS = ['📦','🔧','🏠','💡','🚿','🏗️','🛠️','⚡','🔩','🪣','🪚','🔨','🪟','🚪','🛁','🪜','🧰','🪛','🔌','🔋']

interface Props { onToast:(m:string,t:'success'|'error'|'warning')=>void }

export function SettingsPage({ onToast }: Props) {
  const [cats, setCats]           = useState<Category[]>([])
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [newName, setNewName]     = useState('')
  const [newEmoji, setNewEmoji]   = useState('📦')

  useEffect(() => {
    api.getCategories().then(setCats).catch((e: any) => onToast(e?.message || 'Kategoriyalarni yuklab bo\'lmadi', 'error'))
    api.getDbStatus().then((r: any) => setDbConnected(!!r?.connected)).catch(() => setDbConnected(false))
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      const cat = await api.addCategory({ name: newName.trim(), emoji: newEmoji })
      if (cat) {
        setCats(p => [...p, cat].sort((a,b) => a.name.localeCompare(b.name)))
        setNewName('')
        onToast("Kategoriya qo'shildi", 'success')
      }
    } catch (e: any) {
      onToast(e?.message || "Qo'shishda xatolik yuz berdi", 'error')
    }
  }

  const handleDel = async (id: number, name: string) => {
    if (!confirm(`"${name}" kategoriyasini o'chirmoqchimisiz?`)) return
    try {
      await api.deleteCategory(id)
      setCats(p => p.filter(c => c.id !== id))
      onToast("Kategoriya o'chirildi", 'success')
    } catch (e: any) {
      onToast(e?.message || "O'chirishda xatolik yuz berdi", 'error')
    }
  }

  const Box = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', marginBottom:16 }}>
      {children}
    </div>
  )

  return (
    <div className="page-wrap" style={{ overflow:'auto' }}>
      <div className="page-topbar">
        <div className="topbar-title">
          <div style={{ fontWeight:800, fontSize:17 }}>Sozlamalar</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Tizim va kategoriyalarni boshqarish</div>
        </div>
      </div>

      <div className="form-wrap" style={{ maxWidth:540 }}>
        {/* Categories */}
        <Box>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0eeea' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Kategoriyalar</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{cats.length} ta kategoriya</div>
          </div>

          {/* Add form */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0eeea', display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
              style={{ padding:'8px', borderRadius:8, border:'1px solid var(--input-b)', background:'var(--input-bg)', fontSize:18, cursor:'pointer' }}>
              {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Yangi kategoriya nomi..."
              onKeyDown={e => e.key==='Enter' && handleAdd()}
              style={{ flex:'1 1 140px', minWidth:0, padding:'8px 12px', borderRadius:8, border:'1px solid var(--input-b)', fontSize:14, background:'var(--input-bg)' }}/>
            <button onClick={handleAdd} disabled={!newName.trim()}
              style={{ padding:'8px 16px', borderRadius:8, border:'none', background:newName.trim()?'var(--accent)':'#e0ddd6', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
              + Qo'shish
            </button>
          </div>

          {/* List */}
          {cats.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center', color:'var(--muted)', fontSize:13 }}>Hali kategoriya yo'q</div>
          ) : (
            cats.map((cat, idx) => (
              <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom: idx<cats.length-1?'1px solid #f5f4f0':'none' }}>
                <span style={{ fontSize:22 }}>{cat.emoji}</span>
                <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{cat.name}</span>
                <button onClick={() => handleDel(cat.id, cat.name)}
                  style={{ width:30, height:30, borderRadius:8, background:'var(--red-l)', border:'none', cursor:'pointer', color:'var(--red)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  🗑️
                </button>
              </div>
            ))
          )}
        </Box>

        {/* DB info */}
        <Box>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0eeea' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Ma'lumotlar bazasi</div>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{
                width:9, height:9, borderRadius:'50%', flexShrink:0,
                background: dbConnected===null ? '#d0ccc4' : dbConnected ? 'var(--green)' : 'var(--red)'
              }}/>
              <span style={{ fontSize:13, fontWeight:600 }}>
                {dbConnected===null ? 'Tekshirilmoqda...' : dbConnected ? 'MongoDB Atlas — ulangan' : 'Ulanmagan!'}
              </span>
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
              💡 Barcha ma'lumotlar bulutda (MongoDB Atlas) saqlanadi — server qayta ishga tushsa ham yo'qolmaydi.<br/>
              🖼️ Rasmlar ham xuddi shu bazada saqlanadi.
            </div>
          </div>
        </Box>

        {/* App info */}
        <Box>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0eeea' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Ilova haqida</div>
          </div>
          <div style={{ padding:'0 16px' }}>
            {[
              ['Ilova nomi',    'StorePro Sklad'],
              ['Versiya',       '1.0.0'],
              ['Texnologiya',   'Node.js + Express + React'],
              ['Ma\'lumot saqlanishi', 'MongoDB Atlas (bulutda)'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f4f0', fontSize:13 }}>
                <span style={{ color:'var(--muted)' }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  )
}
