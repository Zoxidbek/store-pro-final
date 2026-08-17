import React from 'react'
import { Page } from '../types'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'products', label: 'Sotuvda',        icon: '🏪' },
  { id: 'sold',     label: 'Sotilgan',        icon: '🛒' },
  { id: 'add',      label: "Qo'shish",        icon: '➕' },
  { id: 'stats',    label: 'Statistika',       icon: '📊' },
  { id: 'settings', label: 'Sozlamalar',       icon: '⚙️' },
]

interface Props {
  page: Page
  onNav: (p: Page) => void
  lowStock: number
  soldToday: number
  cartQty?: number
  onCartOpen?: () => void
}

export function Sidebar({ page, onNav, lowStock, soldToday, cartQty=0, onCartOpen }: Props) {
  const d = new Date()
  const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
  const DAYS   = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏪</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:15 }}>StorePro</div>
            <div style={{ color:'var(--sidebar-text)', fontSize:10 }}>Sklad tizimi</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 0' }}>
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px',
                background: active ? 'rgba(255,255,255,.1)' : 'transparent',
                color: active ? '#fff' : 'var(--sidebar-text)',
                borderLeft:`3px solid ${active ? '#2563eb' : 'transparent'}`,
                fontSize:13, fontWeight: active ? 700 : 400,
                transition:'all .12s', textAlign:'left', cursor:'pointer',
              }}
                onMouseEnter={e => { if(!active)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.05)' }}
                onMouseLeave={e => { if(!active)(e.currentTarget as HTMLElement).style.background='transparent' }}
              >
                <span style={{ fontSize:16, width:20, textAlign:'center' }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.id==='products' && lowStock>0 && <span style={{ background:'#dc2626', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:10 }}>{lowStock}</span>}
                {item.id==='sold' && soldToday>0 && <span style={{ background:'#16a34a', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:10 }}>{soldToday}</span>}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
          <div style={{ color:'var(--sidebar-text)', fontSize:11 }}>{DAYS[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]}</div>
          <div style={{ color:'#3a4a6a', fontSize:10, marginTop:1 }}>{d.getFullYear()}-yil</div>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <div className="mobile-topbar">
        <div className="mobile-logo">🏪 StorePro</div>
        {onCartOpen && (
          <button className="mobile-cart-btn" onClick={onCartOpen}>
            🛒 {cartQty > 0 ? <span className="mobile-cart-badge">{cartQty}</span> : 'Savatcha'}
          </button>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} className={`mobile-nav-btn${active?' active':''}`} onClick={() => onNav(item.id)}>
                <span className="mnb-icon-wrap"><span className="mnb-icon">{item.icon}</span></span>
                <span>{item.label}</span>
                {item.id==='products' && lowStock>0 && <span className="mobile-nav-badge">{lowStock}</span>}
                {item.id==='sold' && soldToday>0 && <span className="mobile-nav-badge green">{soldToday}</span>}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
