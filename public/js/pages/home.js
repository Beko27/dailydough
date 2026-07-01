import { api, peso } from '../api.js'; import { addToCart, loadSettings, nav } from '../store.js';
await loadSettings(); nav();
const products = await api('/api/products');
document.querySelector('#featured').innerHTML = products.filter(p => p.featured).slice(0,3).map(p => '<article class="product-card"><img src="'+p.image_url+'" alt="'+p.name+'"><div><span>'+p.category+'</span><h3>'+p.name+'</h3><p>'+p.description+'</p><strong>'+peso(p.price)+'</strong><div class="actions"><a class="btn ghost" href="product.html?id='+p.id+'">View</a><button class="btn" data-id="'+p.id+'">Add</button></div></div></article>').join('');
document.querySelector('#featured').addEventListener('click', e => { if (e.target.matches('button[data-id]')) { const p = products.find(x => x.id === Number(e.target.dataset.id)); addToCart(p, 1); e.target.textContent = 'Added'; } });
