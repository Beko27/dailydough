import { api, peso, readImage } from '../api.js'; import { getCart, clearCart, loadSettings, nav } from '../store.js';
const settings = await loadSettings(); nav(); const cart=getCart(); const summary=document.querySelector('#summary');
summary.innerHTML = cart.map(i=>'<p>'+i.quantity+' x '+i.name+' <strong>'+peso(i.quantity*i.price)+'</strong></p>').join('') + '<hr><p>Total <strong>'+peso(cart.reduce((s,i)=>s+i.price*i.quantity,0))+'</strong></p><small>Choose a box of 3, 6, or 12 during checkout. Use the notes field to tell us which flavors you want in the box.</small><br><small>Delivery via Lalamove. Delivery fee will be manually computed after confirmation.</small>';
document.querySelector('#gcashInfo').innerHTML = '<strong>GCash number: '+settings.gcash_number+'</strong><img src="'+settings.gcash_qr_url+'" alt="GCash QR placeholder"><p>For bank transfer via InstaPay or credit card, DailyDough.co will send the payment instructions after order confirmation.</p>';
document.querySelectorAll('[data-facebook-url]').forEach(el => el.href = settings.facebook_url);
document.querySelectorAll('[data-instagram-url]').forEach(el => el.href = settings.instagram_url);
document.querySelectorAll('input[name="payment_method"]').forEach(r => r.onchange = () => document.querySelector('#gcashBox').hidden = !['GCash','Bank Transfer (InstaPay)','Credit Card'].includes(r.value));

let map = null;
let marker = null;

document.querySelector('#pinLocation').onclick = () => {
  const mapDiv = document.querySelector('#map');
  const searchDiv = document.querySelector('#searchContainer');
  mapDiv.style.display = 'block';
  searchDiv.style.display = 'block';
  
  if (!map) {
    map = L.map('map').setView([14.5995, 120.9842], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (marker) {
          map.removeLayer(marker);
        }
        
        marker = L.marker([lat, lng]).addTo(map);
        map.setView([lat, lng], 16);
        
        document.querySelector('#locationCoordinates').value = `${lat},${lng}`;
        document.querySelector('#pinLocation').textContent = '📍 Location pinned!';
        document.querySelector('#pinLocation').style.background = 'var(--green)';
        document.querySelector('#pinLocation').style.color = 'white';
      },
      (error) => {
        alert('Unable to get location. Please enable location services, search for an address, or click on the map to pin your location manually.');
        console.error('Geolocation error:', error);
      }
    );
  } else {
    alert('Geolocation is not supported by your browser. Please search for an address or click on the map to pin your location manually.');
  }
};

let searchTimeout = null;

const searchAddress = async () => {
  const query = document.querySelector('#addressSearch').value;
  if (!query || query.length < 3) {
    document.querySelector('#searchResults').innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=PH&limit=5`);
    const results = await response.json();
    
    const resultsDiv = document.querySelector('#searchResults');
    if (results.length === 0) {
      resultsDiv.innerHTML = '<p style="padding: 8px; color: var(--muted);">No results found in Philippines. Try a different search term.</p>';
    } else {
      resultsDiv.innerHTML = results.map(result => `
        <div class="search-result" style="padding: 10px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s ease;" data-lat="${result.lat}" data-lon="${result.lon}" data-name="${result.display_name}">
          <strong>${result.display_name.split(',')[0]}</strong><br>
          <small style="color: var(--muted);">${result.display_name}</small>
        </div>
      `).join('');
      
      // Add click handlers to search results
      document.querySelectorAll('.search-result').forEach(result => {
        result.onclick = () => {
          const lat = parseFloat(result.dataset.lat);
          const lon = parseFloat(result.dataset.lon);
          
          if (marker) {
            map.removeLayer(marker);
          }
          
          marker = L.marker([lat, lon]).addTo(map);
          map.setView([lat, lon], 16);
          
          document.querySelector('#locationCoordinates').value = `${lat},${lon}`;
          document.querySelector('#pinLocation').textContent = '📍 Location pinned!';
          document.querySelector('#pinLocation').style.background = 'var(--green)';
          document.querySelector('#pinLocation').style.color = 'white';
          
          // Update delivery address field
          document.querySelector('textarea[name="delivery_address"]').value = result.dataset.name;
        };
        
        result.onmouseenter = () => {
          result.style.background = 'var(--cream)';
          result.style.transform = 'translateX(4px)';
        };
        result.onmouseleave = () => {
          result.style.background = 'var(--paper)';
          result.style.transform = 'translateX(0)';
        };
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    document.querySelector('#searchResults').innerHTML = '<p style="padding: 8px; color: var(--muted);">Error searching for address. Please try again.</p>';
  }
};

document.querySelector('#addressSearch').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchAddress, 500);
});

// Allow clicking on map to set location
document.querySelector('#map').addEventListener('click', function() {
  if (map) {
    map.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      if (marker) {
        map.removeLayer(marker);
      }
      
      marker = L.marker([lat, lng]).addTo(map);
      document.querySelector('#locationCoordinates').value = `${lat},${lng}`;
      document.querySelector('#pinLocation').textContent = '📍 Location pinned!';
      document.querySelector('#pinLocation').style.background = 'var(--green)';
      document.querySelector('#pinLocation').style.color = 'white';
    });
  }
});

document.querySelector('#checkoutForm').onsubmit = async e => { e.preventDefault(); const form = new FormData(e.target); const payload = Object.fromEntries(form.entries()); payload.notes = payload.notes || 'No special instructions.'; payload.location_coordinates = document.querySelector('#locationCoordinates').value; const total = cart.reduce((s,i)=>s+i.price*i.quantity,0); const modal = document.createElement('div'); modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px'; modal.innerHTML='<div style="background:var(--paper);border-radius:12px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.2)"><h2 style="margin-top:0">Confirm Your Order</h2><p><strong>Name:</strong> '+payload.customer_name+'</p><p><strong>Contact:</strong> '+payload.contact_number+'</p><p><strong>Email:</strong> '+(payload.email||'N/A')+'</p><p><strong>Delivery Address:</strong> '+payload.delivery_address+'</p>'+(payload.location_coordinates?'<p><strong>Location:</strong> Pinned</p>':'')+'<p><strong>Payment Method:</strong> '+payload.payment_method+'</p><p><strong>Notes:</strong> '+(payload.notes||'None')+'</p><hr><h3>Order Items</h3>'+cart.map(i=>'<p>'+i.quantity+' x '+i.name+' - '+peso(i.quantity*i.price)+'</p>').join('')+'<hr><p><strong>Total: '+peso(total)+'</strong></p><p style="color:var(--brand);font-size:14px;">Please review all details above. Once confirmed, your order will be submitted.</p><div style="display:flex;gap:10px;margin-top:20px"><button id="cancelOrder" class="btn" style="flex:1">Go Back</button><button id="confirmOrder" class="btn" style="flex:1">Confirm & Submit</button></div></div>'; modal.querySelector('#cancelOrder').onclick=()=>modal.remove(); modal.onclick=e=>{if(e.target===modal)modal.remove()}; modal.querySelector('#confirmOrder').onclick=async()=>{ modal.remove(); const proof = await readImage(document.querySelector('#proof').files[0]); payload.payment_proof_url = proof; payload.items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })); const order = await api('/api/orders', { method:'POST', body: JSON.stringify(payload) }); clearCart(); document.querySelector('#result').innerHTML = '<div class="notice"><h2>Order submitted</h2><p>Your order number is <strong>'+order.order_number+'</strong>.</p><a class="btn" href="tracking.html">Track order</a></div>'; e.target.hidden = true; }; document.body.appendChild(modal); };
