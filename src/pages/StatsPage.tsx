import { api } from '../api'
import React, { useState, useEffect } from 'react'
import { Stats } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2']
const DAYS   = ['Yak','Du','Se','Ch','Pa','Ju','Sh']

export function StatsPage() {
  const [s, setS]       = useState<Stats|null>(null)
  const [loading, setL] = useState(true)

  useEffect(() => { api.getStats().then(d => { setS(d); setL(false) }) }, [])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)', flexDirection:'column', gap:10 }}><div style={{ fontSize:32 }}>📊</div>Yuklanmoqda...</div>
  if (!s) return null

  const chartData = Array.from({ length:7 }, (_, i) => {
    const d   = new Date(Date.now() - (6-i)*86400000)
    const pad = (n: number) => String(n).padStart(2,'0')
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const found = s.last7days.find(x => x.day === key)
    return { name: DAYS[d.getDay()], revenue: found ? Number(found.revenue) : 0, sold: found ? Number(found.sold) : 0 }
  })

  const Card = ({ label, value, sub, color, bg }: any) => (
    <div style={{ background:bg||'white', borderRadius:12, padding:'14px 16px', border:'1px solid var(--border)' }}>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color:color||'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{sub}</div>}
    </div>
  )

  return (
    <div className="page-wrap" style={{ overflow:'auto' }}>
      <div className="page-topbar">
        <div className="topbar-title">
          <div style={{ fontWeight:800, fontSize:17 }}>Statistika</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Do'kon ko'rsatkichlari</div>
        </div>
      </div>

      <div className="page-scroll">
        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:18 }}>
          <Card label="Bugungi tushum"  value={`${Number(s.todayRevenue).toLocaleString()} so'm`} sub={`${s.todaySales} ta sotuv`} color="var(--green)" bg="var(--green-l)"/>
          <Card label="Jami tushum"     value={`${Number(s.totalRevenue).toLocaleString()} so'm`} sub={`${s.totalSold} ta sotilgan`}/>
          <Card label="Tovar turlari"   value={`${s.totalProducts} ta`} sub={`Omborda ${s.totalStock} dona`} color="var(--accent)"/>
          <Card label="Kam qolgan"      value={`${s.lowStock} ta`} sub="5 ta yoki kam" color={Number(s.lowStock)>0?'var(--red)':'var(--green)'}/>
        </div>

        {/* Bar chart */}
        <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', padding:'16px', marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Haftalik savdo (so'm)</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:14 }}>So'nggi 7 kun</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top:4, right:4, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eeea" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'#aaa' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'#aaa' }} axisLine={false} tickLine={false}
                tickFormatter={(v:number) => v>=1000?`${Math.round(v/1000)}K`:String(v)}/>
              <Tooltip formatter={(v:any) => [`${Number(v).toLocaleString()} so'm`, 'Tushum']}
                contentStyle={{ borderRadius:8, border:'1px solid var(--border)', fontSize:12 }} cursor={{ fill:'rgba(37,99,235,.05)' }}/>
              <Bar dataKey="revenue" fill="#2563eb" radius={[6,6,0,0]} maxBarSize={48}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-grid-2">
          {/* Pie */}
          {s.byCat.length > 0 && (
            <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Kategoriyalar</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={s.byCat} dataKey="revenue" nameKey="category_name" cx="50%" cy="50%" outerRadius={62} innerRadius={28}
                    label={({ percent }) => `${Math.round(percent*100)}%`} labelLine={false}>
                    {s.byCat.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ borderRadius:8, fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:6 }}>
                {s.byCat.slice(0,5).map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:COLORS[i%COLORS.length], flexShrink:0 }}/>
                    <span style={{ flex:1, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.category_name}</span>
                    <span style={{ fontWeight:700 }}>{Number(c.revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top products */}
          {s.topProducts.length > 0 && (
            <div style={{ background:'white', borderRadius:14, border:'1px solid var(--border)', padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Ko'p sotilganlar</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {s.topProducts.map((p,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, background:i===0?'#fef3c7':i===1?'#f3f4f6':'#fef7ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:i===0?'#b45309':i===1?'#6b7280':'#92400e' }}>{i+1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>{p.sold} dona sotildi</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:800, color:'var(--green)', flexShrink:0 }}>{Number(p.revenue).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {s.byCat.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📈</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Ma'lumot yo'q</div>
            <div style={{ fontSize:13, marginTop:4 }}>Birinchi sotuvdan keyin statistika paydo bo'ladi</div>
          </div>
        )}
      </div>
    </div>
  )
}
