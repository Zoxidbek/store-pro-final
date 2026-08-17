import { api } from '../api'
import React, { useState, useEffect } from 'react'
import { Category } from '../types'

const EMOJIS = ['📦','🔧','🏠','💡','🚿','🏗️','🛠️','⚡','🔩','🪣','🪚','🔨','🪟','🚪','🛁','🪜','🧰','🪛','🔌','🔋','⬜','🧴']

interface Props { onToast:(m:string,t:'success'|'error'|'warning')=>void }

export function AddPage({ onToast }: Props) {
  const [cats, setCats]             = useState<Category[]>([])
  const [f, setF]                   = useState({ name:'', category_id:0, price:'', stock:'', description:'' })
  const [errors, setErrors]         = useState<Record<string,string>>({})
  const [img, setImg]               = useState<string|null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [showCatForm, setShowCat]   = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📦')

  useEffect(() => {
    api.getCategories().then(list => {
      setCats(list)
      if (list.length > 0) setF(p => ({ ...p, category_id: list[0].id }))
    })
  }, [])

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { onToast('Faqat rasm fayli tanlang', 'error'); return }
    if (file.size > 10*1024*1024) { onToast('Rasm 10 MB dan kichik bo\'lishi kerak', 'error'); return }
    setImgLoading(true)
    try {
      const compressed = await api.compressImage(file)
      setImg(compressed)
    } catch {
      onToast('Rasmni ishlashda xatolik', 'error')
    }
    setImgLoading(false)
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!f.name.trim()) e.name = 'Nom kiritilishi shart'
    if (!f.price || Number(f.price) <= 0) e.price = "To'g'ri narx kiriting"
    if (f.stock === '' || Number(f.stock) < 0) e.stock = "To'g'ri miqdor kiriting"
    if (!f.category_id) e.cat = 'Kategoriya tanlang'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      // Xato bo'lsa forma boshiga skroll qilamiz — mobil foydalanuvchi xatoni ko'rmay qolmasligi uchun
      document.querySelector('.page-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    try {
      await api.addProduct({ name:f.name.trim(), category_id:f.category_id, price:Number(f.price), stock:Number(f.stock), description:f.description.trim(), image_path: img || '' })
      onToast(`"${f.name}" omborga qo'shildi!`, 'success')
      setF(p => ({ ...p, name:'', price:'', stock:'', description:'' }))
      setImg(null); setErrors({})
      document.querySelector('.page-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      onToast('Saqlashda xatolik yuz berdi', 'error')
    }
    setSaving(false)
  }

  const handleAddCat = async () => {
    if (!newCatName.trim()) return
    const cat = await api.addCategory({ name: newCatName.trim(), emoji: newCatEmoji })
    if (cat) {
      setCats(p => [...p, cat])
      setF(p => ({ ...p, category_id: cat.id }))
      setNewCatName(''); setShowCat(false)
      onToast("Yangi kategoriya qo'shildi", 'success')
    }
  }

  const sel = cats.find(c => c.id === f.category_id)
  const canSubmit = f.name.trim() && f.price && f.stock !== '' && f.category_id && !saving && !imgLoading

  return (
    <div className="page-wrap">
      {/* Fixed header */}
      <div className="page-topbar">
        <div className="topbar-title">
          <div style={{ fontWeight:800, fontSize:17 }}>Yangi tovar qo'shish</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Omborga yangi mahsulot kiriting</div>
        </div>
      </div>

      {/* Scrollable form fields */}
      <div className="page-scroll">
        <div className="form-wrap" style={{ padding:0 }}>
          {/* Image */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:8 }}>Rasm (ixtiyoriy)</label>
            <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ width:88, height:88, borderRadius:14, background:'#f0eeea', border:'2px dashed #d0ccc4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, overflow:'hidden', flexShrink:0 }}>
                {imgLoading ? <span style={{ fontSize:12, color:'var(--muted)' }}>⏳</span> : img ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (sel?.emoji||'📦')}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, flex:'1 1 160px' }}>
                <label className="btn-secondary" style={{ display:'inline-flex', width:'fit-content', cursor:'pointer', color:'var(--accent)', background:'var(--accent-l)', borderColor:'#bfdbfe', minHeight:40, padding:'8px 16px', fontSize:13 }}>
                  📷 {imgLoading ? 'Ishlanmoqda...' : 'Rasm yuklash'}
                  <input type="file" accept="image/*" onChange={handleImg} disabled={imgLoading} style={{ display:'none' }}/>
                </label>
                <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>JPG, PNG, WEBP · maks 10 MB<br/>Bo'lmasa kategoriya emoji chiqadi</div>
                {img && <button onClick={() => setImg(null)} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0, alignSelf:'flex-start' }}>× Olib tashlash</button>}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:5 }}>Tovar nomi *</label>
              <input
                className="input-base"
                style={errors.name ? { borderColor:'var(--red)' } : undefined}
                value={f.name}
                onChange={e => { setF(p => ({ ...p, name:e.target.value })); if (errors.name) setErrors(er => ({ ...er, name:'' })) }}
                placeholder="Masalan: Otverka to'plami"
              />
              {errors.name && <div style={{ fontSize:11, color:'var(--red)', marginTop:4, fontWeight:600 }}>⚠ {errors.name}</div>}
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:5 }}>Kategoriya *</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <select
                  className="input-base"
                  style={{ flex:'1 1 160px', ...(errors.cat ? { borderColor:'var(--red)' } : {}) }}
                  value={f.category_id}
                  onChange={e => { setF(p => ({ ...p, category_id:Number(e.target.value) })); if (errors.cat) setErrors(er => ({ ...er, cat:'' })) }}
                >
                  {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <button onClick={() => setShowCat(v => !v)} className="btn-secondary"
                  style={{ background: showCatForm?'var(--accent-l)':'white', color: showCatForm?'var(--accent)':'var(--text2)', whiteSpace:'nowrap', flexShrink:0 }}>
                  + Yangi
                </button>
              </div>
              {errors.cat && <div style={{ fontSize:11, color:'var(--red)', marginTop:4, fontWeight:600 }}>⚠ {errors.cat}</div>}

              {showCatForm && (
                <div style={{ marginTop:10, padding:14, background:'#f8f7f4', borderRadius:10, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>Yangi kategoriya</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <select value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)}
                      className="input-base" style={{ width:'auto', flexShrink:0, fontSize:18, padding:'8px 10px' }}>
                      {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                    </select>
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Kategoriya nomi..."
                      onKeyDown={e => e.key==='Enter' && handleAddCat()}
                      className="input-base" style={{ flex:'1 1 140px', minWidth:0 }}/>
                    <button onClick={handleAddCat} disabled={!newCatName.trim()} className="btn-primary" style={{ flexShrink:0 }}>
                      Qo'sh
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Price & Stock */}
            <div className="field-row-2">
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:5 }}>Narxi (so'm) *</label>
                <input
                  type="number" inputMode="numeric" min="0"
                  className="input-base"
                  style={errors.price ? { borderColor:'var(--red)' } : undefined}
                  value={f.price}
                  onChange={e => { setF(p => ({ ...p, price:e.target.value })); if (errors.price) setErrors(er => ({ ...er, price:'' })) }}
                  placeholder="45000"
                />
                {errors.price && <div style={{ fontSize:11, color:'var(--red)', marginTop:4, fontWeight:600 }}>⚠ {errors.price}</div>}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:5 }}>Soni (dona) *</label>
                <input
                  type="number" inputMode="numeric" min="0"
                  className="input-base"
                  style={errors.stock ? { borderColor:'var(--red)' } : undefined}
                  value={f.stock}
                  onChange={e => { setF(p => ({ ...p, stock:e.target.value })); if (errors.stock) setErrors(er => ({ ...er, stock:'' })) }}
                  placeholder="10"
                />
                {errors.stock && <div style={{ fontSize:11, color:'var(--red)', marginTop:4, fontWeight:600 }}>⚠ {errors.stock}</div>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:5 }}>Izoh (ixtiyoriy)</label>
              <textarea value={f.description} onChange={e => setF(p => ({ ...p, description:e.target.value }))}
                placeholder="Qisqacha tavsif..." rows={2}
                className="input-base" style={{ resize:'none', lineHeight:1.5 }}/>
            </div>

            {/* Preview */}
            {f.name && f.price && (
              <div style={{ background:'var(--accent-l)', borderRadius:10, padding:'11px 14px', border:'1px solid #bfdbfe' }}>
                <div style={{ fontSize:11, color:'var(--accent)', fontWeight:700, marginBottom:3 }}>Ko'rinishi:</div>
                <div style={{ fontSize:14, fontWeight:700 }}>{sel?.emoji} {f.name}</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{Number(f.price).toLocaleString()} so'm · {f.stock||0} dona</div>
              </div>
            )}

            {/* Scroll pastida bo'sh joy — sticky footer tagida qolib ketmasligi uchun */}
            <div style={{ height:4 }}/>
          </div>
        </div>
      </div>

      {/* Sticky footer — bu tugma HECH QACHON yo'qolmaydi, klaviatura ochiq bo'lsa ham,
          forma qanchalik uzun bo'lmasin doim pastda ko'rinib turadi */}
      <div className="form-footer">
        <button onClick={handleSubmit} disabled={saving||imgLoading} className="btn-primary" style={{ width:'100%', fontSize:15 }}>
          {saving ? '⏳ Saqlanmoqda...' : "✓ Tovarni qo'shish"}
        </button>
        {!canSubmit && !saving && (f.name || f.price || f.stock) && (
          <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', marginTop:6 }}>
            Nomi, narxi va soni to'ldirilishi kerak
          </div>
        )}
      </div>
    </div>
  )
}
