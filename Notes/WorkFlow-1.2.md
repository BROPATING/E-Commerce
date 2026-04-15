# E-Commerce Full-Stack Application — Complete Workflow

> **Stack:** Node.js · Express · TypeORM · SQLite (better-sqlite3) · Angular 17 (NgModule)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Server Startup Flow](#2-server-startup-flow)
3. [Authentication Workflows](#3-authentication-workflows)
4. [Product & Taxonomy Workflows](#4-product--taxonomy-workflows)
5. [Cart Workflow](#5-cart-workflow)
6. [Checkout & Order Workflow](#6-checkout--order-workflow)
7. [Admin Workflows](#7-admin-workflows)
8. [Angular Frontend Workflow](#8-angular-frontend-workflow)
9. [Request Lifecycle — Every Authenticated Request](#9-request-lifecycle--every-authenticated-request)
10. [Seed Workflow](#10-seed-workflow)
11. [Error Handling Flow](#11-error-handling-flow)
12. [Key Design Decisions Quick Reference](#12-key-design-decisions-quick-reference)

---

## 1. Project Structure

```
E-Commerce/
├── BACK_END/
│   ├── src/
│   │   ├── app.ts                  ← Express app config (middleware, routes, static)
│   │   ├── server.ts               ← DB init → app.listen()
│   │   ├── config/
│   │   │   └── data-source.ts      ← TypeORM DataSource (SQLite)
│   │   ├── entities/               ← TypeORM entity classes (10 tables)
│   │   │   ├── User.ts
│   │   │   ├── Product.ts
│   │   │   ├── ProductType.ts
│   │   │   ├── Category.ts
│   │   │   ├── SubCategory.ts
│   │   │   ├── CartItem.ts
│   │   │   ├── Order.ts
│   │   │   ├── OrderItem.ts
│   │   │   └── ResetCode.ts
│   │   ├── routes/                 ← URL definitions + middleware application
│   │   │   ├── auth.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── cart.routes.ts
│   │   │   ├── order.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── controllers/            ← HTTP extraction + response
│   │   ├── services/               ← ALL business logic + DB queries
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts  ← requireAuth, requireRole
│   │   │   └── sessionStore.ts     ← in-memory Map (jti → SessionInfo)
│   │   └── seeds/
│   │       ├── seed.ts
│   │       ├── adminSeed.ts
│   │       ├── taxonomySeed.ts
│   │       ├── productSeed.ts
│   │       └── data/
│   │           ├── cleaned_products.csv
│   │           └── cleaned_furniture.csv
│   ├── uploads/                    ← product images (served as /images/*)
│   ├── .env
│   └── package.json
│
└── FRONT_END/frontend/
    └── src/app/
        ├── app.module.ts
        ├── app-routing.module.ts
        ├── core/
        │   ├── services/           ← AuthService, CartService, ProductService
        │   ├── guards/             ← AuthGuard, AdminGuard, GuestGuard
        │   └── interceptors/       ← CredentialsInterceptor
        ├── shared/
        │   └── components/         ← NavbarComponent, ProductCardComponent
        ├── features/               ← Lazy-loaded feature modules
        │   ├── auth/
        │   ├── products/
        │   ├── cart/
        │   └── orders/
        └── admin/                  ← Lazy-loaded AdminModule (guarded)
```

---

## 2. Server Startup Flow

```
npm run dev
    │
    ▼
server.ts
    │
    ├─ 1. import "reflect-metadata"      ← MUST be first — TypeORM decorator metadata
    ├─ 2. dotenv.config()                ← Load .env (JWT_SECRET, PORT, etc.)
    ├─ 3. validateEnv()                  ← process.exit(1) if JWT_SECRET missing or < 32 chars
    │
    ├─ 4. AppDataSource.initialize()
    │       │
    │       ├─ Connect to ecommerce.db (creates file if not exists)
    │       ├─ synchronize: true → TypeORM creates/updates all tables
    │       └─ Runs entity validation
    │
    ├─ 5. app.ts builds Express app:
    │       ├─ helmet()                  ← 15 security headers
    │       ├─ compression()             ← gzip all responses
    │       ├─ cors({ credentials: true, origin: "http://localhost:4200" })
    │       ├─ cookieParser()
    │       ├─ express.json()
    │       ├─ passport.initialize()
    │       ├─ app.use("/images", express.static("uploads"))
    │       ├─ app.use("/api/auth", authRouter)
    │       ├─ app.use("/api/products", productRouter)
    │       ├─ app.use("/api/cart", cartRouter)
    │       ├─ app.use("/api/orders", orderRouter)
    │       ├─ app.use("/api/admin", adminRouter)
    │       ├─ app.use("*", express.static("dist/frontend/browser"))  ← Angular
    │       └─ app.use(globalErrorHandler)
    │
    └─ 6. app.listen(3000)               ← Server ready
```

---

## 3. Authentication Workflows

### 3.1 Registration

```
POST /api/auth/register
    │
    ├─ 1. Rate limiter check (20 req / 15 min per IP)
    ├─ 2. express-validator:
    │       ├─ email: valid format
    │       ├─ password: min 6 chars
    │       └─ name: required
    ├─ 3. Collect ALL validation errors → return 422 if any
    ├─ 4. Normalise: email.toLowerCase().trim()
    ├─ 5. userRepo.findOne({ email }) → 409 if exists
    ├─ 6. bcrypt.hash(password, 12)     ← ~250ms deliberate slowness
    ├─ 7. userRepo.save(newUser)        ← role defaults to "customer"
    ├─ 8. Strip passwordHash from response
    └─ 9. Return 201 { user }
```

### 3.2 Login

```
POST /api/auth/login
    │
    ├─ 1. Rate limiter check (10 req / 15 min per IP)
    ├─ 2. userRepo.findOne({ email })
    │       └─ If NOT found:
    │               bcrypt.compare(password, DUMMY_HASH)  ← timing attack mitigation
    │               return 401 "Invalid credentials"       ← same ~250ms response
    │
    ├─ 3. bcrypt.compare(submittedPassword, user.passwordHash)
    │       └─ If mismatch → 401 "Invalid credentials"
    │
    ├─ 4. Check user.isLocked → 403 "Account is locked"
    │
    ├─ 5. jti = uuid.v4()              ← unique session ID
    │
    ├─ 6. jwt.sign({ id, role, jti }, JWT_SECRET, { expiresIn: "7d" })
    │
    ├─ 7. sessionStore.create(jti, { userId, ip, userAgent, createdAt })
    │       └─ Stored in:
    │               Map 1: sessions.set(jti, SessionInfo)
    │               Map 2: userIndex.set(userId, Set<jti>)
    │
    ├─ 8. res.cookie("token", jwt, {
    │       httpOnly: true,            ← JS cannot read
    │       sameSite: "lax",           ← CSRF protection
    │       secure: production,        ← HTTPS only in prod
    │       maxAge: 7 * 24 * 60 * 60 * 1000
    │   })
    │
    └─ 9. Return 200 { user (no hash) }
```

### 3.3 Logout

```
POST /api/auth/logout
    │
    ├─ 1. requireAuth middleware validates JWT + session
    ├─ 2. sessionStore.delete(jti)     ← remove this session
    ├─ 3. res.clearCookie("token")
    └─ 4. Return 200 "Logged out"

POST /api/auth/logout-all
    │
    ├─ 1. requireAuth
    └─ 2. sessionStore.deleteAllForUser(userId)  ← ALL devices logged out
```

### 3.4 Forgot Password Flow

```
Step 1 — POST /api/auth/forgot-password
    ├─ Always returns 200 (same message whether email found or not)
    │    ← prevents user enumeration
    ├─ If user found:
    │       ├─ Generate random 6-digit code
    │       ├─ Save ResetCode { userId, code, expiresAt: now+10min, used: false }
    │       └─ [In production: send email]
    └─ Return 200 "If account exists, code was sent"

Step 2 — POST /api/auth/get-reset-code  (rate limited: 3 req / 15 min)
    ├─ Find latest unused, unexpired code for email
    └─ Return { code }  ← simulates email delivery in dev

Step 3 — POST /api/auth/reset-password
    ├─ Find ResetCode where code matches + not used + not expired
    ├─ resetCode.used = true  ← mark used BEFORE changing password (replay attack prevention)
    ├─ Save used=true
    ├─ bcrypt.hash(newPassword, 12)
    ├─ user.passwordHash = newHash
    ├─ Save user
    ├─ sessionStore.deleteAllForUser(userId)  ← invalidate all sessions
    └─ Return 200 "Password reset successfully"
```

---

## 4. Product & Taxonomy Workflows

### 4.1 Get Products (with filtering)

```
GET /api/products?typeId=1&categoryId=2&search=phone&minPrice=5000&page=2
    │
    ├─ productService.getProducts({
    │       page, limit: Math.min(pageSize, 50),   ← DoS cap
    │       search, typeId, categoryId, subCategoryId,
    │       minPrice, maxPrice, inStock
    │   })
    │
    ├─ QueryBuilder:
    │       .leftJoinAndSelect("product.subCategory", "subCategory")
    │       .leftJoinAndSelect("subCategory.category", "category")
    │       .leftJoinAndSelect("category.type", "type")
    │
    ├─ Conditional filters (all use .andWhere() — never overwrites):
    │       search     → LOWER(name) LIKE :q OR LOWER(description) LIKE :q
    │       typeId     → type.id = :typeId
    │       categoryId → category.id = :categoryId
    │       subId      → subCategory.id = :subId
    │       minPrice   → product.price >= :min
    │       maxPrice   → product.price <= :max
    │       inStock    → product.stock > 0
    │
    ├─ .skip((page-1) * limit).take(limit)
    ├─ .getManyAndCount()
    │
    └─ Return { products, pagination: { total, page, limit, totalPages } }
```

### 4.2 Image URL Construction

```
Product in DB:
    imagePath = "keyboard-1703456789-492.jpg"     ← local upload
    imagePath = "https://rukminim2.flixcart.com/..." ← external URL

getImageUrl(imagePath):
    ├─ if imagePath starts with "http" → return as-is
    └─ else → return imageBaseUrl + "/" + imagePath
               (imageBaseUrl comes from .env)
```

### 4.3 Product Upload (Admin)

```
POST /api/admin/products  (multipart/form-data)
    │
    ├─ multer middleware:
    │       ├─ fileFilter: check file.mimetype against allowlist
    │       ├─ limits: { fileSize: 5MB }
    │       └─ filename: Date.now() + random + extension  ← prevents collision + path traversal
    │
    ├─ Validate: name, description, price, stock, subCategoryId
    ├─ productService.createProduct(data, file?.filename)
    └─ Return 201 { product }

DELETE /api/admin/products/:id
    ├─ Check if product has OrderItems → if yes: RESTRICT FK prevents hard delete
    ├─ productRepo.softRemove(product)  ← sets deletedAt = now()
    └─ TypeORM auto-excludes from all future find() queries
```

---

## 5. Cart Workflow

### 5.1 Add to Cart (Idempotent)

```
POST /api/cart/items  { productId, quantity }
    │
    ├─ requireAuth + requireRole("customer")
    ├─ Load user's cart (created at registration, always exists)
    ├─ cartItemRepo.findOne({ where: { cart, product } })
    │       ├─ FOUND: item.quantity += quantity → save (UPDATE)
    │       └─ NOT FOUND: cartItemRepo.create({ cart, product, quantity }) → save (INSERT)
    └─ Return 200/201 { cartItem }
```

### 5.2 Update Quantity

```
PUT /api/cart/items/:id  { quantity }
    │
    ├─ requireAuth
    ├─ Load CartItem with relations: cart → user
    ├─ IDOR check: item.cart.user.id !== req.user.id → 403
    ├─ item.quantity = quantity
    └─ Save → Return 200 { cartItem }
```

### 5.3 Remove from Cart

```
DELETE /api/cart/items/:id
    │
    ├─ requireAuth
    ├─ Load CartItem with user relation
    ├─ IDOR check: item.cart.user.id !== req.user.id → 403
    └─ cartItemRepo.remove(item) → Return 200
```

---

## 6. Checkout & Order Workflow

### 6.1 Checkout Transaction (5 atomic steps)

```
POST /api/orders/checkout  { paymentMethod }
    │
    ├─ requireAuth + requireRole("customer")
    │
    ├─ PRE-TRANSACTION VALIDATION (cheap, no DB lock):
    │       ├─ Validate paymentMethod ∈ ["card","upi","cod","netbanking"]
    │       ├─ Load cart with items + products
    │       ├─ Check cart not empty → 400
    │       └─ Check all products have sufficient stock → 400
    │
    └─ AppDataSource.transaction(async (manager) => {
            │
            ├─ Step 1: Create Order
            │       order = manager.create(Order, {
            │           user, totalAmount, paymentMethod, status: "pending"
            │       })
            │       await manager.save(order)
            │
            ├─ Step 2: Create OrderItems with price snapshots
            │       orderItems = cartItems.map(item => manager.create(OrderItem, {
            │           order,
            │           product: item.product,
            │           quantity: item.quantity,
            │           priceAtPurchase: item.product.price   ← SNAPSHOT (not FK)
            │       }))
            │       await manager.save(orderItems)
            │
            ├─ Step 3: Decrement stock (atomic SQL UPDATE)
            │       for (const item of cartItems) {
            │           await manager.decrement(Product, { id }, "stock", qty)
            │           ← SQL: UPDATE product SET stock = stock - qty WHERE id = ?
            │           ← ATOMIC — no race condition
            │       }
            │
            └─ Step 4: Clear cart
                    await manager.remove(CartItem, cartItems)
        })

    POST-TRANSACTION:
    ├─ paymentService.createPaymentRecord(order)   ← external concern, after commit
    └─ Return 201 { order }

    If ANY step throws → entire transaction ROLLS BACK
    → Order never created, stock unchanged, cart intact
```

### 6.2 Order Status Flow

```
pending → processing → shipped → delivered
       ↘ cancelled

Business rules:
    ├─ status === "cancelled" → any transition → 409 Conflict (cannot un-cancel)
    └─ Admin can update via PATCH /api/admin/orders/:id/status
```

---

## 7. Admin Workflows

### 7.1 Route Protection

```
admin.routes.ts:
    router.use(requireAuth, requireRole("admin"))
    ← Applied at TOP of file
    ← EVERY route below is automatically protected
    ← Impossible to add an unprotected admin route
```

### 7.2 Lock / Unlock Customer

```
PATCH /api/admin/customers/:id/lock
    │
    ├─ 1. user.isLocked = true → save to DB     ← persistent, survives restart
    ├─ 2. sessionStore.deleteAllForUser(userId)  ← immediate, all devices
    └─ 3. Return 200

Result:
    ├─ Future logins blocked (DB check)
    └─ Current sessions invalidated on next request (Map check)

PATCH /api/admin/customers/:id/unlock
    ├─ user.isLocked = false → save
    └─ (No session action — user is already logged out)
```

### 7.3 Dashboard Stats (Parallel Queries)

```
GET /api/admin/dashboard
    │
    └─ Promise.all([
            userRepo.count({ where: { role: "customer" } }),
            orderRepo.count(),
            userRepo.count({ where: { isLocked: true } }),
            sessionStore.getActiveSessionCount()
        ])
        ← All 4 queries run SIMULTANEOUSLY
        ← Total time = slowest single query (~10ms)
        ← NOT sequential (would be 40ms)
```

---

## 8. Angular Frontend Workflow

### 8.1 App Bootstrap

```
main.ts → platformBrowserDynamic().bootstrapModule(AppModule)
    │
    AppModule imports:
        ├─ HttpClientModule
        ├─ SharedModule (NavbarComponent, ProductCardComponent)
        └─ AppRoutingModule (lazy routes)

    AppComponent.ngOnInit():
        └─ authService.checkSession()
                → GET /api/profile
                → Browser sends httpOnly cookie automatically
                → If 200: currentUserSubject.next(user)
                → If 401: currentUserSubject.next(null)
                ← Restores auth state after page refresh
```

### 8.2 Routing & Lazy Loading

```
AppRoutingModule:
    /                → HomeComponent (eager)
    /products        → ProductsModule (lazy)
    /products/:id    → ProductDetailComponent (lazy, inside ProductsModule)
    /auth/login      → AuthModule (lazy)
    /auth/register   → AuthModule (lazy)
    /cart            → CartModule (lazy) [AuthGuard]
    /checkout        → CartModule (lazy) [AuthGuard]
    /orders          → OrdersModule (lazy) [AuthGuard]
    /profile         → ProfileModule (lazy) [AuthGuard]
    /admin           → AdminModule (lazy) [AdminGuard]
        /admin/products    → AdminProductsComponent
        /admin/products/new → AdminProductFormComponent
        /admin/products/:id → AdminProductFormComponent (edit)
        /admin/customers   → AdminCustomersComponent
        /admin/orders      → AdminOrdersComponent
        /admin/orders/:id  → AdminOrderDetailComponent

AdminGuard:
    ├─ canActivate() checks authService.currentUser?.role === "admin"
    ├─ Returns false → Angular NEVER calls import("./admin/admin.module")
    └─ Admin JS bundle never downloaded by non-admin users
```

### 8.3 HTTP Interceptor Flow

```
Any HttpClient call (e.g. productService.getProducts()):
    │
    CredentialsInterceptor.intercept():
        ├─ Clone request (HttpRequest is immutable)
        └─ Add withCredentials: true
               ← Tells browser: send cookies on this cross-origin request
               ← Required because dev: Angular=4200, API=3000 (different origins)

    Backend cors config:
        cors({ credentials: true, origin: "http://localhost:4200" })
        ← BOTH sides must opt in — without either, cookie is silently omitted
```

### 8.4 Product List — URL as Source of Truth

```
User navigates to /products?typeId=1&page=2
    │
    route.queryParams.subscribe(params => {
        ├─ filterForm.patchValue({
        │       typeId: params["typeId"] || "",
        │       search: params["search"] || "",
        │       ... all filters
        │   }, { emitEvent: false })
        │
        ├─ pagination.page = params["page"] ? Number(params["page"]) : 1
        │
        └─ loadProducts()
    })

applyFilters():
    └─ router.navigate(["/products"], { queryParams })
           ← Updates URL → triggers queryParams.subscribe above
           ← URL is always in sync with filter state
           ← Bookmarkable, shareable, browser back/forward works
```

### 8.5 Auth State (BehaviorSubject Pattern)

```
AuthService:
    private currentUserSubject = new BehaviorSubject<User | null>(null)
    public  currentUser$       = this.currentUserSubject.asObservable()
    
    ← Only AuthService can write (private BehaviorSubject)
    ← All components subscribe to read-only Observable

    login()   → currentUserSubject.next(user)
    logout()  → currentUserSubject.next(null)
    
    Why BehaviorSubject not Subject:
        ← Navbar subscribes AFTER login → gets current value immediately
        ← Subject would miss the emission (no stored value)
```

### 8.6 Admin Product Form — forkJoin Fix

```
ngOnInit():
    │
    forkJoin([
        adminService.getTaxonomy(),      ← fires simultaneously
        productService.getProductById()  ← fires simultaneously
    ]).subscribe(([taxRes, prodRes]) => {
        │
        ├─ 1. this.taxonomy = taxRes.taxonomy    ← select options now populated
        │
        └─ 2. form.patchValue({
                   subCategoryId: String(prod.subCategory.id)  ← String() not Number()
               })                                               ← HTML option values are strings
    })

    Why forkJoin:
        Sequential calls: taxonomy loads → product loads → patchValue
            ← RACE CONDITION: patchValue may run before select options exist
        forkJoin: BOTH complete → THEN patchValue
            ← Taxonomy guaranteed loaded before pre-selection
```

---

## 9. Request Lifecycle — Every Authenticated Request

```
Browser sends: GET /api/cart  (cookie: token=eyJhbGc...)
    │
    ├─ 1. cors()         — check Origin header
    ├─ 2. helmet()       — set security headers on response
    ├─ 3. compression()  — prepare gzip
    ├─ 4. cookieParser() — parse cookie → req.cookies.token = "eyJ..."
    ├─ 5. passport-jwt   — cookieExtractor reads req.cookies.token
    │                     jwt.verify(token, JWT_SECRET)
    │                     ├─ Invalid signature → 401
    │                     └─ Expired → 401
    │
    ├─ 6. requireAuth middleware:
    │       sessionStore.get(jti)
    │       ├─ Not found (revoked/logout) → 401 "Session expired"
    │       └─ Found → continue
    │
    ├─ 7. Load user from DB → check isLocked → 403 if locked
    ├─ 8. req.user = { id, role, jti }
    │
    ├─ 9. Route handler runs
    ├─ 10. asyncHandler catches any thrown error → next(err)
    └─ 11. globalErrorHandler formats and sends error response
```

---

## 10. Seed Workflow

```
npm run seed  (from BACK_END/)
    │
    ├─ seed.ts:
    │       AppDataSource.initialize()   ← creates tables (synchronize: true)
    │
    ├─ seedAdmin():
    │       ├─ Check if admin@gmail.com exists → skip if yes
    │       ├─ bcrypt.hash("Admin@123", 12)
    │       ├─ Create admin user
    │       └─ Create 4 customer users (kiro, sanya, ved, sao)
    │
    ├─ seedTaxonomy():
    │       ├─ Check typeRepo.count() > 0 → skip if already seeded
    │       └─ Create: 3 ProductTypes → 6 Categories → 20 SubCategories
    │               Electronics → Mobile Phones → [Smartphones, Laptops]
    │               Electronics → Mobile Accessories → [Earphones, ...]
    │               Furniture → Home → [Tables, Chairs, Shelves]
    │
    └─ seedProducts():
            ├─ Load cleaned_products.csv  (39 rows: phones + laptops + earphones)
            ├─ Load cleaned_furniture.csv (20 rows: home furniture)
            │
            ├─ For each row:
            │       ├─ Find SubCategory by subCategoryName (case-insensitive)
            │       ├─ Fallback: find by category name
            │       └─ Skip if not found
            │
            ├─ Check existingCount > 0 → skip all if already seeded
            └─ Save in batches of 20

Credentials after seed:
    admin@gmail.com  / Admin@123   (role: admin)
    kiro@gmail.com   / kiro123     (role: customer)
    san@gmail.com    / san123      (role: customer)
    ved@gmail.com    / ved123      (role: customer)
    sao@gmail.com    / sao123      (role: customer)
```

---

## 11. Error Handling Flow

```
Any async controller error:
    │
    asyncHandler wrapper:
        Promise.resolve(fn(req, res, next)).catch(next)
        ← next(err) called automatically
        ← No try/catch needed in every controller
    │
    ▼
globalErrorHandler(err, req, res, next):
    ├─ TypeORM QueryFailedError → 400 (bad data)
    ├─ EntityNotFoundError      → 404
    ├─ JWT errors               → 401
    ├─ Custom AppError          → err.statusCode
    └─ Uncaught                 → 500 (never expose stack in production)
```

---

## 12. Key Design Decisions Quick Reference

| Decision | What | Why |
|---|---|---|
| **priceAtPurchase** | Copy price to OrderItem at checkout | Product price can change — order history must show what customer actually paid |
| **Soft delete** | `deletedAt` column on Product | RESTRICT FK prevents hard delete; soft delete preserves order history |
| **httpOnly cookie** | JWT stored in cookie not localStorage | XSS attack cannot read httpOnly cookie; localStorage is readable by any script |
| **sameSite: lax** | Not strict | strict breaks login from email/WhatsApp links; lax blocks cross-site POST (CSRF) |
| **jti (UUID)** | Session key in Map | Enables per-device logout; 36 chars vs 200+ chars for full JWT |
| **In-memory Map** | Session store | Nanosecond lookup on every request; tradeoff: lost on restart (use Redis in prod) |
| **bcrypt cost 12** | Password hashing | ~250ms per hash = catastrophic for brute force; SHA-256 = billions/sec |
| **forkJoin** | Admin edit form | Guarantees taxonomy loaded before patchValue; sequential = race condition |
| **String(id)** | subCategoryId patch | HTML option values are strings; number ≠ string in Angular form binding |
| **andWhere()** | QueryBuilder filters | `.where()` overwrites previous condition; `.andWhere()` appends with AND |
| **Math.min(pageSize, 50)** | Pagination cap | `?pageSize=100000` would load entire DB — single-line DoS prevention |
| **manager.decrement()** | Stock reduction | `UPDATE stock = stock - qty` is atomic; load-subtract-save has race condition |
| **Promise.all** | Dashboard stats | 4 independent queries run in parallel = 10ms vs sequential 40ms |
| **Parent-level guard** | AdminGuard on /admin | Protects all child routes; child-level = one missed route = security hole |
| **BehaviorSubject** | currentUser$ | Emits current value to late subscribers; Subject only emits to active subscribers |
| **router.use(requireAuth)** | Admin routes | Applied at top of file = every route auto-protected; cannot forget |
| **RESTRICT on OrderItem→Product** | FK strategy | CASCADE would silently delete order history when product is removed |
| **Filename in DB** | Image storage | Full URL couples DB to deployment domain; filename + env var = zero-migration |
| **validateEnv()** | Startup check | Fail-fast before accepting requests; missing JWT_SECRET = complete auth bypass |

---

*Generated for E-Commerce Full-Stack Project — Node.js / Express / TypeORM / SQLite / Angular 17*
