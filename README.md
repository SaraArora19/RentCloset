# 🧥 LoueStyle – Fashion Rental App

A full-stack fashion rental web app with a Node.js/Express backend and a vanilla HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
louestyle/
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── package.json
│   ├── db/
│   │   └── database.js        ← In-memory database + seed products
│   ├── middleware/
│   │   └── auth.js            ← JWT authentication middleware
│   └── routes/
│       ├── auth.js            ← POST /api/auth/register, /login, GET /me
│       ├── products.js        ← GET /api/products, /products/:id
│       ├── orders.js          ← GET/POST/DELETE /api/orders
│       └── wishlist.js        ← GET/POST/DELETE /api/wishlist/:id
│
└── frontend/
    ├── index.html             ← Single-page app shell
    ├── css/
    │   └── style.css          ← All styles
    └── js/
        ├── api.js             ← API service layer (AuthAPI, ProductsAPI, etc.)
        └── app.js             ← All UI logic & event handlers
```

---

## 🚀 How to Run in VS Code

### Step 1 – Install Node.js
Download from https://nodejs.org (LTS version). Verify:
```bash
node -v
npm -v
```

### Step 2 – Install Backend Dependencies
Open VS Code. Open the **integrated terminal** (`Ctrl + `` ` ``).

```bash
cd louestyle/backend
npm install
```

### Step 3 – Start the Backend Server
```bash
npm run dev
```
You should see:
```
🧥 LoueStyle API running at http://localhost:5000
```

### Step 4 – Open the Frontend
**Option A – Using Live Server (Recommended)**
1. Install the **Live Server** extension in VS Code:
   - Press `Ctrl+Shift+X` → search "Live Server" → Install
2. Right-click `frontend/index.html` → **"Open with Live Server"**
3. Browser opens at `http://127.0.0.1:5500/frontend/index.html`

**Option B – Just open the file**
- Double-click `frontend/index.html` to open it directly in your browser.

### Step 5 – Use the App
1. Click **Create New Account** and register
2. Log in and explore — browse products, add to wishlist, place rental orders!

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/products | ❌ | All products (filter: ?category=Women&search=coat) |
| GET | /api/products/:id | ❌ | Single product |
| GET | /api/products/categories | ❌ | All categories |
| GET | /api/orders | ✅ | User's orders (filter: ?filter=active) |
| POST | /api/orders | ✅ | Place new order |
| DELETE | /api/orders/:id | ✅ | Cancel order |
| GET | /api/wishlist | ✅ | User's wishlist |
| POST | /api/wishlist/:productId | ✅ | Add to wishlist |
| DELETE | /api/wishlist/:productId | ✅ | Remove from wishlist |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, bcryptjs (password hashing), jsonwebtoken (JWT auth)
- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework needed)
- **Database**: In-memory (data resets on server restart — swap with MongoDB/PostgreSQL for production)

---

## 💡 Troubleshooting

**"Could not load products" error?**
→ Make sure the backend is running (`npm run dev` in the `backend/` folder).

**CORS error in browser console?**
→ Backend already has CORS enabled for all origins. If issues persist, try using Live Server instead of opening the HTML file directly.

**Port 5000 already in use?**
→ Change `const PORT = 5000` in `server.js` to another port like `3001`, then update `API_BASE` in `frontend/js/api.js` to match.
