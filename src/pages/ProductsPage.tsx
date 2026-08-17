import { api } from '../api'
import React, { useState, useEffect, useCallback } from 'react'
import { Product, Category } from '../types'
import { ProductCard } from '../components/ProductCard'
import { SellModal } from '../components/SellModal'
import { EditModal } from '../components/EditModal'
import { CartModal } from '../components/CartModal'

interface CartApi {
  cart: any[]; cartQtyMap: Record<number, number>; cartTotal: number; cartTotalQty: number
  addToCart: (p: Product) => void
  changeQty: (id: number, qty: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
}

interface Props {
  onToast:(m:string,t:'success'|'error'|'warning')=>void
  onRefresh:()=>void
  cartApi: CartApi
  forceOpenCart?: boolean
  onCartOpened?: () => void
}

export function ProductsPage({ onToast, onRefresh, cartApi, forceOpenCart, onCartOpened }: Props) {
  const [products, setProducts]   = useState<Product[]>([])
  const [cats, setCats]           = useState<Category[]>([])
  const [search, setSearch]       = useState('')
  const [catId, setCatId]         = useState<number|null>(null)
  const [sort, setSort]           = useState<'name'|'price'|'stock'>('name')
  const [selling, setSelling]     = useState<Product|null>(null)
  const [editing, setEditing]     = useState<Product|null>(null)
  const [loading, setLoading]     = useState(true)
  const [showCart, setShowCart]   = useState(false)

  const { cart, cartQtyMap, cartTotal, cartTotalQty, addToCart, changeQty, removeFromCart, clearCart } = cartApi

  useEffect(() => {
    if (forceOpenCart) { setShowCart(true); onCartOpened?.() }
  }, [forceOpenCart])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, categories] = await Promise.all([
        api.getProducts({ search: search||undefined, categoryId: catId||undefined }),
        api.getCategories()
      ])
      setProducts(prods); setCats(categories)
    } catch (e: any) {
      onToast(e?.message || "Ma'lumotlarni yuklab bo'lmadi", 'error')
    }
    setLoading(false)
  }, [search, catId])

  useEffect(() => { load() }, [load])

  const sorted = [...products].sort((a, b) => {
    if (sort === 'name')  return a.name.localeCompare(b.name)
    if (sort === 'price') return Number(b.price) - Number(a.price)
    return Number(b.stock) - Number(a.stock)
  })

  const handleSell = async (pid: number, qty: number, discount: number) => {
    try {
      const res = await api.sellProduct({ product_id: pid, quantity: qty, discount })
      if (res.ok) {
        setProducts(p => p.map(x => x.id === pid ? { ...x, stock: res.newStock! } : x))
        const msg = discount > 0
          ? `${qty} ta tovar ${res.sale?.total_amount?.toLocaleString()} so'mga sotildi ✓`
          : `${qty} ta tovar sotildi ✓`
        onToast(msg, 'success')
        onRefresh()
      } else {
        onToast(res.error || 'Xatolik', 'error')
      }
    } catch (e: any) {
      onToast(e?.message || 'Saqlashda xatolik yuz berdi', 'error')
    }
  }

  const handleCheckout = async (discount: number, extras: {name:string; amount:number}[]) => {
    if (cart.length === 0 && extras.length === 0) return
    try {
      const items = cart.map((it:any) => ({ product_id: it.product.id, quantity: it.quantity }))
      const res = await api.sellCart({ items, discount, extras })
      if (res.ok) {
        const totalQty = cart.reduce((s:number,it:any)=>s+it.quantity, 0)
        const cartLen = cart.length
        clearCart()
        setShowCart(false)
        await load()
        onToast(`${cartLen} xil tovar, ${totalQty} dona sotildi ✓`, 'success')
        onRefresh()
      } else {
        onToast(res.error || 'Xatolik', 'error')
      }
    } catch (e: any) {
      onToast(e?.message || 'Saqlashda xatolik yuz berdi', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu tovarni o'chirishni tasdiqlaysizmi?")) return
    try {
      await api.deleteProduct(id)
      setProducts(p => p.filter(x => x.id !== id))
      onToast("Tovar o'chirildi", 'success')
    } catch (e: any) {
      onToast(e?.message || "O'chirishda xatolik yuz berdi", 'error')
    }
  }

  const handleEditSave = async (p: Product) => {
    await api.updateProduct(p)
    await load()
    onToast('Tovar yangilandi', 'success')
  }

  const lowCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length
  const outCount = products.filter(p => Number(p.stock) === 0).length
  const [showOutList, setShowOutList] = useState(false)
  const [showLowList, setShowLowList] = useState(false)

  const outProducts = products.filter(p => Number(p.stock) === 0)
  const lowProducts  = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5)

  const AlertList = ({ items, onClose, title, color }: { items: Product[]; onClose:()=>void; title:string; color:string }) => (
    <div style={{ marginTop:6, marginBottom:10, background:'white', border:`1px solid ${color}`, borderRadius:10, padding:'8px 12px', fontSize:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <strong>{title}</strong>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>Yopish ×</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map(p => (
          <span key={p.id} style={{ background:'#f5f4f0', borderRadius:8, padding:'3px 8px' }}>
            {p.name} <b>({p.stock})</b>
          </span>
        ))}
      </div>
    </div>
  )

  const outPreview = outProducts.slice(0,3).map(p=>p.name).join(', ')
  const lowPreview  = lowProducts.slice(0,3).map(p=>p.name).join(', ')

  return (
    <div className="page-wrap">
      <div className="page-topbar">
        <div className="topbar-title">
          <div style={{ fontWeight:800, fontSize:17 }}>Tovarlar ombori</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>{products.length} ta tovar</div>
        </div>

        <div className="topbar-actions">
          <div className="search-box topbar-search" style={{ width:210 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tovar qidirish..."
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, lineHeight:1 }}>×</button>
            )}
          </div>

          <select value={sort} onChange={e => setSort(e.target.value as any)}
            style={{ padding:'7px 12px', borderRadius:10, border:'1px solid var(--border)', background:'white', fontSize:12, cursor:'pointer', color:'var(--text2)' }}>
            <option value="name">A–Z</option>
            <option value="price">Narx ↓</option>
            <option value="stock">Miqdor ↓</option>
          </select>

          <button
            className="desktop-cart-btn"
            onClick={() => setShowCart(true)}
            style={{
              position:'relative', padding:'7px 14px', borderRadius:10, border:'none',
              background: cartTotalQty > 0 ? 'var(--green)' : '#f0eeea',
              color: cartTotalQty > 0 ? '#fff' : 'var(--text2)',
              fontSize:13, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
              transition:'all .15s', whiteSpace:'nowrap',
            }}>
            🛒 Savatcha
            {cartTotalQty > 0 && (
              <span style={{
                background:'rgba(255,255,255,0.25)', color:'#fff',
                borderRadius:20, fontSize:11, fontWeight:900,
                padding:'1px 8px',
              }}>
                {cartTotalQty} · {cartTotal.toLocaleString()} so'm
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="page-scroll">
        {outCount > 0 && (
          <div
            onClick={() => setShowOutList(v => !v)}
            style={{ background:'var(--red-l)', border:'1px solid #fca5a5', borderRadius:10, padding:'9px 14px', marginBottom:showOutList?0:10, fontSize:13, color:'#991b1b', cursor:'pointer' }}>
            🚫 <strong>{outCount} ta tovar tugagan</strong>{outPreview && <>: {outPreview}{outCount>3?'...':''}</>} — <u>{showOutList?'yashirish':'hammasini ko\'rish'}</u>
          </div>
        )}
        {showOutList && <AlertList items={outProducts} onClose={()=>setShowOutList(false)} title="🚫 Tugagan tovarlar" color="#fca5a5"/>}

        {lowCount > 0 && (
          <div
            onClick={() => setShowLowList(v => !v)}
            style={{ background:'var(--yellow-l)', border:'1px solid #fde68a', borderRadius:10, padding:'9px 14px', marginBottom:showLowList?0:10, fontSize:13, color:'#92400e', cursor:'pointer' }}>
            ⚠️ <strong>{lowCount} ta tovar kam qoldi</strong>{lowPreview && <>: {lowPreview}{lowCount>3?'...':''}</>} — <u>{showLowList?'yashirish':'hammasini ko\'rish'}</u>
          </div>
        )}
        {showLowList && <AlertList items={lowProducts} onClose={()=>setShowLowList(false)} title="⚠️ Kam qolgan tovarlar" color="#fde68a"/>}

        <div className="pill-row" style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {[
            { id: null, name: `Hammasi (${products.length})`, emoji: '' },
            ...cats.map(c => ({
              id: c.id,
              name: `${c.name} (${products.filter(p=>p.category_id===c.id).length})`,
              emoji: c.emoji
            }))
          ].map(c => {
            const act = catId === c.id
            return (
              <button key={String(c.id)} onClick={() => setCatId(act ? null : c.id as any)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer', border:`1px solid ${act?'var(--accent)':'#e0ddd6'}`, background: act?'var(--accent-l)':'white', color: act?'var(--accent)':'var(--text2)', fontWeight: act?700:400 }}>
                {c.emoji} {c.name}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>⏳ Yuklanmoqda...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Tovar topilmadi</div>
          </div>
        ) : (
          <div className="prod-grid">
            {sorted.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onSell={setSelling}
                onEdit={setEditing}
                onDelete={handleDelete}
                onAddToCart={addToCart}
                cartQty={cartQtyMap[p.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {selling && (
        <SellModal product={selling} onClose={() => setSelling(null)} onSold={handleSell}/>
      )}
      {editing && (
        <EditModal product={editing} cats={cats} onClose={() => setEditing(null)} onSave={handleEditSave}/>
      )}
      {showCart && (
        <CartModal
          items={cart}
          onClose={() => setShowCart(false)}
          onChangeQty={changeQty}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
          onClear={clearCart}
        />
      )}
    </div>
  )
}
