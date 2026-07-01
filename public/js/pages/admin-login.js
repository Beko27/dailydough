import { api } from '../api.js';
localStorage.removeItem('adminToken');
document.querySelector('form').onsubmit = async e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target).entries()); try { const result = await api('/api/admin/login', { method:'POST', body: JSON.stringify(data) }); localStorage.setItem('adminToken', result.token); location.href='admin.html'; } catch(err) { document.querySelector('#error').textContent = err.message; } };
