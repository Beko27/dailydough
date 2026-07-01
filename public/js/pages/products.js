import { api, peso } from '../api.js'; import { addToCart, loadSettings, nav } from '../store.js';
await loadSettings(); nav();
const products = await api('/api/products'); const cats = ['All', ...new Set(products.map(p => p.category))]; let active = 'All';
const filter = document.querySelector('#filters'); const list = document.querySelector('#products');
filter.innerHTML = cats.map(c => '<button class="chip '+(c==='All'?'active':'')+'" data-cat="'+c+'">'+c+'</button>').join('');
function render(){ const data = active === 'All' ? products : products.filter(p => p.category === active); list.innerHTML = data.map(p => '<article class="product-card"><img src="'+p.image_url+'" alt="'+p.name+'"><div><span>'+p.category+'</span><h3>'+p.name+'</h3><p>'+p.description+'</p><strong>'+peso(p.price)+'</strong><div class="actions"><a class="btn ghost" href="product.html?id='+p.id+'">Details</a><button class="btn" data-id="'+p.id+'">Add</button></div></div></article>').join(''); }
filter.onclick = e => { if(e.target.dataset.cat){ active=e.target.dataset.cat; document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active', b.dataset.cat===active)); render(); }};
list.onclick = e => { if(e.target.dataset.id){ addToCart(products.find(p=>p.id===Number(e.target.dataset.id)),1); e.target.textContent='Added'; }}; render();
