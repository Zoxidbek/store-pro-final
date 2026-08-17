import { api } from '../api'
import React, { useState, useEffect } from 'react'
import { Product } from '../types'

interface Props {
  product: Product
  onSell: (p: Product) => void
  onEdit: (p: Product) => void
  onDelete: (id: number) => void
  onAddToCart?: (p: Product) => void
  cartQty?: number  // cartda nechta bor
}

export function ProductCard({ product, onSell, onEdit, onDelete, onAddToCart, cartQty = 0 }: Props) {
  const [img, setImg] = useState<string|null>(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    setImg(null)
    if (product.image_path) api.getImageData(product.image_path).then(d => { if (d) setImg(d) })
  }, [product.image_path])

  const isOut = product.stock === 0
  const isLow = !isOut && product.stock <= 5

  return (
    <div className="fade-in" style={{
      background:'white', borderRadius:14, overflow:'hidden',
      border:`1.5px solid ${isOut ? '#fca5a5' : isLow ? '#fde68a' : 'var(--border)'}`,
      display:'flex', flexDirection:'column', position:'relative',
      transition:'box-shadow .15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
    >
      {/* Image */}
      <div style={{ height:128, background:'#f5f4f0', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', flexShrink:0 }}>
        {img ? <img src={img} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:46, opacity:.5 }}>{product.category_emoji||'📦'}</span>}

        <span style={{ position:'absolute', top:8, right:8, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background: isOut?'#dc2626':isLow?'#d97706':'#16a34a', color:'#fff' }}>
          {isOut ? '❌ Tugagan' : `${product.stock} ta`}
        </span>

        {/* Menu */}
        <div style={{ position:'absolute', top:8, left:8 }}>
          <button onClick={e => { e.stopPropagation(); setMenu(v => !v) }}
            style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,.9)', border:'none', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>⋮</button>
          {menu && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:50 }} onClick={() => setMenu(false)} />
              <div style={{ position:'absolute', top:32, left:0, background:'white', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.15)', overflow:'hidden', zIndex:100, minWidth:130 }}>
                <button onClick={() => { setMenu(false); onEdit(product) }}
                  style={{ width:'100%', padding:'9px 14px', background:'none', border:'none', textAlign:'left', fontSize:13, cursor:'pointer', display:'flex', gap:8, alignItems:'center' }}>✏️ Tahrirlash</button>
                <button onClick={() => { setMenu(false); onDelete(product.id) }}
                  style={{ width:'100%', padding:'9px 14px', background:'none', border:'none', textAlign:'left', fontSize:13, cursor:'pointer', color:'var(--red)', display:'flex', gap:8, alignItems:'center', borderTop:'1px solid #f5f4f0' }}>🗑️ O'chirish</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'11px 12px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2 }}>{product.category_emoji} {product.category_name}</div>
        <div style={{ fontWeight:700, fontSize:13.5, marginBottom:3, lineHeight:1.35, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{product.name}</div>
        {product.description && <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{product.description}</div>}
        <div style={{ marginTop:'auto', paddingTop:8 }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>
            {Number(product.price).toLocaleString()} <span style={{ fontSize:11, fontWeight:400, color:'var(--muted)' }}>so'm</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {/* Yakka sotish */}
            <button onClick={() => !isOut && onSell(product)} disabled={isOut}
              style={{ flex:1, padding:'8px 4px', borderRadius:10, background: isOut?'#f0eeea':'var(--accent)', color: isOut?'var(--muted)':'#fff', fontSize:12, fontWeight:700, cursor: isOut?'not-allowed':'pointer', transition:'background .15s' }}
              onMouseEnter={e => { if (!isOut) (e.currentTarget as HTMLElement).style.background='#1d4ed8' }}
              onMouseLeave={e => { if (!isOut) (e.currentTarget as HTMLElement).style.background='var(--accent)' }}>
              {isOut ? 'Tugagan' : '💰 Sotish'}
            </button>
            {/* Cartga qo'shish */}
            {onAddToCart && !isOut && (
              <button onClick={() => onAddToCart(product)}
                title="Savatchaga qo'shish"
                style={{ position:'relative', width:36, borderRadius:10, background: cartQty>0?'#dcfce7':'#f0eeea', border:'none', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s', flexShrink:0 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=cartQty>0?'#bbf7d0':'#e0ddd6'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=cartQty>0?'#dcfce7':'#f0eeea'}
              >
                🛒
                {cartQty > 0 && (
                  <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, background:'var(--green)', color:'#fff', borderRadius:'50%', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {cartQty}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
