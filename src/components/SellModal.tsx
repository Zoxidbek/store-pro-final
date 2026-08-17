import { api } from '../api'
import React, { useState, useEffect, useCallback } from 'react'
import { Product } from '../types'

interface Props { product:Product; onClose:()=>void; onSold:(id:number,qty:number,discount:number)=>Promise<void> }

export function SellModal({ product, onClose, onSold }: Props) {
  const [qty,        setQty]        = useState(1)
  const [finalPrice, setFinalPrice] = useState('')   // foydalanuvchi kiritgan narx
  const [loading,    setLoading]    = useState(false)
  const [img,        setImg]        = useState<string|null>(null)

  useEffect(() => {
    if (product.image_path) api.getImageData(product.image_path).then(d => { if(d) setImg(d) })
  }, [product.image_path])

  const change = (d:number) => setQty(q => Math.max(1, Math.min(product.stock, q+d)))

  const origTotal    = Number(product.price) * qty
  // foydalanuvchi kiritgan narx — bo'sh bo'lsa origTotal
  const finalNum     = finalPrice === '' ? origTotal : Number(finalPrice)
  const clampedFinal = Math.max(0, Math.min(origTotal, finalNum))
  const discount     = origTotal - clampedFinal
  const discountPct  = origTotal > 0 ? Math.round((discount / origTotal) * 1000) / 10 : 0
  const hasDiscount  = discount > 0

  const doSell = useCallback(async () => {
    setLoading(true)
    await onSold(product.id, qty, discount)
    setLoading(false)
    onClose()
  }, [qty, discount, product.id, onSold, onClose])

  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter' && !loading && !(e.target instanceof HTMLInputElement)) doSell()
      else if (e.key === 'ArrowUp') change(1)
      else if (e.key === 'ArrowDown') change(-1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [doSell, loading, onClose])

  // qty o'zgarganda finalPrice ni tozalaymiz (narx dona uchun, jami emas)
  useEffect(() => { setFinalPrice('') }, [qty])

  const S: React.CSSProperties = {
    width:'100%', padding:'9px 12px', border:'1.5px solid #e0ddd6',
    borderRadius:10, fontSize:14, background:'#f8f7f4', color:'#1a1a2e'
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} className="modal-overlay">
      <div className="modal-box" style={{width:390}}>
        <div className="sheet-handle"><span/></div>

        {/* Header */}
        <div style={{display:'flex',gap:14,padding:'18px 18px 14px',borderBottom:'1px solid #f0eeea'}}>
          <div style={{width:60,height:60,borderRadius:12,background:'#f5f4f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,overflow:'hidden'}}>
            {img ? <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (product.category_emoji||'📦')}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{product.name}</div>
            <div style={{fontSize:11,color:'#9999b0',marginBottom:6}}>{product.category_emoji} {product.category_name}</div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:15,fontWeight:800,color:'#2563eb'}}>{Number(product.price).toLocaleString()} so'm</span>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,
                background:product.stock<=5?'#fef2f2':'#f0fdf4',
                color:product.stock<=5?'#dc2626':'#16a34a'}}>
                {product.stock} ta mavjud
              </span>
            </div>
          </div>
        </div>

        <div style={{padding:'16px 18px 0', overflowY:'auto'}}>
          {/* Qty */}
          <div style={{fontSize:12,color:'#9999b0',textAlign:'center',marginBottom:10}}>Nechta sotilsin?</div>
          <div className="qty-stepper" style={{marginBottom:10}}>
            {[-5,-1].map(d=>(
              <button key={d} onClick={()=>change(d)} disabled={qty+d<1}
                style={{width:36,height:36,borderRadius:9,background:qty+d<1?'#f0eeea':'#eff6ff',color:qty+d<1?'#9999b0':'#2563eb',border:'none',cursor:qty+d<1?'not-allowed':'pointer',fontSize:13,fontWeight:800}}>
                {d}
              </button>
            ))}
            <input type="number" inputMode="numeric" min="1" max={product.stock} value={qty}
              onChange={e=>{const n=parseInt(e.target.value);if(!isNaN(n)&&n>=1&&n<=product.stock)setQty(n)}}
              style={{width:60,height:40,textAlign:'center',border:'2px solid #eff6ff',borderRadius:10,fontSize:22,fontWeight:900,color:'#1a1a2e',background:'white'}}/>
            {[1,5].map(d=>(
              <button key={d} onClick={()=>change(d)} disabled={qty+d>product.stock}
                style={{width:36,height:36,borderRadius:9,background:qty+d>product.stock?'#f0eeea':'#eff6ff',color:qty+d>product.stock?'#9999b0':'#2563eb',border:'none',cursor:qty+d>product.stock?'not-allowed':'pointer',fontSize:13,fontWeight:800}}>
                +{d}
              </button>
            ))}
          </div>

          {/* Quick qty */}
          <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:14}}>
            {[1,2,5,10,20].filter(n=>n<=product.stock).map(n=>(
              <button key={n} onClick={()=>setQty(n)}
                style={{width:40,height:30,borderRadius:8,background:qty===n?'#2563eb':'#f0eeea',color:qty===n?'#fff':'#5a5a72',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>
                {n}
              </button>
            ))}
          </div>

          {/* Standart narx ko'rsatgich */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8f7f4',borderRadius:10,padding:'9px 13px',marginBottom:10}}>
            <span style={{fontSize:12,color:'#9999b0'}}>Standart narx ({qty} ta)</span>
            <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{origTotal.toLocaleString()} so'm</span>
          </div>

          {/* Sotilgan narx input */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:700,color:'#5a5a72',display:'block',marginBottom:6}}>
              Sotilgan narx (ixtiyoriy)
              <span style={{fontWeight:400,color:'#9999b0',marginLeft:6}}>— chegirma bo'lsa kiriting</span>
            </label>
            <div style={{position:'relative'}}>
              <input
                type="number" inputMode="numeric" min="0" max={origTotal}
                value={finalPrice}
                onChange={e => setFinalPrice(e.target.value)}
                placeholder={origTotal.toLocaleString()}
                style={{...S, paddingRight: hasDiscount ? '100px' : '12px'}}
              />
              {hasDiscount && (
                <div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#dc2626',background:'#fef2f2',padding:'2px 8px',borderRadius:20}}>
                    −{discountPct}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Jami */}
          <div style={{background:hasDiscount?'#f0fdf4':'#eff6ff',borderRadius:12,padding:'12px 16px',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,color:'#5a5a72'}}>Jami to'lov</span>
              <div style={{textAlign:'right'}}>
                {hasDiscount && (
                  <div style={{fontSize:13,color:'#9999b0',textDecoration:'line-through',marginBottom:2}}>
                    {origTotal.toLocaleString()} so'm
                  </div>
                )}
                <div style={{fontSize:22,fontWeight:900,color:hasDiscount?'#16a34a':'#2563eb'}}>
                  {clampedFinal.toLocaleString()} so'm
                </div>
                {hasDiscount && (
                  <div style={{fontSize:11,color:'#dc2626',fontWeight:600}}>
                    {discount.toLocaleString()} so'm chegirma ({discountPct}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:10,padding:'0 18px 18px'}}>
          <button onClick={onClose}
            style={{flex:1,padding:11,borderRadius:12,border:'1.5px solid #e0ddd6',background:'white',color:'#5a5a72',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Bekor
          </button>
          <button onClick={doSell} disabled={loading}
            style={{flex:2,padding:11,borderRadius:12,border:'none',
              background:loading?'#93c5fd':hasDiscount?'#16a34a':'#2563eb',
              color:'#fff',fontSize:14,fontWeight:800,cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Saqlanmoqda...' : `✓ Sotildi — ${clampedFinal.toLocaleString()} so'm`}
          </button>
        </div>
      </div>
    </div>
  )
}
