import { api } from '../api'
import { useState, useEffect } from 'react'
import { CartItem, Product } from '../types'

const CART_KEY = 'storepro_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {}
}

export function useCart() {
  const [cart, setCartState] = useState<CartItem[]>(() => loadCart())

  // cart o'zgarganda localStorage ga yoz
  const setCart = (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCartState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveCart(next)
      return next
    })
  }

  // Sahifa yuklanganida product ma'lumotlarini yangilash
  // (narx yoki nom o'zgargan bo'lishi mumkin)
  const syncWithProducts = async () => {
    const saved = loadCart()
    if (saved.length === 0) return
    try {
      const allProducts = await api.getProducts()
      const synced = saved
        .map(item => {
          const fresh = allProducts.find(p => p.id === item.product.id)
          if (!fresh) return null // tovar o'chirilgan
          // Stock yetarli emasligini tekshir
          const qty = Math.min(item.quantity, fresh.stock)
          if (qty <= 0) return null
          return { product: fresh, quantity: qty }
        })
        .filter(Boolean) as CartItem[]
      setCart(synced)
    } catch {}
  }

  useEffect(() => {
    syncWithProducts()
  }, [])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(it => it.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(it =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + 1 }
            : it
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const changeQty = (productId: number, qty: number) => {
    setCart(prev =>
      prev.map(it =>
        it.product.id === productId ? { ...it, quantity: qty } : it
      )
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(it => it.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartQtyMap: Record<number, number> = {}
  cart.forEach(it => { cartQtyMap[it.product.id] = it.quantity })

  const cartTotal = cart.reduce(
    (s, it) => s + Number(it.product.price) * it.quantity, 0
  )
  const cartTotalQty = cart.reduce((s, it) => s + it.quantity, 0)

  return {
    cart,
    cartQtyMap,
    cartTotal,
    cartTotalQty,
    addToCart,
    changeQty,
    removeFromCart,
    clearCart,
  }
}
