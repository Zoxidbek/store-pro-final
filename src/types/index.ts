export interface Category { id:number; name:string; emoji:string; created_at:string }

export interface Product {
  id:number; name:string; category_id:number
  category_name:string; category_emoji:string
  price:number; stock:number; description:string
  image_path:string; created_at:string; updated_at:string
}

export interface Sale {
  id:number; product_id:number|null; product_name:string
  category_name:string; category_emoji:string
  quantity:number; price_per_unit:number
  original_total:number; discount:number; discount_pct:number
  total_amount:number; sold_at:string
  session_id:string|null; is_extra:boolean
}

export interface CartItem { product:Product; quantity:number }
export interface ExtraItem { id:string; name:string; amount:string }

export interface Stats {
  totalRevenue:number; totalSold:number; totalProducts:number
  totalStock:number; lowStock:number; todayRevenue:number; todaySales:number
  byCat:{category_name:string;revenue:number;sold:number}[]
  last7days:{day:string;revenue:number;sold:number}[]
  topProducts:{product_name:string;sold:number;revenue:number}[]
}

export type Page = 'products'|'sold'|'add'|'stats'|'settings'
