const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { parse } = require('querystring');

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DB_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const sessions = new Set();
const statuses = ['Pending Confirmation', 'Confirmed', 'Preparing', 'Out for Delivery', 'Completed', 'Cancelled'];

// Simple multipart form parser for plain Node.js HTTP
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      // Not multipart, parse as regular form data
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = parse(body);
          resolve({ files: {}, body: parsed });
        } catch (e) {
          resolve({ files: {}, body: {} });
        }
      });
      return;
    }

    // Parse multipart form data
    const boundary = contentType.split('boundary=')[1];
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = buffer.toString('binary').split('--' + boundary);
        const files = {};
        const body = {};

        parts.forEach(part => {
          if (!part || part.includes('--')) return;
          const [header, ...contentParts] = part.split('\r\n\r\n');
          const content = contentParts.join('\r\n\r\n').replace(/\r\n$/, '');
          
          const nameMatch = header.match(/name="([^"]+)"/);
          const filenameMatch = header.match(/filename="([^"]+)"/);
          
          if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
              // It's a file
              const filename = filenameMatch[1];
              if (filename) {
                const ext = path.extname(filename);
                const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
                const filePath = path.join(UPLOAD_DIR, uniqueName);
                
                if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                fs.writeFileSync(filePath, Buffer.from(content, 'binary'));
                files[name] = [{ filename: uniqueName, originalname: filename }];
              }
            } else {
              // It's a regular field
              body[name] = content;
            }
          }
        });

        resolve({ files, body });
      } catch (e) {
        reject(e);
      }
    });
  });
}

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function now() { return new Date().toISOString(); }
function money(value) { return Math.round(Number(value || 0) * 100) / 100; }
function newOrderNumber() { return 'CC-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }

const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220"><rect width="300" height="220" rx="24" fill="#fff3df"/><circle cx="105" cy="108" r="62" fill="#8b4a2f"/><circle cx="130" cy="84" r="8" fill="#3a2117"/><circle cx="88" cy="126" r="7" fill="#3a2117"/><circle cx="124" cy="137" r="6" fill="#3a2117"/><path d="M184 75h54v54h-54zM197 88v28h28V88zM184 145h54v28h-54z" fill="#8b4a2f"/><text x="150" y="202" font-size="16" text-anchor="middle" fill="#8b4a2f" font-family="Arial">Cookie placeholder</text></svg>');

function seedData() {
  return {
    nextIds: { products: 13, orders: 1, order_items: 1, admins: 2, inquiries: 1 },
    admins: [{ id: 1, username: 'admin', password_hash: hash('admin123'), created_at: now() }],
    products: [
      { id: 1, name: "Chocolate Chip Cookie", category: "Classic", description: "A golden, chewy classic loaded with melty chocolate chips and just the right buttery finish. The kind of cookie that tastes like merienda at home.", ingredients: "Flour, butter, brown sugar, eggs, chocolate chips, vanilla, salt", price: 55, image_url: placeholder, featured: true, is_active: true, created_at: now(), updated_at: now() },
      { id: 2, name: "Biscoff Cookie", category: "Special", description: "A soft cookie with caramelized Biscoff flavor, cookie butter richness, and a cozy spiced crunch in every bite.", ingredients: "Flour, butter, brown sugar, eggs, Biscoff spread, Biscoff crumbs, vanilla", price: 55, image_url: placeholder, featured: true, is_active: true, created_at: now(), updated_at: now() },
      { id: 3, name: "Red Velvet Cookie", category: "Special", description: "Velvety cocoa cookie with a soft red crumb and creamy white chocolate notes for a sweet, bakery-style treat.", ingredients: "Flour, cocoa, butter, eggs, sugar, white chocolate, vanilla", price: 55, image_url: placeholder, featured: true, is_active: true, created_at: now(), updated_at: now() },
      { id: 4, name: "Oatmeal Walnut Cookie", category: "Nutty", description: "Chewy oats, toasted walnuts, and warm brown sugar flavor for a comforting cookie that feels homemade and hearty.", ingredients: "Rolled oats, flour, butter, walnuts, brown sugar, eggs, cinnamon", price: 55, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 5, name: "White Chocolate Cookie", category: "Classic", description: "A soft vanilla cookie folded with creamy white chocolate chunks for a smooth, sweet, melt-in-your-mouth bite.", ingredients: "Flour, butter, eggs, sugar, white chocolate, vanilla, salt", price: 55, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 6, name: "Dark Chocolate Cookie", category: "Chocolate", description: "Deep cocoa flavor with dark chocolate pieces for customers who like their cookies rich, bold, and not too sweet.", ingredients: "Flour, cocoa, butter, eggs, dark chocolate, sugar, vanilla", price: 55, image_url: placeholder, featured: true, is_active: true, created_at: now(), updated_at: now() },
      { id: 7, name: "Coffee Crumble", category: "Special", description: "Coffee-kissed cookie topped with a sweet crumble finish, made for cafe lovers and late-night snack cravings.", ingredients: "Flour, butter, eggs, coffee, brown sugar, crumble topping, vanilla", price: 60, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 8, name: "Reese's Peanut Butter Cookie", category: "Nutty", description: "Peanut butter cookie packed with chocolatey Reese-inspired goodness, creamy nuttiness, and a soft chewy center.", ingredients: "Flour, peanut butter, butter, eggs, chocolate, peanuts, sugar", price: 60, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 9, name: "Matcha Cookie", category: "Special", description: "Earthy matcha balanced with creamy sweetness, soft texture, and a gentle tea aroma in every bite.", ingredients: "Flour, matcha powder, butter, eggs, sugar, white chocolate", price: 60, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 10, name: "Oreo Cookie", category: "Chocolate", description: "Cookies-and-cream cookie with crushed Oreo bits, a soft center, and playful crunch from edge to edge.", ingredients: "Flour, butter, eggs, cocoa, Oreo crumbs, sugar, vanilla", price: 60, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() },
      { id: 11, name: "Dubai Chewy Cookie", category: "Premium", description: "A premium chewy cookie inspired by rich pistachio-knafeh flavors, chocolatey luxury, and a gooey dessert-style bite.", ingredients: "Flour, butter, eggs, chocolate, pistachio cream, toasted pastry, sugar", price: 105, image_url: placeholder, featured: true, is_active: true, created_at: now(), updated_at: now() },
      { id: 12, name: "S'mores Cookie", category: "Classic", description: "A campfire-style cookie with chocolate, marshmallow, and graham flavor baked into one soft, gooey treat.", ingredients: "Flour, butter, eggs, chocolate, marshmallow, graham crumbs, sugar", price: 55, image_url: placeholder, featured: false, is_active: true, created_at: now(), updated_at: now() }
    ],
    orders: [],
    order_items: [],
    inquiries: [],
    business_settings: { id: 1, business_name: 'Dailydough.co', logo_url: '', primary_color: '#8b4a2f', accent_color: '#f4a261', contact_number: '09XX-XXX-XXXX', email: 'hello@dailydough.co', address: 'Metro Manila, Philippines', gcash_number: '09XX-XXX-XXXX', gcash_qr_url: placeholder, business_hours: 'Monday to Saturday, 9:00 AM - 6:00 PM', preparation_time: 'Orders are baked fresh and prepared within 1 to 2 business days.', cancellation_policy: 'Orders may be cancelled before confirmation. Confirmed custom box orders cannot be cancelled once preparation begins.', return_policy: 'Due to food safety, returns are not accepted. Please message us right away for order concerns.', facebook_url: 'https://facebook.com/dailydough.co', instagram_url: 'https://instagram.com/dailydough.co', tiktok_url: 'https://tiktok.com/@dailydough.co', updated_at: now() }
  };
}

function ensureDb() { if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true }); if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seedData(), null, 2)); }
function readDb() { ensureDb(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function send(res, status, body, type = 'application/json') { const data = type === 'application/json' ? JSON.stringify(body) : body; res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }); res.end(data); }
function notFound(res) { send(res, 404, { error: 'Route not found.' }); }
function getToken(req) { return (req.headers.authorization || '').replace('Bearer ', '').trim(); }
function requireAdmin(req, res) { if (!sessions.has(getToken(req))) { send(res, 401, { error: 'Admin login required.' }); return false; } return true; }
function body(req) { return new Promise(resolve => { let raw = ''; req.on('data', chunk => raw += chunk); req.on('end', () => resolve(raw ? JSON.parse(raw) : {})); }); }
function publicFile(res, pathname) { 
  // Serve uploaded files
  if (pathname.startsWith('/uploads/')) {
    let filePath = path.join(UPLOAD_DIR, pathname.replace('/uploads/', ''));
    if (!filePath.startsWith(UPLOAD_DIR)) return notFound(res);
    fs.readFile(filePath, (err, data) => { 
      if (err) return notFound(res); 
      const ext = path.extname(filePath); 
      const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }; 
      send(res, 200, data, types[ext] || 'application/octet-stream'); 
    }); 
    return;
  }
  
  // Serve public files
  let filePath = path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname); 
  if (!filePath.startsWith(PUBLIC)) return notFound(res); 
  fs.readFile(filePath, (err, data) => { 
    if (err) return notFound(res); 
    const ext = path.extname(filePath); 
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }; 
    send(res, 200, data, types[ext] || 'application/octet-stream'); 
  }); 
}

async function api(req, res, url) {
  const db = readDb();
  if (req.method === 'GET' && url.pathname === '/api/settings') return send(res, 200, db.business_settings);
  if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, db.products.filter(p => p.is_active));
  if (req.method === 'GET' && url.pathname.startsWith('/api/products/')) { const p = db.products.find(x => x.id === Number(url.pathname.split('/').pop()) && x.is_active); return p ? send(res, 200, p) : send(res, 404, { error: 'Product not found.' }); }
  if (req.method === 'GET' && url.pathname === '/api/orders/track') { const o = db.orders.find(x => x.order_number.toLowerCase() === (url.searchParams.get('order_number') || '').toLowerCase()); return o ? send(res, 200, { order_number: o.order_number, status: o.status, created_at: o.created_at, delivery_note: o.delivery_note }) : send(res, 404, { error: 'Order not found.' }); }
  if (req.method === 'POST' && url.pathname === '/api/orders') { const data = await body(req); const items = Array.isArray(data.items) ? data.items : []; if (!items.length) return send(res, 400, { error: 'Cart is empty.' }); let subtotal = 0; const orderItems = []; const orderId = db.nextIds.orders; items.forEach(item => { const product = db.products.find(p => p.id === Number(item.product_id) && p.is_active); if (!product) return; const quantity = Math.max(1, Number(item.quantity || 1)); const line = money(product.price * quantity); subtotal += line; orderItems.push({ id: db.nextIds.order_items++, order_id: orderId, product_id: product.id, product_name: product.name, unit_price: product.price, quantity, line_total: line }); }); if (!orderItems.length) return send(res, 400, { error: 'No valid products.' }); const order = { id: db.nextIds.orders++, order_number: newOrderNumber(), customer_name: data.customer_name, contact_number: data.contact_number, email: data.email || '', delivery_address: data.delivery_address, notes: data.notes || '', payment_method: data.payment_method, payment_proof_url: data.payment_proof_url || '', status: 'Pending Confirmation', subtotal: money(subtotal), delivery_note: 'Delivery fee will be manually computed and communicated after order confirmation.', created_at: now(), updated_at: now() }; db.orders.push(order); db.order_items.push(...orderItems); writeDb(db); return send(res, 201, order); }
  if (req.method === 'POST' && url.pathname === '/api/inquiries') { const data = await body(req); if (!data.name || !data.contact || !data.inquiry) return send(res, 400, { error: 'Name, contact, and inquiry are required.' }); const inquiry = { id: db.nextIds.inquiries++, name: data.name, contact: data.contact, inquiry: data.inquiry, created_at: now() }; db.inquiries.push(inquiry); writeDb(db); return send(res, 201, inquiry); }
  if (req.method === 'POST' && url.pathname === '/api/admin/login') { const data = await body(req); const admin = db.admins.find(a => a.username === data.username && a.password_hash === hash(data.password || '')); if (!admin) return send(res, 401, { error: 'Invalid username or password.' }); const token = crypto.randomBytes(24).toString('hex'); sessions.add(token); return send(res, 200, { token }); }
  if (url.pathname.startsWith('/api/admin') && !requireAdmin(req, res)) return;
  if (req.method === 'GET' && url.pathname === '/api/admin/orders') { const q = (url.searchParams.get('search') || '').toLowerCase(); const s = url.searchParams.get('status') || ''; let orders = db.orders.filter(o => (!s || o.status === s) && (!q || [o.order_number, o.customer_name, o.contact_number].join(' ').toLowerCase().includes(q))); return send(res, 200, orders.sort((a,b) => b.created_at.localeCompare(a.created_at))); }
  if (req.method === 'GET' && url.pathname.startsWith('/api/admin/orders/') && url.pathname.endsWith('/items')) { const orderId = Number(url.pathname.split('/')[4]); const items = db.order_items.filter(i => i.order_id === orderId); return send(res, 200, items); }
  if (req.method === 'PUT' && url.pathname.startsWith('/api/admin/orders/')) { const data = await body(req); if (!statuses.includes(data.status)) return send(res, 400, { error: 'Invalid status.' }); const order = db.orders.find(o => o.id === Number(url.pathname.split('/').pop())); if (!order) return send(res, 404, { error: 'Order not found.' }); order.status = data.status; order.updated_at = now(); writeDb(db); return send(res, 200, order); }
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/orders/')) { const orderId = Number(url.pathname.split('/').pop()); const orderIndex = db.orders.findIndex(o => o.id === orderId); if (orderIndex === -1) return send(res, 404, { error: 'Order not found.' }); db.orders.splice(orderIndex, 1); db.order_items = db.order_items.filter(i => i.order_id !== orderId); writeDb(db); return send(res, 200, { ok: true }); }
  if (req.method === 'GET' && url.pathname === '/api/admin/inquiries') return send(res, 200, db.inquiries.sort((a,b) => b.created_at.localeCompare(a.created_at)));
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/inquiries/')) { const inquiryId = Number(url.pathname.split('/').pop()); const inquiryIndex = db.inquiries.findIndex(i => i.id === inquiryId); if (inquiryIndex === -1) return send(res, 404, { error: 'Inquiry not found.' }); db.inquiries.splice(inquiryIndex, 1); writeDb(db); return send(res, 200, { ok: true }); }
  if (req.method === 'POST' && url.pathname === '/api/admin/products') { 
    const data = await body(req);
    const image_url = data.image_url && data.image_url.trim() ? '/uploads/' + data.image_url.trim() : placeholder;
    const product = { id: db.nextIds.products++, name: data.name, category: data.category, description: data.description, ingredients: data.ingredients, price: money(data.price), image_url: image_url, featured: !!data.featured, is_active: true, created_at: now(), updated_at: now() }; 
    db.products.push(product); 
    writeDb(db); 
    return send(res, 201, product); 
  }
  if (req.method === 'PUT' && url.pathname.startsWith('/api/admin/products/')) { 
    const data = await body(req);
    const p = db.products.find(x => x.id === Number(url.pathname.split('/').pop())); 
    if (!p) return send(res, 404, { error: 'Product not found.' }); 
    const image_url = data.image_url && data.image_url.trim() ? '/uploads/' + data.image_url.trim() : p.image_url;
    Object.assign(p, { name: data.name, category: data.category, description: data.description, ingredients: data.ingredients, price: money(data.price), image_url: image_url, featured: !!data.featured, updated_at: now() }); 
    writeDb(db); 
    return send(res, 200, p); 
  }
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/products/')) { const p = db.products.find(x => x.id === Number(url.pathname.split('/').pop())); if (!p) return send(res, 404, { error: 'Product not found.' }); p.is_active = false; p.updated_at = now(); writeDb(db); return send(res, 200, { ok: true }); }
  if (req.method === 'PUT' && url.pathname === '/api/admin/settings') { 
    const parsed = await parseMultipart(req);
    const data = parsed.body || {};
    const logo_url = parsed.files && parsed.files.logo && parsed.files.logo[0] ? '/uploads/' + parsed.files.logo[0].filename : (data.logo_url || db.business_settings.logo_url);
    const gcash_qr_url = parsed.files && parsed.files.gcash_qr && parsed.files.gcash_qr[0] ? '/uploads/' + parsed.files.gcash_qr[0].filename : (data.gcash_qr_url || db.business_settings.gcash_qr_url);
    db.business_settings = { ...db.business_settings, ...data, id: 1, logo_url, gcash_qr_url, updated_at: now() }; 
    writeDb(db); 
    return send(res, 200, db.business_settings); 
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/analytics') { const valid = db.orders.filter(o => o.status !== 'Cancelled'); const total_sales = money(valid.reduce((sum, o) => sum + Number(o.subtotal), 0)); const monthly = {}; valid.forEach(o => monthly[o.created_at.slice(0,7)] = money((monthly[o.created_at.slice(0,7)] || 0) + Number(o.subtotal))); const sold = {}; db.order_items.forEach(i => sold[i.product_name] = (sold[i.product_name] || 0) + i.quantity); return send(res, 200, { total_orders: db.orders.length, total_sales, monthly_sales: Object.entries(monthly).map(([month, sales]) => ({ month, sales })), best_sellers: Object.entries(sold).map(([product_name, quantity]) => ({ product_name, quantity })).sort((a,b) => b.quantity - a.quantity).slice(0,5), recent_orders: db.orders.slice(-5).reverse() }); }
  notFound(res);
}

ensureDb();
http.createServer((req, res) => { const url = new URL(req.url, 'http://localhost'); if (req.method === 'OPTIONS') return send(res, 204, {}); if (url.pathname.startsWith('/api/')) return api(req, res, url).catch(err => send(res, 500, { error: err.message })); publicFile(res, url.pathname); }).listen(PORT, () => console.log('Cookie shop running at http://127.0.0.1:' + PORT));
