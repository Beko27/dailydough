import { api } from './api.js';
export function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
export function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
export function addToCart(product, quantity = 1) { const cart = getCart(); const item = cart.find(x => x.product_id === product.id); if (item) item.quantity += quantity; else cart.push({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity }); saveCart(cart); showToast(`${quantity}x ${product.name} added to cart`); }
export function clearCart() { saveCart([]); }
export function updateCartCount() { const el = document.querySelector('[data-cart-count]'); if (el) el.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0); }
export async function loadSettings() { const settings = await api('/api/settings'); document.documentElement.style.setProperty('--brand', settings.primary_color); document.documentElement.style.setProperty('--accent', settings.accent_color); document.querySelectorAll('[data-business-name]').forEach(el => el.textContent = settings.business_name); document.querySelectorAll('[data-contact-number]').forEach(el => el.textContent = settings.contact_number); document.querySelectorAll('[data-email]').forEach(el => el.textContent = settings.email); document.querySelectorAll('[data-address]').forEach(el => el.textContent = settings.address); document.querySelectorAll('[data-facebook_url]').forEach(el => el.href = settings.facebook_url); document.querySelectorAll('[data-instagram_url]').forEach(el => el.href = settings.instagram_url); document.querySelectorAll('[data-tiktok_url]').forEach(el => el.href = settings.tiktok_url); document.querySelectorAll('[data-logo-url]').forEach(el => { el.src = settings.logo_url; el.style.display = settings.logo_url ? 'block' : 'none'; }); return settings; }
export function nav() { updateCartCount(); }
export function showToast(message) {
  const style = document.createElement('style');
  style.textContent = `.toast-container{position:fixed;bottom:20px;right:20px;z-index:1000;display:flex;flex-direction:column;gap:10px}.toast{background:linear-gradient(135deg, #fff5eb 0%, #f5e6d3 50%, #ebd9c4 100%);padding:16px 20px;border-radius:12px;box-shadow:0 4px 20px rgba(139,74,47,0.2);border:1px solid #ead8c6;animation:toastSlideUp 0.3s ease-out;min-width:250px;max-width:350px}@keyframes toastSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.toast.fade-out{animation:toastFadeOut 0.3s ease-in forwards}@keyframes toastFadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}`;
  document.head.appendChild(style);
  
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
