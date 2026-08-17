import React, { useState } from 'react'
import { CartItem, ExtraItem } from '../types'

interface Props {
  items: CartItem[]
  onClose: () => void
  onChangeQty: (productId:number, qty:number) => void
  onRemove: (productId:number) => void
  onCheckout: (discount:number, extras:{name:string;amount:number}[]) => Promise<void>
  onClear: () => void
}

export function CartModal({ items, onClose, onChangeQty, onRemove, onCheckout, onClear }: Props) {
  const [loading,    setLoading]    = useState(false)
  const [finalPrice, setFinalPrice] = useState('')   // foydalanuvchi kiritgan jami narx
  const [extras,     setExtras]     = useState<ExtraItem[]>([])

  const itemsTotal   = items.reduce((s,it) => s + Number(it.product.price)*it.quantity, 0)
  const totalQty     = items.reduce((s,it) => s + it.quantity, 0)
  const extrasTotal  = extras.reduce((s,ex) => s + (Number(ex.amount)||0), 0)

  // Foydalanuvchi sotilgan narx kiritadi — bo'sh bo'lsa standart narx
  const finalNum     = finalPrice === '' ? itemsTotal : Number(finalPrice)
  const clampedFinal = Math.max(0, Math.min(itemsTotal, finalNum))
  const discount     = itemsTotal - clampedFinal
  const discountPct  = itemsTotal > 0 ? Math.round((discount / itemsTotal) * 1000) / 10 : 0
  const hasDiscount  = discount > 0

  const grandTotal   = clampedFinal + extrasTotal

  const handleCheckout = async () => {
    setLoading(true)
    const validExtras = extras
      .filter(ex => ex.name.trim() && Number(ex.amount) > 0)
      .map(ex => ({ name: ex.name.trim(), amount: Number(ex.amount) }))
    await onCheckout(discount, validExtras)
    setLoading(false)
  }

  const addExtra    = () => setExtras(prev => [...prev, { id: Date.now().toString(), name: '', amount: '' }])
  const updateExtra = (id:string, field:'name'|'amount', val:string) =>
    setExtras(prev => prev.map(ex => ex.id===id ? {...ex,[field]:val} : ex))
  const removeExtra = (id:string) => setExtras(prev => prev.filter(ex => ex.id!==id))

  const S: React.CSSProperties = {
    padding:'8px 10px', border:'1.5px solid #e0ddd6',
    borderRadius:9, fontSize:13, background:'#f8f7f4', color:'#1a1a2e'
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} className="modal-overlay">
      <div className="modal-box" style={{width:520}}>
        <div className="sheet-handle"><span/></div>

        {/* Header */}
        <div style={{padding:'16px 18px',borderBottom:'1px solid #f0eeea',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <span style={{fontSize:20}}>🛒</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:16}}>Savatcha</div>
            <div style={{fontSize:11,color:'#9999b0'}}>{items.length} xil tovar · {totalQty} dona</div>
          </div>
          {items.length > 0 && (
            <button onClick={onClear}
              style={{fontSize:12,color:'#dc2626',background:'#fef2f2',border:'none',cursor:'pointer',padding:'5px 10px',borderRadius:8,fontWeight:600}}>
              Tozalash
            </button>
          )}
          <button onClick={onClose} className="modal-close-btn" style={{marginLeft:4}}>×</button>
        </div>

        {/* Scroll area */}
        <div style={{flex:1,overflowY:'auto'}}>

          {/* Cart items */}
          {items.length === 0 ? (
            <div style={{textAlign:'center',padding:'36px 20px',color:'#9999b0'}}>
              <div style={{fontSize:40,marginBottom:10}}>🛒</div>
              <div style={{fontWeight:600,fontSize:14}}>Savatcha bo'sh</div>
              <div style={{fontSize:12,marginTop:4}}>Tovar kartasidagi 🛒 tugmasini bosing</div>
            </div>
          ) : (
            items.map((item,idx) => {
              const maxStock = item.product.stock
              return (
                <div key={item.product.id} className="cart-item-row" style={{flexWrap:'wrap',
                    borderBottom:idx<items.length-1?'1px solid #f5f4f0':'none'}}>
                  <div style={{width:38,height:38,borderRadius:10,background:'#f5f4f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {item.product.category_emoji||'📦'}
                  </div>
                  <div style={{flex:'1 1 120px',minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.product.name}</div>
                    <div style={{fontSize:11,color:'#9999b0'}}>{Number(item.product.price).toLocaleString()} so'm/dona · {maxStock} ta</div>
                  </div>
                  <div className="cart-item-controls" style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                      <button onClick={()=>item.quantity>1&&onChangeQty(item.product.id,item.quantity-1)} disabled={item.quantity<=1}
                        style={{width:26,height:26,borderRadius:7,background:item.quantity<=1?'#f0eeea':'#eff6ff',color:item.quantity<=1?'#9999b0':'#2563eb',border:'none',cursor:item.quantity<=1?'not-allowed':'pointer',fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                      <input type="number" inputMode="numeric" min="1" max={maxStock} value={item.quantity}
                        onChange={e=>{const n=parseInt(e.target.value);if(!isNaN(n)&&n>=1&&n<=maxStock)onChangeQty(item.product.id,n)}}
                        style={{width:42,height:26,textAlign:'center',border:'1.5px solid #e0ddd6',borderRadius:7,fontSize:13,fontWeight:700,background:'#f8f7f4',color:'#1a1a2e'}}/>
                      <button onClick={()=>item.quantity<maxStock&&onChangeQty(item.product.id,item.quantity+1)} disabled={item.quantity>=maxStock}
                        style={{width:26,height:26,borderRadius:7,background:item.quantity>=maxStock?'#f0eeea':'#eff6ff',color:item.quantity>=maxStock?'#9999b0':'#2563eb',border:'none',cursor:item.quantity>=maxStock?'not-allowed':'pointer',fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    </div>
                    <div style={{minWidth:78,textAlign:'right',fontWeight:800,fontSize:13,color:'#16a34a',flexShrink:0}}>
                      {(Number(item.product.price)*item.quantity).toLocaleString()}
                    </div>
                    <button onClick={()=>onRemove(item.product.id)}
                      style={{width:26,height:26,borderRadius:7,background:'#fef2f2',border:'none',cursor:'pointer',color:'#dc2626',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
                  </div>
                </div>
              )
            })
          )}

          {/* Qo'shimcha to'lovlar */}
          <div style={{padding:'12px 16px',borderTop:'1px solid #f0eeea',background:'#fafaf8'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:extras.length>0?10:0}}>
              <div style={{fontSize:12,fontWeight:700,color:'#5a5a72'}}>💸 Qo'shimcha to'lovlar</div>
              <button onClick={addExtra}
                style={{padding:'4px 10px',borderRadius:8,border:'1px solid #e0ddd6',background:'white',fontSize:12,fontWeight:700,cursor:'pointer',color:'#2563eb'}}>
                + Qo'shish
              </button>
            </div>
            {extras.map(ex => (
              <div key={ex.id} className="extra-row" style={{display:'flex',gap:6,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                <span style={{fontSize:16,flexShrink:0}}>💸</span>
                <input value={ex.name} onChange={e=>updateExtra(ex.id,'name',e.target.value)}
                  placeholder="Nomi (masalan: Qarz qaytarish)"
                  style={{...S,flex:'1 1 140px',minWidth:0}}/>
                <input type="number" inputMode="numeric" min="0" value={ex.amount} onChange={e=>updateExtra(ex.id,'amount',e.target.value)}
                  placeholder="Summa"
                  style={{...S,width:110}}/>
                <button onClick={()=>removeExtra(ex.id)}
                  style={{width:28,height:28,borderRadius:7,background:'#fef2f2',border:'none',cursor:'pointer',color:'#dc2626',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
              </div>
            ))}
          </div>

          {/* Standart narx + sotilgan narx input */}
          {items.length > 0 && (
            <div style={{padding:'12px 16px',borderTop:'1px solid #f0eeea'}}>

              {/* Standart narx */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                background:'#f8f7f4',borderRadius:10,padding:'9px 13px',marginBottom:10}}>
                <span style={{fontSize:12,color:'#9999b0'}}>Standart narx ({totalQty} dona)</span>
                <span style={{fontSize:14,fontWeight:700,color:'#1a1a2e'}}>{itemsTotal.toLocaleString()} so'm</span>
              </div>

              {/* Sotilgan narx */}
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'#5a5a72',display:'block',marginBottom:6}}>
                  Sotilgan narx (ixtiyoriy)
                  <span style={{fontWeight:400,color:'#9999b0',marginLeft:6}}>— chegirma bo'lsa kiriting</span>
                </label>
                <div style={{position:'relative'}}>
                  <input
                    type="number" inputMode="numeric" min="0" max={itemsTotal}
                    value={finalPrice}
                    onChange={e => setFinalPrice(e.target.value)}
                    placeholder={itemsTotal.toLocaleString()}
                    style={{...S, width:'100%', paddingRight: hasDiscount ? '100px' : '12px'}}
                  />
                  {hasDiscount && (
                    <div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)'}}>
                      <span style={{fontSize:11,fontWeight:700,color:'#dc2626',background:'#fef2f2',padding:'2px 8px',borderRadius:20}}>
                        −{discountPct}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(items.length > 0 || extras.length > 0) && (
          <div style={{borderTop:'1px solid #f0eeea',padding:'14px 18px',flexShrink:0}}>

            {/* Summary */}
            <div style={{marginBottom:12,background:hasDiscount?'#f0fdf4':'#eff6ff',borderRadius:12,padding:'12px 14px'}}>
              {hasDiscount && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#9999b0',marginBottom:4}}>
                  <span>Standart narx</span>
                  <span style={{textDecoration:'line-through'}}>{itemsTotal.toLocaleString()} so'm</span>
                </div>
              )}
              {hasDiscount && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#dc2626',marginBottom:4}}>
                  <span>Chegirma (−{discountPct}%)</span>
                  <span>−{discount.toLocaleString()} so'm</span>
                </div>
              )}
              {extrasTotal > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#d97706',marginBottom:4}}>
                  <span>💸 Qo'shimcha</span>
                  <span>+{extrasTotal.toLocaleString()} so'm</span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                borderTop:(hasDiscount||extrasTotal>0)?'1px solid rgba(0,0,0,.06)':'none',
                paddingTop:(hasDiscount||extrasTotal>0)?8:0}}>
                <span style={{fontSize:13,color:'#5a5a72'}}>Jami to'lov</span>
                <span style={{fontSize:22,fontWeight:900,color:hasDiscount?'#16a34a':'#2563eb'}}>
                  {grandTotal.toLocaleString()} so'm
                </span>
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={onClose}
                style={{flex:1,padding:11,borderRadius:12,border:'1.5px solid #e0ddd6',background:'white',fontSize:14,fontWeight:600,cursor:'pointer',color:'#5a5a72'}}>
                Davom etish
              </button>
              <button onClick={handleCheckout} disabled={loading}
                style={{flex:2,padding:11,borderRadius:12,border:'none',
                  background:loading?'#93c5fd':hasDiscount?'#16a34a':'#2563eb',
                  color:'#fff',fontSize:14,fontWeight:800,cursor:loading?'not-allowed':'pointer'}}>
                {loading ? 'Saqlanmoqda...' : `✓ Sotish — ${grandTotal.toLocaleString()} so'm`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
