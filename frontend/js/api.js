/* api.js – all HTTP calls to backend */
const API_BASE = 'http://localhost:5000/api';

const Auth = {
  getToken: ()  => localStorage.getItem('ls_token'),
  setToken: (t) => localStorage.setItem('ls_token', t),
  removeToken:  () => localStorage.removeItem('ls_token'),
  getUser:  ()  => { try { return JSON.parse(localStorage.getItem('ls_user')); } catch { return null; } },
  setUser:  (u) => localStorage.setItem('ls_user', JSON.stringify(u)),
  removeUser:   () => localStorage.removeItem('ls_user'),
};

async function apiFetch(path, opts = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(API_BASE + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const AuthAPI = {
  async register(name, email, phone, password) {
    const d = await apiFetch('/auth/register', { method:'POST', body: JSON.stringify({name,email,phone,password}) });
    Auth.setToken(d.token); Auth.setUser(d.user); return d;
  },
  async login(email, password) {
    const d = await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({email,password}) });
    Auth.setToken(d.token); Auth.setUser(d.user); return d;
  },
  async registerAdmin(name, email, password) {
    const d = await apiFetch('/auth/register-admin', { method:'POST', body: JSON.stringify({name,email,password}) });
    Auth.setToken(d.token); Auth.setUser(d.user); return d;
  },
  logout() { Auth.removeToken(); Auth.removeUser(); },
  getUsers() { return apiFetch('/auth/users'); },
};

const ProductsAPI = {
  getAll(category='', search='') {
    const p = new URLSearchParams();
    if (category && category !== 'All') p.set('category', category);
    if (search) p.set('search', search);
    const qs = p.toString() ? '?' + p : '';
    return apiFetch('/products' + qs);
  },
  getById(id) { return apiFetch(`/products/${id}`); },
  getCategories() { return apiFetch('/products/categories'); },
};

const OrdersAPI = {
  getAll(filter='all') { return apiFetch(`/orders?filter=${filter}`); },
  getAllAdmin()         { return apiFetch('/orders/all'); },
  create(body)         { return apiFetch('/orders', { method:'POST', body: JSON.stringify(body) }); },
  track(id)            { return apiFetch(`/orders/${id}/track`); },
  updateStatus(id, status) { return apiFetch(`/orders/${id}/status`, { method:'PATCH', body: JSON.stringify({status}) }); },
};

const WishlistAPI = {
  getAll()      { return apiFetch('/wishlist'); },
  add(id)       { return apiFetch(`/wishlist/${id}`, { method:'POST' }); },
  remove(id)    { return apiFetch(`/wishlist/${id}`, { method:'DELETE' }); },
};

const AdminProductsAPI = {
  add(product)    { return apiFetch('/products', { method:'POST', body: JSON.stringify(product) }); },
  update(id, data){ return apiFetch(`/products/${id}`, { method:'PUT', body: JSON.stringify(data) }); },
  remove(id)      { return apiFetch(`/products/${id}`, { method:'DELETE' }); },
};

const DeliveryAPI = {
  getPartners()              { return apiFetch('/delivery/partners'); },
  addPartner(data)           { return apiFetch('/delivery/partners', { method:'POST', body: JSON.stringify(data) }); },
  removePartner(id)          { return apiFetch(`/delivery/partners/${id}`, { method:'DELETE' }); },
  assign(orderId, partnerId) { return apiFetch('/delivery/assign', { method:'POST', body: JSON.stringify({orderId, partnerId}) }); },
};
