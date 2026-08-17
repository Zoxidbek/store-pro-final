import { api } from './api'
import React, { useState, useEffect, useCallback } from 'react'
import { Page } from './types'
import { Sidebar } from './components/Sidebar'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import { useCart } from './hooks/useCart'
import { ProductsPage } from './pages/ProductsPage'
import { SoldPage } from './pages/SoldPage'
import { AddPage } from './pages/AddPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const [page, setPage]           = useState<Page>('products')
  const [lowStock, setLowStock]   = useState(0)
  const [soldToday, setSoldToday] = useState(0)
  const { toasts, toast }         = useToast()

  // Cart App darajasida — mobil topbardagi 🛒 tugmasi ham ishlatadi
  const cartApi = useCart()
  const [showCartFromTopbar, setShowCartFromTopbar] = useState(false)

  const refreshBadges = useCallback(async () => {
    const [prods, salesRes] = await Promise.all([
      api.getProducts(),
      api.getSales({ limit: 1000 })
    ])
    setLowStock(prods.filter(p => p.stock <= 5).length)
    const today = (() => {
      const d = new Date()
      const p = (n: number) => String(n).padStart(2,'0')
      return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
    })()
    setSoldToday(salesRes.sales.filter(s => s.sold_at && s.sold_at.startsWith(today)).length)
  }, [])

  useEffect(() => { refreshBadges() }, [refreshBadges])

  const onToast = (m: string, t: 'success'|'error'|'warning') => toast[t](m)

  const renderPage = () => {
    switch (page) {
      case 'products':
        return (
          <ProductsPage
            onToast={onToast}
            onRefresh={refreshBadges}
            cartApi={cartApi}
            forceOpenCart={showCartFromTopbar}
            onCartOpened={() => setShowCartFromTopbar(false)}
          />
        )
      case 'sold':     return <SoldPage     onToast={onToast} onRefresh={refreshBadges}/>
      case 'add':      return <AddPage      onToast={onToast}/>
      case 'stats':    return <StatsPage/>
      case 'settings': return <SettingsPage onToast={onToast}/>
      default:         return null
    }
  }

  const handleMobileCartOpen = () => {
    // Agar boshqa sahifada bo'lsa, avval sotuv sahifasiga o'tkazamiz, keyin cart ochiladi
    setPage('products')
    setShowCartFromTopbar(true)
  }

  return (
    <div className="app-layout">
      <Sidebar
        page={page}
        onNav={p => { setPage(p); refreshBadges() }}
        lowStock={lowStock}
        soldToday={soldToday}
        cartQty={cartApi.cartTotalQty}
        onCartOpen={handleMobileCartOpen}
      />
      <main className="app-main">
        {renderPage()}
      </main>
      <ToastContainer toasts={toasts}/>
    </div>
  )
}
