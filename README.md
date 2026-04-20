<div align="center">

# 🛒 ShopNow

### A modern full-stack e-commerce platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3.x-FE0902?logo=typeorm&logoColor=white)](https://typeorm.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)

*A production-grade e-commerce platform with secure authentication, atomic checkout transactions, and a comprehensive admin panel — featuring a custom dark cyan theme.*

[Features](#-features) • [Demo](#-screenshots) • [Quick Start](#-quick-start) • [API Docs](#-api-reference) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📸 Screenshots

<div align="center">

<table>
  <tr>
    <td align="center"><b>🏠 Home</b></td>
    <td align="center"><b>🛍️ Products</b></td>
  </tr>
  <tr>
    <td><img src="./screenshots/home.png" alt="Home" width="100%"/></td>
    <td><img src="./screenshots/products.png" alt="Products" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>🛒 Cart</b></td>
    <td align="center"><b>💳 Checkout</b></td>
  </tr>
  <tr>
    <td><img src="./screenshots/cart.png" alt="Cart" width="100%"/></td>
    <td><img src="./screenshots/checkout.png" alt="Checkout" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>📊 Admin Dashboard</b></td>
    <td align="center"><b>📦 Admin Products</b></td>
  </tr>
  <tr>
    <td><img src="./screenshots/admin-dashboard.png" alt="Admin" width="100%"/></td>
    <td><img src="./screenshots/admin-products.png" alt="Admin Products" width="100%"/></td>
  </tr>
</table>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🛍️ Customer
- 🔐 Secure authentication with JWT cookies
- 🔑 Forgot password with 6-digit OTP flow
- 🔍 Full-text search across name & description
- 🎯 Advanced filtering (category, price, stock)
- 🛒 Persistent cart across sessions
- ⚡ Atomic checkout transaction
- 📜 Order history with price snapshots
- 👤 Profile & session management

</td>
<td width="50%" valign="top">

### 👨‍💼 Admin
- 📊 Real-time dashboard statistics
- 📦 Full product CRUD with image upload
- 🗂️ Soft delete & restore functionality
- 📋 Order management with status updates
- 👥 Customer lock/unlock controls
- 🔒 Lazy-loaded module (hidden from customers)
- 🖼️ Drag & drop image uploads
- ⚡ Parallel query optimization

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎨 Design
- 🌙 Custom dark cyan theme (`#06b6d4`)
- ✨ Smooth entrance animations
- 💀 Skeleton loading states
- 📱 Fully responsive (mobile-first)
- ♿ Accessibility-focused markup

</td>
<td width="50%" valign="top">

### 🔒 Security
- 🧂 bcrypt hashing (cost factor 12)
- 🍪 httpOnly, sameSite cookies
- 🛡️ CSRF & XSS protection
- ⏱️ Timing attack mitigation
- 🚫 Rate limiting on auth routes

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|:-----:|:-------------|
| **Frontend** | Angular 17 · TypeScript · RxJS · Reactive Forms · NgModule |
| **Backend** | Node.js · Express · TypeScript · TypeORM · Passport.js |
| **Database** | SQLite (better-sqlite3) |
| **Auth** | JWT · bcrypt · httpOnly cookies · In-memory session store |
| **Security** | Helmet · CORS · Rate Limiting · express-validator |
| **DevOps** | npm scripts · TypeScript compiler · ts-node-dev |

</div>

---

## 🚀 Quick Start

### Prerequisites

```bash
node --version    # v18.0.0 or higher
npm --version     # v9.0.0 or higher
ng version        # v17.x.x (install: npm i -g @angular/cli@17)
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/shopnow.git
cd shopnow

# 2. Install backend dependencies
cd BACK_END
npm install

# 3. Create .env file (see Environment Variables below)
cp .env.example .env

# 4. Seed the database
npm run seed

# 5. Install frontend dependencies (new terminal)
cd ../FRONT_END/frontend
npm install
```

### Run the Application

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd BACK_END
npm run dev

# Terminal 2 — Frontend (http://localhost:4200)
cd FRONT_END/frontend
npm start
```

Open **[http://localhost:4200](http://localhost:4200)** in your browser. 🎉

---

## 🔐 Environment Variables

Create a `.env` file in the `BACK_END/` folder:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
FRONTEND_URL=http://localhost:4200
IMAGE_BASE_URL=http://localhost:3000/images
```

> ⚠️ **`JWT_SECRET` must be at least 32 characters** — the server will refuse to start otherwise (fail-fast validation).

---

## 👤 Default Credentials

After running `npm run seed`:

<div align="center">

| Role | Email | Password |
|:-----|:------|:---------|
| 👑 **Admin** | `admin@gmail.com` | `Admin@123` |
| 🧑 Customer | `kiro@gmail.com` | `kiro123` |
| 🧑 Customer | `san@gmail.com` | `san123` |
| 🧑 Customer | `ved@gmail.com` | `ved123` |
| 🧑 Customer | `sao@gmail.com` | `sao123` |

</div>

---

## 📁 Project Structure

<details>
<summary><b>Click to expand folder tree</b></summary>

```
shopnow/
├── BACK_END/
│   ├── src/
│   │   ├── app.ts                    # Express app configuration
│   │   ├── server.ts                 # Entry point
│   │   ├── config/data-source.ts     # TypeORM DataSource
│   │   ├── entities/                 # 10 TypeORM entity classes
│   │   ├── routes/                   # URL definitions + middleware
│   │   ├── controllers/              # Request/response handlers
│   │   ├── services/                 # Business logic + DB queries
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # requireAuth, requireRole
│   │   │   └── sessionStore.ts       # In-memory session Map
│   │   └── seeds/
│   │       ├── seed.ts               # Main seed runner
│   │       ├── adminSeed.ts          # Users
│   │       ├── taxonomySeed.ts       # Categories
│   │       ├── productSeed.ts        # CSV import
│   │       └── data/*.csv            # Seed data
│   ├── uploads/                      # Uploaded images
│   └── ecommerce.db                  # SQLite database
│
└── FRONT_END/frontend/
    └── src/app/
        ├── core/
        │   ├── services/             # Auth, Cart, Product services
        │   ├── guards/               # AuthGuard, AdminGuard
        │   └── interceptors/         # CredentialsInterceptor
        ├── shared/                   # Navbar, ProductCard
        ├── features/                 # Auth, Products, Cart, Orders
        └── admin/                    # Lazy-loaded admin module
```

</details>

---

## 🔌 API Reference

<details>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/api/auth/register` | Public | Register new customer |
| `POST` | `/api/auth/login` | Public | Login (returns httpOnly cookie) |
| `POST` | `/api/auth/logout` | Auth | Logout current session |
| `POST` | `/api/auth/logout-all` | Auth | Logout all devices |
| `POST` | `/api/auth/forgot-password` | Public | Request OTP code |
| `POST` | `/api/auth/get-reset-code` | Rate-limited | Retrieve stored code |
| `POST` | `/api/auth/reset-password` | Public | Reset password with code |

</details>

<details>
<summary><b>🛍️ Products & Taxonomy</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/products` | Public | List with filters & pagination |
| `GET` | `/api/products/:id` | Public | Product detail |
| `GET` | `/api/taxonomy/tree` | Public | Full taxonomy tree |

**Query parameters** for `/api/products`:
```
?search=phone
&typeId=1
&categoryId=2
&subCategoryId=5
&minPrice=1000
&maxPrice=50000
&inStock=true
&page=1
&limit=12
```

</details>

<details>
<summary><b>🛒 Cart</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/cart` | Customer | Get cart with items |
| `POST` | `/api/cart/items` | Customer | Add item (idempotent) |
| `PUT` | `/api/cart/items/:id` | Customer | Update quantity |
| `DELETE` | `/api/cart/items/:id` | Customer | Remove item |
| `DELETE` | `/api/cart` | Customer | Clear cart |

</details>

<details>
<summary><b>📦 Orders</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/api/orders/checkout` | Customer | Atomic checkout transaction |
| `GET` | `/api/orders/my` | Customer | My order history |
| `GET` | `/api/orders/:id` | Customer/Admin | Order detail |

</details>

<details>
<summary><b>👨‍💼 Admin</b></summary>

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/admin/dashboard` | Dashboard statistics |
| `GET` | `/api/admin/customers` | All customers |
| `PATCH` | `/api/admin/customers/:id/lock` | Lock account + kill sessions |
| `PATCH` | `/api/admin/customers/:id/unlock` | Unlock account |
| `GET` | `/api/admin/orders` | All orders |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/admin/products` | Product CRUD |

> All admin endpoints require `Admin` role (enforced at router level).

</details>

---

## 🏗️ Architecture

### Three-Layer Backend

```
   ┌──────────┐      ┌──────────────┐      ┌──────────┐
   │  Routes  │  →   │  Controllers │  →   │ Services │
   └──────────┘      └──────────────┘      └──────────┘
    URLs +            Request/response       Business logic
    middleware        extraction             + DB queries
```

### Key Design Decisions

<table>
<tr>
<th width="30%">Decision</th>
<th width="70%">Reasoning</th>
</tr>
<tr>
<td><b>Price Snapshot</b></td>
<td><code>OrderItem.priceAtPurchase</code> stores price at checkout as a decimal (not FK). Order history remains accurate even when product prices change.</td>
</tr>
<tr>
<td><b>Soft Delete</b></td>
<td>Products use <code>@DeleteDateColumn()</code> to preserve OrderItem references while hiding from customers.</td>
</tr>
<tr>
<td><b>httpOnly Cookies</b></td>
<td>JWT stored in cookie invisible to JavaScript — blocks XSS token theft completely.</td>
</tr>
<tr>
<td><b>In-Memory Sessions</b></td>
<td>Map&lt;jti, SessionInfo&gt; for O(1) lookups and instant per-device logout. Would use Redis in production.</td>
</tr>
<tr>
<td><b>Atomic Checkout</b></td>
<td>5-step transaction (Order → OrderItems → Stock → Cart → Payment) with full rollback on any failure.</td>
</tr>
<tr>
<td><b>Lazy Admin Module</b></td>
<td>AdminGuard runs <i>before</i> lazy import — non-admin users never download admin code.</td>
</tr>
</table>

### Database Schema

```
product_type → catogory → sub_category → product
                                              ↓
user ← cart_item ←———————————————————————————┘
  ↓
reset_code

user → order → order_item → product (RESTRICT)
```

> 📊 View the complete [ERD diagram](docs/ecommerce_schema.svg)

---

## 🌱 Seed Data

Running `npm run seed` populates:

<div align="center">

| Category | Count | Price Range |
|:---------|:-----:|:-----------:|
| 📱 Smartphones | 15 | ₹5,999 – ₹74,900 |
| 💻 Laptops | 12 | ₹16,990 – ₹1,05,590 |
| 🎧 Earphones | 12 | ₹299 – ₹11,999 |
| 🏡 Home Furniture | 20 | ₹415 – ₹12,367 |
| **Total** | **59** | |

</div>

---

## 📜 Available Scripts

<table>
<tr>
<th>Backend</th>
<th>Frontend</th>
</tr>
<tr>
<td valign="top">

```bash
npm run dev      # Start dev server
npm run build    # Compile TypeScript
npm start        # Run production
npm run seed     # Seed database
```

</td>
<td valign="top">

```bash
npm start        # Start dev server (4200)
npm run build    # Production build
npm test         # Run unit tests
```

</td>
</tr>
</table>

---

## 🔧 Troubleshooting

<details>
<summary><b>❌ Cannot find module './seed.ts'</b></summary>

**Fix:** Update your `package.json` seed script path and run from the `BACK_END/` folder:

```json
{
  "scripts": {
    "seed": "ts-node -r reflect-metadata src/seeds/seed.ts"
  }
}
```

</details>

<details>
<summary><b>❌ SqliteError: no such table: user</b></summary>

**Fix:** Set `synchronize: true` in `src/config/data-source.ts`. TypeORM will create tables automatically on connection.

</details>

<details>
<summary><b>❌ Empty product list on frontend</b></summary>

**Fix:** Check in order:
1. Verify seed ran successfully: `npm run seed`
2. Test API directly: `http://localhost:3000/api/products`
3. Check database filename matches between seed and app config

</details>

<details>
<summary><b>❌ Image URL shows double prefix</b></summary>

**Fix:** Update `ProductService.getImageUrl()`:

```typescript
getImageUrl(imagePath: string | null): string {
  if (!imagePath) return `${environment.imageBaseUrl}/default.png`;
  if (imagePath.startsWith('http')) return imagePath;
  return `${environment.imageBaseUrl}/${imagePath}`;
}
```

</details>

<details>
<summary><b>❌ Admin edit — subCategory dropdown doesn't pre-select</b></summary>

**Fix:** Use `forkJoin` to ensure taxonomy loads before patching, and convert ID to string:

```typescript
forkJoin([taxonomy$, product$]).subscribe(([tax, prod]) => {
  this.taxonomy = tax.taxonomy;
  this.form.patchValue({
    subCategoryId: String(prod.product.subCategory.id)
  });
});
```

</details>

<details>
<summary><b>❌ Pagination "Next" button doesn't navigate</b></summary>

**Fix:** Read page from URL in `queryParams.subscribe`:

```typescript
this.pagination.page = params['page'] ? Number(params['page']) : 1;
```

</details>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 🌟 Show Your Support

If this project helped you, please consider giving it a ⭐️!

---

<div align="center">

### Built with ❤️ using Node.js, Express, TypeORM & Angular 17

**[⬆ Back to Top](#-shopnow)**

</div>
