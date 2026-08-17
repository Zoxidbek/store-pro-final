import { api } from '../api'
import React, { useState, useEffect } from 'react'
import { Product, Category } from '../types'

interface Props { product: Product; cats: Category[]; onClose:()=>void; onSave:(p:Product)=>Promise<void> }

export function EditModal({ product, cats, onClose, onSave }: Props) {
  const [f, setF] = useState({ ...product })
  const [loading, setLoading] = useState(false)
  const [img, setImg] = useState<string|null>(null)
  const [imgLoading, setImgLoading] = useState(false)

  useEffect(() => { if (product.image_path) api.getImageData(product.image_path).then(d => { if(d) setImg(d) }) }, [product.image_path])

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) return
    setImgLoading(true)
    try {
      const compressed = await api.compressImage(file)
      setImg(compressed)
      setF(p => ({ ...p, image_path: compressed }))
    } catch {}
    setImgLoading(false)
  }

  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    if (!f.name.trim() || !f.price) return
    setLoading(true)
    setSaveError('')
    try {
      await onSave({ ...f, image_path: img || '' })
      onClose()
    } catch (e: any) {
      setSaveError(e?.message || 'Saqlashda xatolik yuz berdi')
      setLoading(false)
    }
  }

  const sel = cats.find(c => c.id === f.category_id)

  return (
    <div className="bg-in modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="slide-up modal-box" style={{ width:460 }}>
        <div className="sheet-handle"><span/></div>
        <div style={{ padding:'14px 18px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800, fontSize:16 }}>Tovarni tahrirlash</div>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>
        <div style={{ padding:18, display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          {/* Image */}
          <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ width:72, height:72, borderRadius:12, background:'#f5f4f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, overflow:'hidden', flexShrink:0 }}>
              {imgLoading ? <span style={{ fontSize:12, color:'var(--muted)' }}>⏳</span> : img ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (sel?.emoji||'📦')}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ display:'inline-block', padding:'8px 14px', background:'var(--accent-l)', color:'var(--accent)', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                📷 {imgLoading ? 'Ishlanmoqda...' : "Rasm o'zgartirish"}
                <input type="file" accept="image/*" onChange={handleImg} disabled={imgLoading} style={{ display:'none' }}/>
              </label>
              {img && <button onClick={() => { setImg(null); setF(p => ({ ...p, image_path:'' })) }}
                style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>× Rasmni olib tashlash</button>}
            </div>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:5 }}>Nomi</label>
            <input type="text" value={f.name} placeholder="Tovar nomi"
              onChange={e => setF(p => ({ ...p, name: e.target.value }))}
              className="input-base"/>
          </div>

          <div className="field-row-2">
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:5 }}>Kategoriya</label>
              <select value={f.category_id} onChange={e => setF(p => ({ ...p, category_id: Number(e.target.value) }))}
                className="input-base">
                {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:5 }}>Narxi (so'm)</label>
              <input type="number" inputMode="numeric" min="0" value={f.price} onChange={e => setF(p => ({ ...p, price: Number(e.target.value) }))}
                className="input-base"/>
            </div>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:5 }}>Soni (dona)</label>
            <input type="number" inputMode="numeric" min="0" value={f.stock} onChange={e => setF(p => ({ ...p, stock: Number(e.target.value) }))}
              className="input-base"/>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:5 }}>Izoh</label>
            <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} rows={2}
              className="input-base" style={{ resize:'none' }}/>
          </div>
        </div>

        <div style={{ padding:'0 18px 18px', flexShrink:0 }}>
          {saveError && (
            <div style={{ background:'var(--red-l)', color:'var(--red)', fontSize:12, fontWeight:600, padding:'8px 12px', borderRadius:9, marginBottom:10 }}>
              ⚠ {saveError}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Bekor</button>
            <button onClick={handleSave} disabled={loading||imgLoading} className="btn-primary" style={{ flex:2 }}>
              {loading ? 'Saqlanmoqda...' : '💾 Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
