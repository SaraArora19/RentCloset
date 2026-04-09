/* app.js – all UI logic */

let currentProduct  = null;
let currentCategory = 'All';
let screenHistory   = [];
let wishlistIds     = new Set();

/* ══════════════════ NAVIGATION ══════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}
function goBack() {
  if (screenHistory.length > 1) {
    screenHistory.pop();
    showScreen('screen-' + screenHistory[screenHistory.length - 1]);
  } else navTo('home');
}
function navTo(page) {
  screenHistory = [page];
  showScreen('screen-' + page);
  if (page === 'home')          { loadCategories(); loadProducts(); }
  if (page === 'wishlist')      loadWishlist();
  if (page === 'orders')        loadOrders('all');
  if (page === 'profile')       renderProfile();
  if (page === 'addresses')     renderAddresses();
  if (page === 'payments')      renderPayments();
  if (page === 'notifications') renderNotifications();
  if (page === 'support')       { /* static page, no load needed */ }
}

/* ══════════════════ HELPERS ══════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}
function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = 'msg ' + type;
}
function togglePwd(id) {
  const i = document.getElementById(id);
  i.type = i.type === 'password' ? 'text' : 'password';
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { month:'short', day:'numeric' });
}
function fmtDateLong(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday:'short', month:'long', day:'numeric', year:'numeric' });
}

/* ══════════════════ AUTH ══════════════════ */
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) return showMsg('login-msg', 'Please fill all fields.', 'error');
  try {
    const d = await AuthAPI.login(email, pass);
    document.getElementById('login-msg').className = 'msg';
    if (d.user.isAdmin) { showScreen('screen-admin'); adminTab('dashboard', document.querySelector('.admin-tab')); }
    else initApp();
  } catch(e) { showMsg('login-msg', e.message, 'error'); }
}

async function register() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass  = document.getElementById('reg-password').value;
  if (!name||!email||!pass) return showMsg('register-msg','Please fill all required fields.','error');
  if (pass.length < 6)      return showMsg('register-msg','Password must be at least 6 characters.','error');
  try {
    await AuthAPI.register(name, email, phone, pass);
    showMsg('register-msg','Account created!','success');
    setTimeout(initApp, 800);
  } catch(e) { showMsg('register-msg', e.message, 'error'); }
}

function logout() {
  AuthAPI.logout(); wishlistIds.clear();
  updateWishCount(); showScreen('screen-login'); screenHistory = [];
}

async function initApp() {
  const user = Auth.getUser();
  if (!user) { showScreen('screen-login'); return; }
  try {
    const items = await WishlistAPI.getAll();
    wishlistIds = new Set(items.map(p => p.id));
    updateWishCount();
  } catch(_){}
  navTo('home');
}

/* ══════════════════ CATEGORIES ══════════════════ */
async function loadCategories() {
  try {
    const cats = await ProductsAPI.getCategories();
    document.getElementById('category-bar').innerHTML = cats.map(c =>
      `<div class="cat-pill ${c===currentCategory?'active':''}" onclick="selectCategory('${c}')">${c}</div>`
    ).join('');
  } catch(_){}
}
function selectCategory(cat) {
  currentCategory = cat; loadCategories(); loadProducts();
}

/* ══════════════════ PRODUCTS ══════════════════ */
async function loadProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  const search = document.getElementById('search-input')?.value || '';
  try {
    const products = await ProductsAPI.getAll(currentCategory, search);
    renderProductGrid(products);
  } catch(_) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-light);">Backend not running.<br>Start the server first.</div>';
  }
}
function filterProducts() { loadProducts(); }

function renderProductGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!products.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-light);">No items found</div>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="openDetail(${p.id})">
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <button class="wish-btn" onclick="event.stopPropagation();toggleWish(${p.id})">${wishlistIds.has(p.id)?'❤️':'🤍'}</button>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-price">Rs. ${p.pricePerDay} / day</div>
        <button class="btn-rent-sm" onclick="event.stopPropagation();quickRent(${p.id})">Rent Now</button>
      </div>
    </div>`).join('');
}

/* ══════════════════ DETAIL ══════════════════ */
async function openDetail(id) {
  try {
    currentProduct = await ProductsAPI.getById(id);
    document.getElementById('detail-img').src     = currentProduct.image;
    document.getElementById('detail-name').textContent  = currentProduct.name;
    document.getElementById('detail-cat').textContent   = 'Category: ' + currentProduct.category;
    document.getElementById('detail-price').textContent = `Rs. ${currentProduct.pricePerDay} / day`;
    document.getElementById('detail-desc').textContent  = currentProduct.description;
    updateDetailWishBtn();
    screenHistory.push('detail'); showScreen('screen-detail');
  } catch(_) { showToast('Could not load item'); }
}
function updateDetailWishBtn() {
  const b = document.getElementById('detail-wish-btn');
  if (!b || !currentProduct) return;
  b.textContent = wishlistIds.has(currentProduct.id) ? '❤️ Saved' : '♡ Save';
}
async function toggleWishFromDetail() {
  if (!currentProduct) return;
  await toggleWish(currentProduct.id);
  updateDetailWishBtn();
}

/* ══════════════════ WISHLIST ══════════════════ */
async function toggleWish(id) {
  try {
    if (wishlistIds.has(id)) { await WishlistAPI.remove(id); wishlistIds.delete(id); showToast('Removed from wishlist'); }
    else                     { await WishlistAPI.add(id);    wishlistIds.add(id);    showToast('Added to wishlist ❤️'); }
    updateWishCount();
    const search = document.getElementById('search-input')?.value||'';
    renderProductGrid(await ProductsAPI.getAll(currentCategory, search));
  } catch(e) { showToast(e.message); }
}
function updateWishCount() {
  const el = document.getElementById('wish-count');
  if (el) el.textContent = wishlistIds.size;
}
async function loadWishlist() {
  const grid  = document.getElementById('wishlist-grid');
  const empty = document.getElementById('wishlist-empty');
  grid.innerHTML = '<div class="spinner"></div>'; empty.style.display='none';
  try {
    const items = await WishlistAPI.getAll();
    wishlistIds = new Set(items.map(p=>p.id)); updateWishCount();
    if (!items.length) { grid.innerHTML=''; empty.style.display='block'; return; }
    grid.innerHTML = items.map(p=>`
      <div class="wishlist-card" onclick="openDetail(${p.id})">
        <div class="img-wrap"><img src="${p.image}" alt="${p.name}" loading="lazy"/></div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-price">Rs. ${p.pricePerDay} / day</div>
          <button class="btn-rent-sm" onclick="event.stopPropagation();quickRent(${p.id})">Rent Now</button>
        </div>
      </div>`).join('');
  } catch(_) { grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-light);">Could not load wishlist.</div>'; }
}

/* ══════════════════ RENT MODAL ══════════════════ */
function openRentModal() {
  if (!currentProduct) return;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rent-start').value = today;
  document.getElementById('rent-end').value   = '';
  document.getElementById('rent-address').value = '';
  document.getElementById('modal-img').src   = currentProduct.image;
  document.getElementById('modal-name').textContent = currentProduct.name;
  document.getElementById('modal-ppd').textContent  = `Rs. ${currentProduct.pricePerDay} / day`;
  document.getElementById('cost-summary').style.display = 'none';
  document.getElementById('rent-modal').classList.add('open');
}
async function quickRent(id) {
  try { currentProduct = await ProductsAPI.getById(id); openRentModal(); }
  catch(_) { showToast('Could not load product'); }
}
function closeRentModal() { document.getElementById('rent-modal').classList.remove('open'); }
function closeModalOutside(e) { if (e.target===document.getElementById('rent-modal')) closeRentModal(); }

function calcCost() {
  const s = document.getElementById('rent-start').value;
  const e = document.getElementById('rent-end').value;
  if (!s || !e || !currentProduct) return;
  const days = Math.ceil((new Date(e)-new Date(s))/86400000);
  if (days<=0) { document.getElementById('cost-summary').style.display='none'; return; }
  document.getElementById('rent-days').textContent    = days + ' days';
  document.getElementById('rent-ppd-val').textContent = 'Rs. ' + currentProduct.pricePerDay;
  document.getElementById('rent-total').textContent   = 'Rs. ' + (days * currentProduct.pricePerDay);
  document.getElementById('cost-summary').style.display = 'block';
}

async function confirmOrder() {
  const startDate     = document.getElementById('rent-start').value;
  const endDate       = document.getElementById('rent-end').value;
  const address       = document.getElementById('rent-address').value.trim();
  const paymentMethod = document.getElementById('rent-payment').value;
  if (!startDate||!endDate) return showToast('Please select rental dates');
  if (!address)             return showToast('Please enter a delivery address');
  const days = Math.ceil((new Date(endDate)-new Date(startDate))/86400000);
  if (days<=0) return showToast('End date must be after start date');
  try {
    await OrdersAPI.create({ productId: currentProduct.id, startDate, endDate, address, paymentMethod });
    closeRentModal();
    showToast('🎉 Order placed successfully!');
    setTimeout(() => navTo('orders'), 1200);
  } catch(e) { showToast(e.message); }
}

/* ══════════════════ ORDERS ══════════════════ */
async function loadOrders(filter) {
  const list  = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  list.innerHTML = '<div class="spinner"></div>'; empty.style.display='none';
  try {
    const orders = await OrdersAPI.getAll(filter);
    if (!orders.length) { list.innerHTML=''; empty.style.display='block'; return; }

    const SC = { confirmed:'confirmed', shipped:'shipped', pending:'pending', returned:'returned', cancelled:'cancelled', out_for_delivery:'out_for_delivery' };
    const SL = { confirmed:'Confirmed', shipped:'Shipped', pending:'Pending', returned:'Returned', cancelled:'Cancelled', out_for_delivery:'Out for Delivery' };

    list.innerHTML = orders.map(o=>{
      const sc = SC[o.status]||'pending';
      const sl = SL[o.status]||o.status;
      const img = o.product?.image||'';
      const showTrack = ['confirmed','shipped','out_for_delivery'].includes(o.status);
      return `
      <div class="order-card">
        <div class="order-card-top">
          <div>
            <div class="order-status-label">${sl}</div>
            <div class="order-dates">${fmtDate(o.startDate)} – ${fmtDate(o.endDate)}</div>
          </div>
          <span class="status-badge ${sc}">${sl}</span>
        </div>
        <div class="order-item-row">
          <img class="order-thumb" src="${img}" alt="${o.productName}"/>
          <div>
            <div class="order-name">${o.productName}</div>
            <div class="order-price">Rs. ${o.pricePerDay} / day</div>
            <div class="order-no">Order No. ${o.id}</div>
          </div>
        </div>
        <div class="order-meta-row"><span>Rental Duration</span><span>${o.days} Days</span></div>
        <div class="order-meta-row"><span>Delivery Address</span><span>${o.address}</span></div>
        <div class="order-meta-row"><span>Payment Method</span><span>${o.paymentMethod}</span></div>
        <div class="order-total-row"><span>Total Cost</span><span>Rs. ${o.totalCost}</span></div>
        ${showTrack ? `<button class="btn-track" onclick="openTracking('${o.id}')">📍 Track Delivery</button>` : ''}
      </div>`;
    }).join('');
  } catch(_) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">Could not load orders.</div>';
  }
}

function filterOrders(filter, btn) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadOrders(filter);
}

/* ══════════════════ TRACKING ══════════════════ */
async function openTracking(orderId) {
  try {
    const t = await OrdersAPI.track(orderId);
    document.getElementById('tracking-order-id').textContent  = 'Order No. ' + t.orderId;
    document.getElementById('tracking-product').textContent   = t.productName;
    document.getElementById('tracking-dates').textContent     = fmtDate(t.startDate) + ' – ' + fmtDate(t.endDate);
    document.getElementById('tracking-est-date').textContent  = fmtDateLong(t.endDate);
    document.getElementById('tracking-address').textContent   = t.address;

    const timeline = document.getElementById('tracking-timeline');
    timeline.innerHTML = t.tracking.map((step, i) => {
      const isLast = i === t.tracking.length - 1;
      const dotClass = step.done ? 'done' : step.active ? 'active' : '';
      const lineClass = step.done && !step.active ? 'done' : '';
      const titleClass = !step.done && !step.active ? 'muted' : '';
      return `
      <div class="track-step">
        <div class="track-step-left">
          <div class="track-dot ${dotClass}">
            ${step.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </div>
          ${!isLast ? `<div class="track-line ${lineClass}"></div>` : ''}
        </div>
        <div class="track-step-right">
          <div class="track-step-title ${titleClass}">${step.label}</div>
          <div class="track-step-desc">${step.desc}</div>
          ${step.time ? `<div class="track-step-time">🕐 ${step.time}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    screenHistory.push('tracking');
    showScreen('screen-tracking');
  } catch(e) { showToast('Could not load tracking info'); }
}

/* ══════════════════ PROFILE ══════════════════ */
function renderProfile() {
  const user = Auth.getUser();
  if (!user) return;
  document.getElementById('profile-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent   = user.name;
  document.getElementById('profile-email').textContent  = user.email;
}

/* ══════════════════ ADMIN PANEL ══════════════════ */
async function adminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="spinner"></div>';

  if (tab === 'dashboard') await adminDashboard(content);
  if (tab === 'orders')    await adminOrders(content);
  if (tab === 'users')     await adminUsers(content);
  if (tab === 'products')  await adminProducts(content);
  if (tab === 'delivery')  await adminDelivery(content);
}

async function adminDashboard(el) {
  try {
    const [orders, users] = await Promise.all([OrdersAPI.getAllAdmin(), AuthAPI.getUsers()]);
    const totalRevenue = orders.reduce((s,o) => s + o.totalCost, 0);
    const active = orders.filter(o=>['confirmed','shipped','out_for_delivery'].includes(o.status)).length;
    el.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-num">${orders.length}</div><div class="stat-label">Total Orders</div></div>
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-num">${users.length}</div><div class="stat-label">Users</div></div>
        <div class="stat-card"><div class="stat-icon">🚚</div><div class="stat-num">${active}</div><div class="stat-label">Active Rentals</div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-num">₹${(totalRevenue/1000).toFixed(1)}k</div><div class="stat-label">Total Revenue</div></div>
      </div>
      <div class="admin-section-title">Recent Orders</div>
      ${orders.slice(-5).reverse().map(o=>adminOrderCard(o)).join('')}`;
  } catch(_) { el.innerHTML='<p style="color:var(--text-light);text-align:center;padding:40px;">Could not load dashboard.</p>'; }
}

async function adminOrders(el) {
  try {
    const orders = await OrdersAPI.getAllAdmin();
    if (!orders.length) { el.innerHTML='<div class="empty-state"><div class="empty-icon">📦</div><p>No orders yet.</p></div>'; return; }
    el.innerHTML = `<div class="admin-section-title">${orders.length} Orders</div>` + orders.map(o=>adminOrderCard(o)).join('');
  } catch(_) { el.innerHTML='<p style="color:var(--text-light);text-align:center;padding:40px;">Could not load orders.</p>'; }
}

function adminOrderCard(o) {
  const statuses = ['confirmed','shipped','out_for_delivery','returned','completed','cancelled'];
  return `
  <div class="admin-order-card">
    <div class="admin-order-top">
      <div>
        <div class="admin-order-name">${o.productName||'—'}</div>
        <div class="admin-order-user">👤 ${o.userName||''} · ${o.userEmail||''}</div>
      </div>
      <span class="status-badge ${o.status}">${o.status}</span>
    </div>
    <div class="admin-order-meta">
      📅 ${fmtDate(o.startDate)} – ${fmtDate(o.endDate)} &nbsp;·&nbsp; ${o.days} days<br>
      📍 ${o.address}<br>
      💳 ${o.paymentMethod} &nbsp;·&nbsp; <strong>Rs. ${o.totalCost}</strong>
    </div>
    <select class="admin-status-select" onchange="adminUpdateStatus('${o.id}',this.value)">
      ${statuses.map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
    </select>
  </div>`;
}

async function adminUpdateStatus(orderId, status) {
  try {
    await OrdersAPI.updateStatus(orderId, status);
    showToast('✅ Status updated to ' + status);
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminUsers(el) {
  try {
    const users = await AuthAPI.getUsers();
    if (!users.length) { el.innerHTML='<div class="empty-state"><div class="empty-icon">👥</div><p>No users yet.</p></div>'; return; }
    el.innerHTML = `<div class="admin-section-title">${users.length} Users</div>` +
      users.map(u=>`
      <div class="admin-user-card">
        <div class="admin-user-avatar">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="admin-user-name">${u.name}</div>
          <div class="admin-user-email">${u.email}</div>
          <div class="admin-user-orders">${u.orderCount} order${u.orderCount!==1?'s':''}</div>
        </div>
      </div>`).join('');
  } catch(_) { el.innerHTML='<p style="color:var(--text-light);text-align:center;padding:40px;">Could not load users.</p>'; }
}

async function adminProducts(el) {
  try {
    const products = await ProductsAPI.getAll();
    el.innerHTML = `
      <div class="admin-section-title">${products.length} Products</div>

      <!-- ── Add Product Form ── -->
      <div style="background:var(--surface);border-radius:14px;padding:16px;border:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-h);margin-bottom:12px;">➕ Add New Product</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input id="np-name"     class="admin-input" placeholder="Product name" style="grid-column:1/-1;"/>
          <input id="np-cat"      class="admin-input" placeholder="Category (Women/Men/Kids/Accessories)"/>
          <input id="np-price"    class="admin-input" type="number" placeholder="Price / day (Rs.)"/>
          <input id="np-image"    class="admin-input" placeholder="Image URL or path" style="grid-column:1/-1;"/>
          <textarea id="np-desc"  class="admin-input" placeholder="Description…" style="grid-column:1/-1;resize:none;height:60px;font-family:inherit;font-size:13px;"></textarea>
        </div>
        <button class="btn-primary" style="margin-top:10px;padding:10px;" onclick="adminAddProduct()">Upload Product</button>
      </div>

      <!-- ── Existing Products Grid ── -->
      <div id="admin-products-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${products.map(p=>`
        <div style="background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow-sm);position:relative;">
          <img src="${p.image}" style="width:100%;height:100px;object-fit:cover;" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=60'"/>
          <div style="padding:8px 10px 10px;">
            <div style="font-size:12.5px;font-weight:500;color:var(--text-h);">${p.name}</div>
            <div style="font-size:11.5px;color:var(--text-light);margin-top:2px;">${p.category} · Rs.${p.pricePerDay}/day</div>
            <div style="display:flex;gap:6px;margin-top:8px;">
              <span style="font-size:11px;padding:3px 8px;border-radius:20px;background:${p.available?'#e8f5e9':'#fce4ec'};color:${p.available?'#388e3c':'#c62828'};">${p.available?'Available':'Unavailable'}</span>
              <button onclick="adminToggleAvail(${p.id},${!p.available})" style="font-size:11px;border:none;background:var(--border);color:var(--text-body);border-radius:6px;padding:3px 7px;cursor:pointer;">Toggle</button>
              <button onclick="adminDeleteProduct(${p.id})" style="font-size:11px;border:none;background:#fce4ec;color:#c62828;border-radius:6px;padding:3px 7px;cursor:pointer;">Delete</button>
            </div>
          </div>
        </div>`).join('')}
      </div>`;
  } catch(_) { el.innerHTML='<p style="color:var(--text-light);text-align:center;padding:40px;">Could not load products.</p>'; }
}

async function adminAddProduct() {
  const name  = document.getElementById('np-name')?.value.trim();
  const cat   = document.getElementById('np-cat')?.value.trim();
  const price = document.getElementById('np-price')?.value;
  const image = document.getElementById('np-image')?.value.trim();
  const desc  = document.getElementById('np-desc')?.value.trim();
  if (!name || !cat || !price) return showToast('Please fill name, category and price.');
  try {
    await AdminProductsAPI.add({ name, category: cat, pricePerDay: parseInt(price), description: desc, image: image||'', sizes:['S','M','L','XL'] });
    showToast('✅ Product added!');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminProducts(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminToggleAvail(id, available) {
  try {
    await AdminProductsAPI.update(id, { available });
    showToast(available ? '✅ Marked available' : '⛔ Marked unavailable');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminProducts(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminDeleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await AdminProductsAPI.remove(id);
    showToast('🗑 Product deleted');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminProducts(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

/* ══════════════════ ADMIN – DELIVERY PARTNERS ══════════════════ */
async function adminDelivery(el) {
  try {
    const [partners, orders] = await Promise.all([DeliveryAPI.getPartners(), OrdersAPI.getAllAdmin()]);
    const unassigned = orders.filter(o => ['confirmed','shipped'].includes(o.status) && !o.deliveryPartnerId);
    el.innerHTML = `
      <div class="admin-section-title">${partners.length} Delivery Partners</div>

      <!-- Add Partner Form -->
      <div style="background:var(--surface);border-radius:14px;padding:16px;border:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-h);margin-bottom:12px;">➕ Add Delivery Partner</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input id="dp-name"  class="admin-input" placeholder="Full name"/>
          <input id="dp-phone" class="admin-input" placeholder="Phone number"/>
          <input id="dp-area"  class="admin-input" placeholder="Delivery area" style="grid-column:1/-1;"/>
        </div>
        <button class="btn-primary" style="margin-top:10px;padding:10px;" onclick="adminAddPartner()">Add Partner</button>
      </div>

      <!-- Partners List -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        ${partners.map(p=>`
        <div style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border);display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--taupe-btn);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600;flex-shrink:0;">${p.name.charAt(0)}</div>
          <div style="flex:1;">
            <div style="font-size:13.5px;font-weight:500;color:var(--text-h);">${p.name}</div>
            <div style="font-size:12px;color:var(--text-light);">📞 ${p.phone} · 📍 ${p.area}</div>
            <div style="font-size:11.5px;color:var(--taupe-btn);margin-top:2px;">${p.assignedOrders} order${p.assignedOrders!==1?'s':''} assigned</div>
          </div>
          <button onclick="adminRemovePartner(${p.id})" style="border:none;background:#fce4ec;color:#c62828;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;">Remove</button>
        </div>`).join('')}
      </div>

      <!-- Assign to Orders -->
      ${unassigned.length ? `
      <div class="admin-section-title">Assign Partners to Orders (${unassigned.length} unassigned)</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${unassigned.map(o=>`
        <div style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border);">
          <div style="font-size:13px;font-weight:500;color:var(--text-h);">${o.productName}</div>
          <div style="font-size:12px;color:var(--text-light);margin-bottom:10px;">📅 ${fmtDate(o.startDate)}–${fmtDate(o.endDate)} · 📍 ${o.address}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="assign-partner-${o.id}" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;background:var(--bg);color:var(--text-body);">
              <option value="">Select partner…</option>
              ${partners.map(p=>`<option value="${p.id}">${p.name} (${p.area})</option>`).join('')}
            </select>
            <button onclick="adminAssignPartner('${o.id}')" style="border:none;background:var(--taupe-btn);color:#fff;border-radius:8px;padding:9px 14px;font-size:13px;cursor:pointer;">Assign</button>
          </div>
        </div>`).join('')}
      </div>` : '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">✅ All active orders have delivery partners assigned.</div>'}`;
  } catch(_) { el.innerHTML='<p style="color:var(--text-light);text-align:center;padding:40px;">Could not load delivery data.</p>'; }
}

async function adminAddPartner() {
  const name  = document.getElementById('dp-name')?.value.trim();
  const phone = document.getElementById('dp-phone')?.value.trim();
  const area  = document.getElementById('dp-area')?.value.trim();
  if (!name || !phone) return showToast('Name and phone are required.');
  try {
    await DeliveryAPI.addPartner({ name, phone, area: area||'General' });
    showToast('✅ Partner added!');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminDelivery(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminRemovePartner(id) {
  if (!confirm('Remove this delivery partner?')) return;
  try {
    await DeliveryAPI.removePartner(id);
    showToast('🗑 Partner removed');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminDelivery(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

async function adminAssignPartner(orderId) {
  const sel = document.getElementById(`assign-partner-${orderId}`);
  const partnerId = sel?.value;
  if (!partnerId) return showToast('Please select a partner first.');
  try {
    await DeliveryAPI.assign(orderId, partnerId);
    showToast('✅ Partner assigned to order!');
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner"></div>';
    await adminDelivery(content);
  } catch(e) { showToast('Error: ' + e.message); }
}

/* ══════════════════ ADMIN LOGIN ══════════════════ */
async function adminLogin() {
  const email = document.getElementById('admin-login-email').value.trim();
  const pass  = document.getElementById('admin-login-password').value;
  if (!email || !pass) return showMsg('admin-login-msg', 'Please fill all fields.', 'error');
  try {
    const d = await AuthAPI.login(email, pass);
    if (!d.user.isAdmin) return showMsg('admin-login-msg', 'This account does not have admin access.', 'error');
    document.getElementById('admin-login-msg').className = 'msg';
    showScreen('screen-admin');
    adminTab('dashboard', document.querySelector('.admin-tab'));
  } catch(e) { showMsg('admin-login-msg', e.message, 'error'); }
}

/* ══════════════════ STYLE ADVISOR / MEASUREMENTS ══════════════════ */
function openMeasurements() {
  document.getElementById('measure-step-1').style.display = 'block';
  document.getElementById('measure-step-2').style.display = 'none';
  document.getElementById('measurements-modal').classList.add('open');
}
function closeMeasurements() { document.getElementById('measurements-modal').classList.remove('open'); }
function closeMeasurementsOutside(e) { if (e.target === document.getElementById('measurements-modal')) closeMeasurements(); }
function resetMeasurements() {
  document.getElementById('measure-step-1').style.display = 'block';
  document.getElementById('measure-step-2').style.display = 'none';
}

async function getStyleRecommendations() {
  const gender  = document.getElementById('m-gender').value;
  const height  = parseInt(document.getElementById('m-height').value);
  const chest   = parseInt(document.getElementById('m-chest').value);
  const waist   = parseInt(document.getElementById('m-waist').value);
  const hips    = parseInt(document.getElementById('m-hips').value);
  const occasion = document.getElementById('m-occasion').value;

  if (!height || !chest || !waist || !hips) return showToast('Please enter all measurements.');

  // Derive size from chest
  let size = 'M';
  if (gender === 'Women') {
    if (chest < 80)       size = 'XS';
    else if (chest < 86)  size = 'S';
    else if (chest < 92)  size = 'M';
    else if (chest < 100) size = 'L';
    else                  size = 'XL';
  } else if (gender === 'Men') {
    if (chest < 88)       size = 'S';
    else if (chest < 96)  size = 'M';
    else if (chest < 104) size = 'L';
    else if (chest < 112) size = 'XL';
    else                  size = 'XXL';
  } else {
    size = height < 120 ? '3-4Y' : height < 130 ? '5-6Y' : height < 140 ? '7-8Y' : '9-10Y';
  }

  // Body type
  const diff = hips - chest;
  let bodyType = 'Rectangle';
  if (gender === 'Women') {
    if (Math.abs(diff) < 5 && waist < chest - 8)    bodyType = 'Hourglass';
    else if (diff > 10)                              bodyType = 'Pear';
    else if (chest > hips + 5)                       bodyType = 'Inverted Triangle';
    else if (Math.abs(diff) < 5)                     bodyType = 'Rectangle';
  }

  // Style recommendations based on body type + occasion
  const styleMap = {
    Hourglass:         { icon:'⌛', tip:'Your balanced proportions suit fitted silhouettes. Wrap dresses, belted coats, and tailored blazers will look stunning on you.' },
    Pear:              { icon:'🍐', tip:'A-line skirts and flared dresses balance your hips beautifully. Structured tops and statement necklines draw the eye upward.' },
    'Inverted Triangle':{ icon:'🔺', tip:'Flowy bottoms and wide-leg trousers balance broad shoulders. V-necks and off-shoulder styles look great on you.' },
    Rectangle:         { icon:'▭',  tip:'You can carry off almost any silhouette! Peplum tops, wrap dresses, and belted styles add lovely definition.' },
  };
  const style = styleMap[bodyType] || styleMap['Rectangle'];

  // Match products from catalogue
  let allProducts = [];
  try { allProducts = await ProductsAPI.getAll(gender === 'Kids' ? 'Kids' : gender); } catch(_) {}
  const occasionKeywords = {
    Wedding: ['coat','blazer','dress'], Party: ['dress','blazer'], Casual: ['dress','coat'],
    Office: ['blazer','coat'], Outdoor: ['coat','jacket'],
  };
  const keys = occasionKeywords[occasion] || [];
  const matched = allProducts.filter(p =>
    p.sizes?.includes(size) &&
    (keys.length === 0 || keys.some(k => p.name.toLowerCase().includes(k) || p.description.toLowerCase().includes(k)))
  ).slice(0, 3);

  const recoHtml = matched.length ? matched.map(p => `
    <div style="display:flex;gap:10px;align-items:center;background:var(--bg);border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer;" onclick="closeMeasurements();openDetail(${p.id})">
      <img src="${p.image}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60'"/>
      <div>
        <div style="font-size:13px;font-weight:500;color:var(--text-h);">${p.name}</div>
        <div style="font-size:12px;color:var(--text-light);">Rs. ${p.pricePerDay}/day · Size ${size} available</div>
      </div>
      <span style="margin-left:auto;font-size:18px;">›</span>
    </div>`) .join('')
  : `<div style="font-size:13px;color:var(--text-light);padding:10px 0;">No perfect matches in current catalogue — check back soon!</div>`;

  document.getElementById('style-recommendations').innerHTML = `
    <div style="background:var(--surface);border-radius:14px;padding:16px;border:1px solid var(--border);margin-bottom:14px;">
      <div style="font-size:22px;margin-bottom:6px;">${style.icon}</div>
      <div style="font-size:14px;font-weight:600;color:var(--text-h);margin-bottom:4px;">Your Body Type: ${bodyType}</div>
      <div style="font-size:13px;color:var(--text-body);line-height:1.6;">${style.tip}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <span style="background:var(--border);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--text-body);">Suggested Size: <strong>${size}</strong></span>
        <span style="background:var(--border);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--text-body);">${gender}</span>
        ${occasion ? `<span style="background:var(--border);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--text-body);">${occasion}</span>` : ''}
      </div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--text-h);margin-bottom:10px;">✨ Recommended for You</div>
    ${recoHtml}`;

  document.getElementById('measure-step-1').style.display = 'none';
  document.getElementById('measure-step-2').style.display = 'block';
}

/* ══════════════════ SIDE DRAWER ══════════════════ */
function openDrawer() {
  const user = Auth.getUser();
  if (user) document.getElementById('drawer-user-name').textContent = user.name;
  document.getElementById('side-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('side-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

/* ══════════════════ SAVED ADDRESSES ══════════════════ */
function getAddresses() {
  try { return JSON.parse(localStorage.getItem('ls_addresses') || '[]'); } catch { return []; }
}
function saveAddresses(arr) { localStorage.setItem('ls_addresses', JSON.stringify(arr)); }

function renderAddresses() {
  const list = document.getElementById('addresses-list');
  if (!list) return;
  const addrs = getAddresses();
  if (!addrs.length) {
    list.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--text-light);font-size:13px;">No saved addresses yet.</div>';
    return;
  }
  list.innerHTML = addrs.map((a, i) => `
    <div style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border);margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--taupe-btn);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">${a.label}</div>
        <div style="font-size:13.5px;color:var(--text-body);">${a.line}</div>
        <div style="font-size:12px;color:var(--text-light);margin-top:2px;">${a.city}${a.pin ? ' – ' + a.pin : ''}</div>
      </div>
      <button onclick="deleteAddress(${i})" style="border:none;background:#fce4ec;color:#c62828;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;flex-shrink:0;margin-left:10px;">Delete</button>
    </div>`).join('');
}

function saveAddress() {
  const label = document.getElementById('addr-label').value.trim() || 'Home';
  const line  = document.getElementById('addr-line').value.trim();
  const city  = document.getElementById('addr-city').value.trim();
  const pin   = document.getElementById('addr-pin').value.trim();
  if (!line) return showToast('Please enter an address.');
  const addrs = getAddresses();
  addrs.push({ label, line, city, pin });
  saveAddresses(addrs);
  document.getElementById('addr-label').value = '';
  document.getElementById('addr-line').value  = '';
  document.getElementById('addr-city').value  = '';
  document.getElementById('addr-pin').value   = '';
  showToast('✅ Address saved!');
  renderAddresses();
}

function deleteAddress(i) {
  const addrs = getAddresses();
  addrs.splice(i, 1);
  saveAddresses(addrs);
  showToast('Address removed');
  renderAddresses();
}

/* ══════════════════ PAYMENT METHODS ══════════════════ */
function getPayments() {
  try { return JSON.parse(localStorage.getItem('ls_payments') || '[]'); } catch { return []; }
}
function savePayments(arr) { localStorage.setItem('ls_payments', JSON.stringify(arr)); }

const payIcons = { UPI: '📱', 'Credit Card': '💳', 'Debit Card': '🏧', 'Net Banking': '🏦' };

function renderPayments() {
  const list = document.getElementById('payments-list');
  if (!list) return;
  const pays = getPayments();
  if (!pays.length) {
    list.innerHTML = '<div style="text-align:center;padding:24px 0;color:var(--text-light);font-size:13px;">No saved payment methods yet.</div>';
    return;
  }
  list.innerHTML = pays.map((p, i) => `
    <div style="background:var(--surface);border-radius:12px;padding:14px 16px;border:1px solid var(--border);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">${payIcons[p.type] || '💳'}</span>
        <div>
          <div style="font-size:13.5px;font-weight:500;color:var(--text-h);">${p.nick || p.type}</div>
          <div style="font-size:12px;color:var(--text-light);">${p.type}${p.detail ? ' · ' + p.detail : ''}</div>
        </div>
      </div>
      <button onclick="deletePayment(${i})" style="border:none;background:#fce4ec;color:#c62828;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;">Delete</button>
    </div>`).join('');
}

function savePayment() {
  const type   = document.getElementById('pay-type').value;
  const detail = document.getElementById('pay-detail').value.trim();
  const nick   = document.getElementById('pay-nick').value.trim();
  if (!detail) return showToast('Please enter account details.');
  const pays = getPayments();
  pays.push({ type, detail, nick });
  savePayments(pays);
  document.getElementById('pay-detail').value = '';
  document.getElementById('pay-nick').value   = '';
  showToast('✅ Payment method saved!');
  renderPayments();
}

function deletePayment(i) {
  const pays = getPayments();
  pays.splice(i, 1);
  savePayments(pays);
  showToast('Payment method removed');
  renderPayments();
}

/* ══════════════════ NOTIFICATIONS ══════════════════ */
const defaultPrefs = [
  { key: 'order_updates',   label: 'Order Updates',      desc: 'Shipping, delivery and return status', on: true },
  { key: 'promotions',      label: 'Promotions & Offers', desc: 'Deals, discounts and new arrivals',    on: true },
  { key: 'reminders',       label: 'Return Reminders',   desc: 'Reminder before your return date',     on: true },
  { key: 'wishlist_alerts', label: 'Wishlist Alerts',    desc: 'When a saved item goes on discount',   on: false },
];

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem('ls_notif_prefs') || 'null') || defaultPrefs; } catch { return defaultPrefs; }
}
function saveNotifPrefs(prefs) { localStorage.setItem('ls_notif_prefs', JSON.stringify(prefs)); }

function renderNotifications() {
  const prefsList = document.getElementById('notif-prefs-list');
  const notifList = document.getElementById('notif-list');
  if (!prefsList) return;

  const prefs = getNotifPrefs();
  prefsList.innerHTML = prefs.map((p, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13.5px;font-weight:500;color:var(--text-h);">${p.label}</div>
        <div style="font-size:12px;color:var(--text-light);margin-top:2px;">${p.desc}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${p.on ? 'checked' : ''} onchange="toggleNotifPref(${i}, this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');

  // Mock recent notifications
  const user = Auth.getUser();
  const mockNotifs = [
    { icon:'📦', text:'Your order has been confirmed and is being prepared.', time:'2 hours ago' },
    { icon:'🚚', text:'Your rental item is out for delivery today!', time:'Yesterday' },
    { icon:'🎉', text:'Welcome to LoueStyle! Explore our latest collections.', time:'3 days ago' },
    { icon:'🔔', text:'Your wishlist item "Floral Summer Dress" is back in stock.', time:'5 days ago' },
  ];
  notifList.innerHTML = mockNotifs.map(n => `
    <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:22px;flex-shrink:0;">${n.icon}</span>
      <div>
        <div style="font-size:13px;color:var(--text-body);line-height:1.5;">${n.text}</div>
        <div style="font-size:11.5px;color:var(--text-light);margin-top:3px;">${n.time}</div>
      </div>
    </div>`).join('');
}

function toggleNotifPref(i, val) {
  const prefs = getNotifPrefs();
  prefs[i].on = val;
  saveNotifPrefs(prefs);
  showToast(val ? '🔔 Notifications enabled' : '🔕 Notifications disabled');
}

/* ══════════════════ HELP & SUPPORT ══════════════════ */
function toggleFaq(el) {
  const ans = el.querySelector('.faq-a');
  const sym = el.querySelector('.faq-q span');
  const open = ans.style.display === 'block';
  ans.style.display = open ? 'none' : 'block';
  if (sym) sym.textContent = open ? '+' : '–';
}
function sendSupportMsg() {
  const msg = document.getElementById('support-msg').value.trim();
  if (!msg) return showToast('Please type a message first.');
  document.getElementById('support-msg').value = '';
  showToast('✅ Message sent! We\'ll get back to you within 24 hours.');
}

/* ══════════════════ ADMIN REGISTRATION ══════════════════ */
function toggleAdminRegForm() {
  const fields = ['admin-reg-fields','admin-reg-email-field','admin-reg-pwd-field'];
  const toggleBtn = document.getElementById('admin-reg-toggle-btn');
  const submitBtn = document.getElementById('admin-reg-submit-btn');
  const isOpen = document.getElementById('admin-reg-fields').style.display === 'block';
  fields.forEach(id => { document.getElementById(id).style.display = isOpen ? 'none' : 'block'; });
  toggleBtn.textContent = isOpen ? 'Create Admin Account' : 'Cancel';
  submitBtn.style.display = isOpen ? 'none' : 'block';
}

async function registerAdmin() {
  const name  = document.getElementById('admin-reg-name').value.trim();
  const email = document.getElementById('admin-reg-email').value.trim();
  const pass  = document.getElementById('admin-reg-password').value;
  if (!name || !email || !pass) return showMsg('admin-reg-msg', 'Please fill all fields.', 'error');
  if (pass.length < 6) return showMsg('admin-reg-msg', 'Password must be at least 6 characters.', 'error');
  try {
    await AuthAPI.registerAdmin(name, email, pass);
    showMsg('admin-reg-msg', '✅ Admin account created! Logging you in…', 'success');
    toggleAdminRegForm();
    setTimeout(() => {
      showScreen('screen-admin');
      adminTab('dashboard', document.querySelector('.admin-tab'));
    }, 1000);
  } catch(e) { showMsg('admin-reg-msg', e.message, 'error'); }
}

/* ══════════════════ BOOT ══════════════════ */
(function () {
  const user = Auth.getUser();
  if (!user) { showScreen('screen-login'); return; }
  if (user.isAdmin) { showScreen('screen-admin'); adminTab('dashboard', document.querySelector('.admin-tab')); }
  else initApp();
})();
