import { api } from '../api'
import React, { useState, useEffect, useCallback } from 'react'
import { Sale } from '../types'

interface Props {
  onToast: (m: string, t: 'success'|'error'|'warning') => void
  onRefresh: () => void
}

interface Session {
  session_id: string | null
  key: string
  sales: Sale[]
  total: number
  original_total: number
  discount: number
  sold_at: string
  isCart: boolean
  hasExtra: boolean
}

const fmtNum = (n: number) => Number(n).toLocaleString()

export function SoldPage({ onToast, onRefresh }: Props) {
  const [sales, setSales]         = useState<Sale[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [openKey, setOpenKey]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getSales({ limit: 2000 })
      setSales(res.sales)
      setTotal(res.total)
    } catch (e: any) {
      onToast(e?.message || "Ma'lumotlarni yuklab bo'lmadi", 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Build sessions ────────────────────────────────────────────
  const buildSessions = (list: Sale[]): Session[] => {
    const sessMap: Record<string, Sale[]> = {}
    const noSess: Sale[] = []

    list.forEach(s => {
      if (s.session_id) {
        if (!sessMap[s.session_id]) sessMap[s.session_id] = []
        sessMap[s.session_id].push(s)
      } else {
        noSess.push(s)
      }
    })

    const sessions: Session[] = []

    Object.entries(sessMap).forEach(([sid, arr]) => {
      const tot      = arr.reduce((s, r) => s + Number(r.total_amount), 0)
      const origTot  = arr.reduce((s, r) => s + Number(r.original_total), 0)
      const disc     = origTot - tot
      const hasExtra = arr.some(s => s.is_extra)
      const nonExtra = arr.filter(s => !s.is_extra)
      sessions.push({
        session_id: sid, key: sid,
        sales: arr, total: tot, original_total: origTot,
        discount: disc, sold_at: arr[0].sold_at,
        isCart: nonExtra.length > 1, hasExtra,
      })
    })

    noSess.forEach(s => {
      sessions.push({
        session_id: null, key: 'single_' + s.id,
        sales: [s], total: Number(s.total_amount),
        original_total: Number(s.original_total),
        discount: Number(s.discount),
        sold_at: s.sold_at, isCart: false,
        hasExtra: s.is_extra,
      })
    })

    return sessions.sort((a, b) => b.sold_at.localeCompare(a.sold_at))
  }

  // ── Delete ───────────────────────────────────────────────────
  const handleDel = async (sess: Session) => {
    const names = sess.sales.map(s => s.product_name).join(', ')
    if (!confirm(`Bu sotuvni bekor qilsangiz tovarlar qaytariladi:\n${names}\n\nDavom etasizmi?`)) return
    try {
      if (sess.session_id) {
        await api.deleteSession(sess.session_id)
      } else {
        await api.deleteSale(sess.sales[0].id)
      }
      await load()
      onToast('Sotuv bekor qilindi', 'warning')
      onRefresh()
    } catch (e: any) {
      onToast(e?.message || "Bekor qilishda xatolik yuz berdi", 'error')
    }
  }

  // ── Filter & group ───────────────────────────────────────────
  const filtered = sales.filter(s =>
    !search ||
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    s.category_name.toLowerCase().includes(search.toLowerCase())
  )

  const sessions   = buildSessions(filtered)
  const totalRev   = filtered.reduce((s, r) => s + Number(r.total_amount), 0)
  const totalQty   = filtered.filter(s => !s.is_extra).reduce((s, r) => s + Number(r.quantity), 0)
  const totalDisc  = filtered.reduce((s, r) => s + Number(r.discount), 0)

  const byDay: Record<string, Session[]> = {}
  sessions.forEach(sess => {
    const day = sess.sold_at.split(' ')[0]
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(sess)
  })
  const dayOrder = Object.keys(byDay).sort((a, b) => b.localeCompare(a))

  // ── Format date ──────────────────────────────────────────────
  const fmtDate = (d: string) => {
    const now   = new Date()
    const pad   = (n: number) => String(n).padStart(2, '0')
    const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
    const yest  = new Date(Date.now()-86400000)
    const yestStr = `${yest.getFullYear()}-${pad(yest.getMonth()+1)}-${pad(yest.getDate())}`
    if (d === today)    return '📅 Bugun'
    if (d === yestStr)  return '📅 Kecha'
    const dt = new Date(d)
    const M  = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
    return `${dt.getDate()} ${M[dt.getMonth()]} ${dt.getFullYear()}`
  }

  // ── Styles ───────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    border: '1px solid #e8e6e0', overflow: 'hidden', marginBottom: 8,
  }

  return (
    <div className="page-wrap">
      {/* Topbar */}
      <div className="page-topbar">
        <div className="topbar-title">
          <div style={{ fontWeight:800, fontSize:17 }}>Sotilgan tovarlar</div>
          <div style={{ fontSize:11, color:'#9999b0' }}>{total} ta sotuv · {sessions.length} ta tranzaksiya</div>
        </div>
        <div className="search-box topbar-search" style={{ width:200 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."/>
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#9999b0', fontSize:18, lineHeight:1 }}>×</button>
          )}
        </div>
      </div>

      <div className="page-scroll">
        {/* Summary cards */}
        <div className="stats-grid-4" style={{ marginBottom:16 }}>
          {[
            { label:'Jami tushum',    value:`${fmtNum(totalRev)} so'm`, color:'#16a34a', bg:'#f0fdf4' },
            { label:'Sotilgan dona',  value:`${totalQty} ta`,            color:'#2563eb', bg:'#eff6ff' },
            { label:'Tranzaksiyalar', value:`${sessions.length} ta`,     color:'#d97706', bg:'#fffbeb' },
            { label:'Jami chegirma',  value:`${fmtNum(totalDisc)} so'm`, color:'#dc2626', bg:'#fef2f2' },
          ].map((c, i) => (
            <div key={i} style={{ background:c.bg, borderRadius:12, padding:'11px 13px' }}>
              <div style={{ fontSize:11, color:'#5a5a72', marginBottom:3 }}>{c.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#9999b0' }}>⏳ Yuklanmoqda...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#9999b0' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🛍️</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Hali sotilmagan</div>
          </div>
        ) : (
          dayOrder.map(day => {
            const daySess    = byDay[day]
            const dayTotal   = daySess.reduce((s, sess) => s + sess.total, 0)
            const dayOrig    = daySess.reduce((s, sess) => s + sess.original_total, 0)
            const dayDisc    = dayOrig - dayTotal
            const dayQty     = daySess.reduce((s, sess) =>
              s + sess.sales.filter(x => !x.is_extra).reduce((q, r) => q + Number(r.quantity), 0), 0)

            return (
              <div key={day} style={{ marginBottom:22 }}>
                {/* Day header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#5a5a72' }}>{fmtDate(day)}</div>
                  <div style={{ fontSize:12, color:'#9999b0', fontWeight:600, display:'flex', gap:10 }}>
                    {dayDisc > 0 && (
                      <span style={{ color:'#dc2626' }}>−{fmtNum(dayDisc)} so'm chegirma</span>
                    )}
                    <span>{fmtNum(dayTotal)} so'm · {dayQty} dona</span>
                  </div>
                </div>

                {/* Sessions */}
                {daySess.map(sess => {
                  const isOpen      = openKey === sess.key
                  const sessQty     = sess.sales.filter(s => !s.is_extra).reduce((s, r) => s + Number(r.quantity), 0)
                  const time        = sess.sold_at.split(' ')[1]?.slice(0, 5) || ''
                  const hasDisc     = sess.discount > 0
                  const discPct     = sess.original_total > 0
                    ? Math.round((sess.discount / sess.original_total) * 1000) / 10
                    : 0
                  const nonExtra    = sess.sales.filter(s => !s.is_extra)
                  const extras      = sess.sales.filter(s => s.is_extra)
                  const icon        = sess.hasExtra && nonExtra.length === 0
                    ? '💸'
                    : sess.isCart ? '🛒' : '💰'
                  const iconBg      = sess.hasExtra && nonExtra.length === 0
                    ? '#fefce8'
                    : sess.isCart ? '#eff6ff' : '#f0fdf4'

                  const title = sess.hasExtra && nonExtra.length === 0
                    ? (extras.map(e => e.product_name).join(', '))
                    : sess.isCart
                      ? `${nonExtra.length} xil tovar · ${sessQty} dona${extras.length > 0 ? ` + ${extras.length} qo'shimcha` : ''}`
                      : sess.sales[0].product_name

                  const sub = sess.hasExtra && nonExtra.length === 0
                    ? '💸 Qo\'shimcha kirim'
                    : sess.isCart
                      ? nonExtra.map(s => s.product_name).slice(0, 3).join(', ') + (nonExtra.length > 3 ? '...' : '')
                      : `${sess.sales[0].category_name}${!sess.sales[0].is_extra ? ` · ${sessQty} ta × ${fmtNum(sess.sales[0].price_per_unit)}` : ''}`

                  return (
                    <div key={sess.key} style={card}>
                      {/* Session header — bosiladi */}
                      <div
                        onClick={() => setOpenKey(isOpen ? null : sess.key)}
                        className="sess-row"
                        style={{ userSelect:'none' }}
                      >
                        {/* Icon */}
                        <div style={{ width:40, height:40, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                          {icon}
                        </div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {title}
                          </div>
                          <div style={{ fontSize:11, color:'#9999b0', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {sub}
                          </div>
                        </div>

                        {/* Total — chegirma bilan */}
                        <div style={{ textAlign:'right', flexShrink:0, marginRight:4 }}>
                          {hasDisc ? (
                            <>
                              <div style={{ fontSize:12, color:'#9999b0', textDecoration:'line-through' }}>
                                {fmtNum(sess.original_total)} so'm
                              </div>
                              <div style={{ fontWeight:800, fontSize:14, color:'#16a34a' }}>
                                {fmtNum(sess.total)} so'm
                              </div>
                              <div style={{ fontSize:10, color:'#dc2626', fontWeight:600 }}>
                                −{fmtNum(sess.discount)} ({discPct}%)
                              </div>
                            </>
                          ) : (
                            <div style={{ fontWeight:800, fontSize:14, color:'#16a34a' }}>
                              {fmtNum(sess.total)} so'm
                            </div>
                          )}
                          <div style={{ fontSize:11, color:'#9999b0' }}>{time}</div>
                        </div>

                        {/* Arrow */}
                        <span style={{ fontSize:11, color:'#9999b0', transition:'transform .2s', display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                          ▼
                        </span>

                        {/* Delete */}
                        <button
                          onClick={e => { e.stopPropagation(); handleDel(sess) }}
                          title="Bekor qilish"
                          style={{ width:28, height:28, borderRadius:7, background:'#fef2f2', border:'none', cursor:'pointer', color:'#dc2626', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          ↩
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div style={{ borderTop:'1px solid #f5f4f0' }}>
                          {/* Non-extra items */}
                          {nonExtra.map((sale, idx) => {
                            const saleDisc    = Number(sale.discount)
                            const saleOrig    = Number(sale.original_total)
                            const saleTotal   = Number(sale.total_amount)
                            const saleDiscPct = Number(sale.discount_pct)
                            const hasSD       = saleDisc > 0

                            return (
                              <div key={sale.id} className='sess-detail-row' style={{ background:'#fafaf8', borderBottom: idx < sess.sales.length-1 ? '1px solid #f0eeea' : 'none' }}>
                                <div style={{ width:28, height:28, borderRadius:8, background:'#f0eeea', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                                  {sale.category_emoji || '📦'}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:600, fontSize:12 }}>{sale.product_name}</div>
                                  <div style={{ fontSize:11, color:'#9999b0' }}>{sale.category_name} · {sale.quantity} ta</div>
                                </div>
                                <div style={{ textAlign:'right', fontSize:12, flexShrink:0 }}>
                                  {hasSD ? (
                                    <>
                                      <div style={{ color:'#9999b0', textDecoration:'line-through', fontSize:11 }}>
                                        {fmtNum(saleOrig)} so'm
                                      </div>
                                      <div style={{ fontWeight:700, color:'#16a34a' }}>
                                        {fmtNum(saleTotal)} so'm
                                      </div>
                                      <div style={{ fontSize:10, color:'#dc2626', fontWeight:600 }}>
                                        −{fmtNum(saleDisc)} ({saleDiscPct}%)
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ fontWeight:700, color:'#16a34a' }}>{fmtNum(saleTotal)} so'm</div>
                                      <div style={{ color:'#9999b0' }}>{sale.quantity} ta × {fmtNum(sale.price_per_unit)}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}

                          {/* Extra items */}
                          {extras.map((sale, idx) => (
                            <div key={sale.id} className='sess-detail-row' style={{ background:'#fefce8', borderTop: idx===0&&nonExtra.length>0 ? '1px dashed #fde68a' : 'none', borderBottom: idx < extras.length-1 ? '1px solid #fef9c3' : 'none' }}>
                              <div style={{ width:28, height:28, borderRadius:8, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                                💸
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:600, fontSize:12 }}>{sale.product_name}</div>
                                <div style={{ fontSize:11, color:'#9999b0' }}>Qo'shimcha kirim</div>
                              </div>
                              <div style={{ fontWeight:700, fontSize:12, color:'#d97706' }}>
                                +{fmtNum(sale.total_amount)} so'm
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
