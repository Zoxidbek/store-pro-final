const express  = require('express')
const path     = require('path')
const http     = require('http')
const { MongoClient } = require('mongodb')

const app  = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('\n❌ XATOLIK: MONGODB_URI environment variable topilmadi!')
  console.error('Render dashboard → Environment → MONGODB_URI qo\'shing.\n')
  process.exit(1)
}

let db, categoriesCol, productsCol, salesCol, countersCol, imagesCol

function pad(n) { return n < 10 ? '0'+n : ''+n }
function ts() {
  const d = new Date()
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+
         ' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())
}
function today() {
  const d = new Date()
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())
}

// MongoDB da avtomatik o'suvchi raqamli ID (frontend numeric id kutadi)
async function nextId(name) {
  const res = await countersCol.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  return res.seq
}

async function getCat(id)  { return id ? categoriesCol.findOne({ id }) : null }
async function getProd(id) { return productsCol.findOne({ id }) }

async function connectDB() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db('storepro')
  categoriesCol = db.collection('categories')
  productsCol   = db.collection('products')
  salesCol      = db.collection('sales')
  countersCol   = db.collection('counters')
  imagesCol     = db.collection('images')

  await categoriesCol.createIndex({ id: 1 }, { unique: true })
  await productsCol.createIndex({ id: 1 }, { unique: true })
  await salesCol.createIndex({ id: 1 }, { unique: true })
  await salesCol.createIndex({ session_id: 1 })
  await imagesCol.createIndex({ filename: 1 }, { unique: true })

  console.log('✅ MongoDB ga ulandi')

  // Birinchi marta ishga tushganda default kategoriyalar
  const count = await categoriesCol.countDocuments()
  if (count === 0) {
    const cats = [
      {name:'Asbob-uskunalar',emoji:'🔧'},{name:'Uy jihozlari',emoji:'🏠'},
      {name:'Elektr mollari',emoji:'💡'},{name:'Santexnika',emoji:'🚿'},
      {name:'Qurilish mollari',emoji:'🏗️'},{name:'Boshqa',emoji:'📦'}
    ]
    for (const c of cats) {
      const id = await nextId('categories')
      await categoriesCol.insertOne({ id, name:c.name, emoji:c.emoji, created_at:ts() })
    }
    console.log('Default kategoriyalar yaratildi')
  }
}

// ─── Middleware ───────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// Har bir so'rov uchun DB tayyorligini tekshirish
app.use((req, res, next) => {
  if (!db) return res.status(503).json({ ok:false, error:'Server hali tayyor emas, biroz kuting...' })
  next()
})

// ─── CATEGORIES ──────────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  const list = await categoriesCol.find({}, { projection:{_id:0} }).sort({ name:1 }).toArray()
  res.json(list)
})

app.post('/api/categories', async (req, res) => {
  const { name, emoji } = req.body
  const ex = await categoriesCol.findOne({ name: { $regex: `^${name}$`, $options:'i' } }, { projection:{_id:0} })
  if (ex) return res.json(ex)
  const id = await nextId('categories')
  const cat = { id, name, emoji:emoji||'📦', created_at:ts() }
  await categoriesCol.insertOne(cat)
  delete cat._id
  res.json(cat)
})

app.delete('/api/categories/:id', async (req, res) => {
  await categoriesCol.deleteOne({ id: parseInt(req.params.id) })
  res.json({ ok:true })
})

// ─── PRODUCTS ────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  const { search, categoryId } = req.query
  const query = {}
  if (categoryId) query.category_id = parseInt(categoryId)
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search, $options:'i' } },
      { description: { $regex: search, $options:'i' } }
    ]
  }
  const products = await productsCol.find(query, { projection:{_id:0} }).sort({ name:1 }).toArray()
  const cats = await categoriesCol.find({}, { projection:{_id:0} }).toArray()
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
  const list = products.map(p => {
    const c = catMap[p.category_id]
    return { ...p, category_name:c?c.name:'', category_emoji:c?c.emoji:'📦' }
  })
  res.json(list)
})

app.post('/api/products', async (req, res) => {
  const b = req.body
  const c = await getCat(b.category_id)
  const id = await nextId('products')
  const p = {
    id, name:b.name, category_id:b.category_id,
    price:Number(b.price), stock:Number(b.stock),
    description:b.description||'', image_path:b.image_path||'',
    created_at:ts(), updated_at:ts()
  }
  await productsCol.insertOne(p)
  delete p._id
  res.json({ ...p, category_name:c?c.name:'', category_emoji:c?c.emoji:'📦' })
})

app.put('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const b  = req.body
  const update = { updated_at: ts() }
  if (b.name         !== undefined) update.name = b.name
  if (b.category_id  !== undefined) update.category_id = b.category_id
  if (b.price        !== undefined) update.price = Number(b.price)
  if (b.stock        !== undefined) update.stock = Number(b.stock)
  if (b.description  !== undefined) update.description = b.description || ''
  if (b.image_path   !== undefined) update.image_path = b.image_path || ''
  await productsCol.updateOne({ id }, { $set: update })
  res.json({ ok:true })
})

app.delete('/api/products/:id', async (req, res) => {
  await productsCol.deleteOne({ id: parseInt(req.params.id) })
  res.json({ ok:true })
})

// ─── SELL - yakka ────────────────────────────────────────────────
app.post('/api/sell', async (req, res) => {
  const { product_id, quantity, discount:disc=0 } = req.body
  const product = await getProd(product_id)
  if (!product) return res.json({ ok:false, error:'Tovar topilmadi' })
  if (product.stock < quantity) return res.json({ ok:false, error:"Yetarli tovar yo'q" })

  const cat       = await getCat(product.category_id)
  const origTotal = product.price * quantity
  const discount  = Number(disc) || 0
  const finalTotal = Math.max(0, origTotal - discount)
  const discPct   = origTotal > 0 ? Math.round((discount/origTotal)*1000)/10 : 0

  const newStock = product.stock - quantity
  await productsCol.updateOne({ id:product_id }, { $set:{ stock:newStock, updated_at:ts() } })

  const id = await nextId('sales')
  const sale = {
    id, product_id, product_name:product.name,
    category_name:cat?cat.name:'', category_emoji:cat?cat.emoji:'📦',
    quantity:Number(quantity), price_per_unit:product.price,
    original_total:origTotal, discount, discount_pct:discPct,
    total_amount:finalTotal, sold_at:ts(), session_id:null, is_extra:false
  }
  await salesCol.insertOne(sale)
  delete sale._id
  res.json({ ok:true, sale, newStock })
})

// ─── SELL CART ───────────────────────────────────────────────────
app.post('/api/sell-cart', async (req, res) => {
  const { items=[], extras=[], discount:disc=0 } = req.body
  const discount = Number(disc) || 0

  const products = {}
  for (const it of items) {
    const prod = await getProd(it.product_id)
    if (!prod) return res.json({ ok:false, error:'Tovar topilmadi' })
    if (prod.stock < it.quantity) return res.json({ ok:false, error:`${prod.name} dan yetarli yo'q (mavjud: ${prod.stock})` })
    products[it.product_id] = prod
  }

  const sid = ts()
  const sales = []
  let itemsTotal = 0

  for (const it of items) {
    const p = products[it.product_id]
    const c = await getCat(p.category_id)
    const orig = p.price * it.quantity
    itemsTotal += orig

    const newStock = p.stock - it.quantity
    await productsCol.updateOne({ id:p.id }, { $set:{ stock:newStock, updated_at:ts() } })
    p.stock = newStock // keyingi item hisobida to'g'ri bo'lishi uchun (bir xil tovar 2 marta bo'lmaydi lekin xavfsizlik uchun)

    const id = await nextId('sales')
    const sale = {
      id, product_id:it.product_id, product_name:p.name,
      category_name:c?c.name:'', category_emoji:c?c.emoji:'📦',
      quantity:Number(it.quantity), price_per_unit:p.price,
      original_total:orig, discount:0, discount_pct:0,
      total_amount:orig, sold_at:ts(), session_id:sid, is_extra:false
    }
    sales.push(sale)
  }

  if (discount > 0 && sales.length > 0) {
    let remaining = discount
    for (let m = 0; m < sales.length; m++) {
      const ratio    = itemsTotal > 0 ? sales[m].original_total / itemsTotal : 1/sales.length
      const saleDisc = m === sales.length-1 ? remaining : Math.round(ratio * discount)
      remaining -= saleDisc
      sales[m].discount     = saleDisc
      sales[m].total_amount = Math.max(0, sales[m].original_total - saleDisc)
      sales[m].discount_pct = sales[m].original_total > 0 ? Math.round((saleDisc/sales[m].original_total)*1000)/10 : 0
    }
  }

  for (const ex of extras) {
    const amt = Number(ex.amount) || 0
    if (!amt) continue
    const id = await nextId('sales')
    sales.push({
      id, product_id:null, product_name:ex.name||"Qo'shimcha to'lov",
      category_name:'', category_emoji:'💸',
      quantity:1, price_per_unit:amt,
      original_total:amt, discount:0, discount_pct:0,
      total_amount:amt, sold_at:ts(), session_id:sid, is_extra:true
    })
  }

  if (sales.length > 0) await salesCol.insertMany(sales.map(s => ({...s})))
  sales.forEach(s => delete s._id)

  res.json({ ok:true, sales, session_id:sid })
})

// ─── SALES ───────────────────────────────────────────────────────
app.get('/api/sales', async (req, res) => {
  const limit  = parseInt(req.query.limit)  || 2000
  const offset = parseInt(req.query.offset) || 0
  const sales = await salesCol.find({}, { projection:{_id:0} }).sort({ id:-1 }).skip(offset).limit(limit).toArray()
  const total = await salesCol.countDocuments()
  res.json({ sales, total })
})

app.delete('/api/sales/:id', async (req, res) => {
  const id   = parseInt(req.params.id)
  const sale = await salesCol.findOne({ id })
  if (sale && !sale.is_extra) {
    const p = await getProd(sale.product_id)
    if (p) await productsCol.updateOne({ id:p.id }, { $set:{ stock: p.stock + sale.quantity, updated_at:ts() } })
  }
  await salesCol.deleteOne({ id })
  res.json({ ok:true })
})

app.delete('/api/sessions/:sid', async (req, res) => {
  const sid = req.params.sid
  const toDelete = await salesCol.find({ session_id: sid }).toArray()
  for (const sale of toDelete) {
    if (!sale.is_extra) {
      const p = await getProd(sale.product_id)
      if (p) await productsCol.updateOne({ id:p.id }, { $set:{ stock: p.stock + sale.quantity, updated_at:ts() } })
    }
  }
  await salesCol.deleteMany({ session_id: sid })
  res.json({ ok:true })
})

// ─── STATS ───────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const allSales    = await salesCol.find({}, { projection:{_id:0} }).toArray()
  const allProducts = await productsCol.find({}, { projection:{_id:0} }).toArray()
  const td = today()
  const tdS = allSales.filter(s => s.sold_at && s.sold_at.startsWith(td))

  let totalRev=0, totalSold=0, totalStock=0, tdRev=0
  allSales.forEach(s => { totalRev += s.total_amount; if(!s.is_extra) totalSold += s.quantity })
  allProducts.forEach(p => totalStock += p.stock)
  const lowStock = allProducts.filter(p => p.stock <= 5).length
  tdS.forEach(s => tdRev += s.total_amount)

  const catMap = {}
  allSales.filter(s => !s.is_extra).forEach(s => {
    const k = s.category_name || 'Boshqa'
    if (!catMap[k]) catMap[k] = { revenue:0, sold:0 }
    catMap[k].revenue += s.total_amount; catMap[k].sold += s.quantity
  })
  const byCat = Object.entries(catMap)
    .map(([k,v]) => ({ category_name:k, ...v }))
    .sort((a,b) => b.revenue - a.revenue)

  const dayMap = {}
  for (let i=6; i>=0; i--) {
    const d = new Date(Date.now() - i*86400000)
    const key = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())
    dayMap[key] = { day:key, revenue:0, sold:0 }
  }
  allSales.forEach(s => {
    const dk = (s.sold_at||'').split(' ')[0]
    if (dk && dayMap[dk]) { dayMap[dk].revenue += s.total_amount; if(!s.is_extra) dayMap[dk].sold += s.quantity }
  })

  const prodMap = {}
  allSales.filter(s => !s.is_extra).forEach(s => {
    if (!prodMap[s.product_name]) prodMap[s.product_name] = { sold:0, revenue:0 }
    prodMap[s.product_name].sold += s.quantity; prodMap[s.product_name].revenue += s.total_amount
  })
  const top = Object.entries(prodMap)
    .map(([k,v]) => ({ product_name:k, ...v }))
    .sort((a,b) => b.sold - a.sold).slice(0,5)

  res.json({
    totalRevenue:totalRev, totalSold, totalProducts:allProducts.length,
    totalStock, lowStock, todayRevenue:tdRev, todaySales:tdS.length,
    byCat, last7days:Object.values(dayMap), topProducts:top
  })
})

// ─── EXPENSES (harajatlar) ────────────────────────────────────────
let expensesCol
app.get('/api/expenses', async (req, res) => {
  const list = await expensesCol.find({}, { projection:{_id:0} }).sort({ id:-1 }).toArray()
  res.json(list)
})
app.post('/api/expenses', async (req, res) => {
  const b = req.body
  if (!b.name || !b.amount) return res.json({ ok:false, error:'Nom va summa kiritilishi shart' })
  const id = await nextId('expenses')
  const exp = { id, name:b.name.trim(), amount:Number(b.amount), note:b.note||'', date:today(), created_at:ts() }
  await expensesCol.insertOne(exp)
  delete exp._id
  res.json(exp)
})
app.delete('/api/expenses/:id', async (req, res) => {
  await expensesCol.deleteOne({ id: parseInt(req.params.id) })
  res.json({ ok:true })
})
app.get('/api/expense-stats', async (req, res) => {
  const td = today()
  const allExp   = await expensesCol.find({}, { projection:{_id:0} }).toArray()
  const allSales = await salesCol.find({}, { projection:{_id:0} }).toArray()

  let totalExpenses=0, todayExpenses=0, totalRevenue=0, todayRevenue=0
  allExp.forEach(e => { totalExpenses += Number(e.amount); if (e.date===td) todayExpenses += Number(e.amount) })
  allSales.forEach(s => { totalRevenue += s.total_amount; if (s.sold_at && s.sold_at.startsWith(td)) todayRevenue += s.total_amount })

  res.json({
    totalExpenses, todayExpenses, totalRevenue, todayRevenue,
    netProfit: totalRevenue - totalExpenses,
    todayNetProfit: todayRevenue - todayExpenses
  })
})

// ─── IMAGES (MongoDB da saqlanadi — disk kerak emas) ─────────────
app.post('/api/images', async (req, res) => {
  const { filename, data } = req.body
  const mimetype = filename.match(/\.(png|gif|webp)$/i)
    ? `image/${filename.split('.').pop().toLowerCase()}`
    : 'image/jpeg'
  await imagesCol.updateOne(
    { filename },
    { $set: { filename, data, mimetype, created_at: ts() } },
    { upsert: true }
  )
  res.json({ url: '/imgs/' + filename })
})

app.get('/imgs/:filename', async (req, res) => {
  const img = await imagesCol.findOne({ filename: req.params.filename })
  if (!img) return res.status(404).end()
  res.set('Content-Type', img.mimetype || 'image/jpeg')
  res.set('Cache-Control', 'public, max-age=31536000')
  res.send(Buffer.from(img.data, 'base64'))
})

app.get('/api/db-status', async (req, res) => {
  res.json({ connected: !!db, database: 'MongoDB Atlas' })
})

// ─── SPA fallback ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ─── START ───────────────────────────────────────────────────────
connectDB().then(() => {
  expensesCol = db.collection('expenses')
  http.createServer(app).listen(PORT, () => {
    console.log(`\n✅ StorePro server ishga tushdi: http://localhost:${PORT}\n`)
  })
}).catch(err => {
  console.error('❌ MongoDB ulanishida xatolik:', err.message)
  process.exit(1)
})
