// Electron window.api o'rniga fetch ishlatadi
// Barcha komponentlar shu faylni import qiladi

// MUHIM: server xatolik bilan javob bersa (masalan MongoDB ulanmagan — 503),
// buni albatta throw qilamiz. Aks holda komponent "muvaffaqiyatli saqlandi"
// deb ko'rsatadi-yu, aslida hech narsa bazaga yozilmagan bo'ladi —
// foydalanuvchiga "tovar qo'shdim-u, keyin g'oyib bo'ldi" deb ko'rinadi.
//
// Diqqat: bu faqat HTTP xato statuslarini (4xx/5xx) ushlaydi. Server 200
// bilan birga { ok:false, error:'...' } qaytarsa (masalan "yetarli tovar
// yo'q" kabi oddiy biznes holatlari) — bu throw qilinmaydi, chunki
// chaqiruvchi kod buni o'zi res.ok orqali tekshirib, foydalanuvchiga
// ko'rsatishi kerak.
async function handleRes(res: Response) {
  if (!res.ok) {
    let msg = `Server xatoligi (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch { /* body JSON emas — status kodi bilan cheklanamiz */ }
    throw new Error(msg)
  }
  return res.json()
}

async function get(url: string) {
  const res = await fetch(url)
  return handleRes(res)
}
async function post(url: string, data: any) {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleRes(res)
}
async function put(url: string, data: any) {
  const res = await fetch(url, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleRes(res)
}
async function del(url: string) {
  const res = await fetch(url, { method: 'DELETE' })
  return handleRes(res)
}

// Rasmni brauzerda siqib, kichik base64 (data URI) ga aylantiradi.
// Serverga alohida yuklash shart emas — to'g'ridan-to'g'ri mahsulot ma'lumoti bilan ketadi.
function compressImage(file: File, maxDim = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Fayl o\'qilmadi'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Rasm yuklanmadi'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim/width)); width = maxDim }
        else if (height > maxDim) { width = Math.round(width * (maxDim/height)); height = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export const api = {
  // Categories
  getCategories: () => get('/api/categories'),
  addCategory:   (d: any) => post('/api/categories', d),
  deleteCategory:(id: number) => del(`/api/categories/${id}`),

  // Products
  getProducts: (f?: { search?: string; categoryId?: number }) => {
    const params = new URLSearchParams()
    if (f?.search)     params.set('search',     f.search)
    if (f?.categoryId) params.set('categoryId', String(f.categoryId))
    const q = params.toString()
    return get('/api/products' + (q ? '?'+q : ''))
  },
  addProduct:    (p: any) => post('/api/products', p),
  updateProduct: (p: any) => put(`/api/products/${p.id}`, p),
  deleteProduct: (id: number) => del(`/api/products/${id}`),
  updateStock:   (d: { id: number; stock: number }) =>
    put(`/api/products/${d.id}`, { stock: d.stock }),

  // Sell
  sellProduct: (d: { product_id: number; quantity: number; discount?: number }) =>
    post('/api/sell', d),
  sellCart: (d: { items: any[]; discount?: number; extras?: any[] }) =>
    post('/api/sell-cart', d),

  // Sales
  getSales: (o?: { limit?: number; offset?: number }) => {
    const params = new URLSearchParams()
    if (o?.limit)  params.set('limit',  String(o.limit))
    if (o?.offset) params.set('offset', String(o.offset))
    const q = params.toString()
    return get('/api/sales' + (q ? '?'+q : ''))
  },
  deleteSale:    (id: number) => del(`/api/sales/${id}`),
  deleteSession: (sid: string) => del(`/api/sessions/${encodeURIComponent(sid)}`),

  // Stats
  getStats: () => get('/api/stats'),

  // Images — endi to'g'ridan-to'g'ri brauzerda siqiladi, serverga alohida yuklanmaydi
  compressImage,
  getImageData: async (imgPath: string): Promise<string | null> => {
    if (!imgPath) return null
    // data: URI, /imgs/ yoki http bo'lsa to'g'ridan-to'g'ri src sifatida ishlatiladi
    if (imgPath.startsWith('data:') || imgPath.startsWith('/imgs/') || imgPath.startsWith('http')) return imgPath
    return null
  },
  getDbStatus: () => get('/api/db-status'),
}
