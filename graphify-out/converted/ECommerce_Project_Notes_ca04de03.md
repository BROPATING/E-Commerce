<!-- converted from ECommerce_Project_Notes.docx -->

E-Commerce Application
Complete Project Notes & Interview Reference
Full-Stack: Node.js • Express • TypeORM • SQLite • Angular 17


# 1. Architecture & Tech Stack

## 1.1 The Big Picture — One Process, One Port
Core rule: One Node.js process serves BOTH the Angular frontend and the Express API on port 3000. In production, ng build compiles Angular into static files, and Express serves them alongside the API.


## 1.2 Tech Stack — Every Package Explained

## 1.3 Three-Layer Backend Architecture
Routes → Controllers → Services — this separation is non-negotiable.


## 1.4 Frontend Architecture — Angular NgModule
The project uses NgModules (not standalone components) because the requirement document explicitly says: "The Admin panel must be implemented as a separate lazy-loaded Angular module." The word module maps directly to @NgModule.



# 2. Database Schema & Entity Design

## 2.1 The 10 Entities

## 2.2 The Price Snapshot — Most Important Design Decision

The Solution — Deliberate Denormalisation: OrderItem has a priceAtPurchase column (decimal). At checkout, we COPY the current product price into this column. It is a VALUE, not a foreign key. It never changes after that moment.


## 2.3 Foreign Key Strategies

## 2.4 New Entities Added (Advanced Features)


# 3. Authentication System

## 3.1 The Three Security Layers

## 3.2 The Session Store — Dual Map Architecture
The session store uses TWO Maps that work together for O(1) lookup efficiency:

// Map 1: jti (UUID) → SessionInfo (ip, userAgent, role, userId, createdAt)
private sessions: Map<string, SessionInfo>;

// Map 2: userId → Set of jtis (all active sessions for that user)
private userIndex: Map<number, Set<string>>;

// Why two maps?
// getForUser(userId) needs ALL sessions for one user.
// Without userIndex: iterate every entry in sessions Map — O(n) total sessions.
// With userIndex: O(1) lookup by userId, then delete each jti.


## 3.3 What is a jti and Why Use It Instead of the Token?
jti = JWT ID. A UUID embedded inside the JWT payload. Example: f47ac10b-58cc-4372-a567-0e02b2c3d479
- Using the full JWT string as the Map key wastes memory (hundreds of characters) and couples the key to the token format
- jti is a short UUID that identifies this specific login session independently of the token
- Enables per-device logout: DELETE /auth/logout/:jti removes exactly one session without affecting others

## 3.4 Cookie Security Flags


## 3.5 Complete Authentication Flows
### Flow 1 — Registration

### Flow 2 — Login

### Flow 3 — Authenticated Request (Every Protected Endpoint)
Browser sends: Cookie: token=eyJhbGciOiJIUzI1NiJ9...

Step 1: cookieParser() → req.cookies.token = "eyJ..."
Step 2: passport.authenticate("jwt") → calls cookieExtractor → gets raw JWT
Step 3: jwt.verify(token, JWT_SECRET) → checks signature + expiry
Step 4: sessionStore.get(jti) → if undefined → 401 "Session expired or revoked"
Step 5: Load user from DB → check isLocked → attach to req.user
Step 6: requireRole("admin") checks req.user.role → 403 if wrong role
Step 7: Route handler runs with full access to req.user

### Flow 4 — Account Lock (Immediate Enforcement)
Admin locks customer account → TWO things happen:
- Step 1 (Persistent): user.isLocked = true saved to database. Survives server restarts. Prevents all future logins.
- Step 2 (Immediate): sessionStore.deleteAllForUser(userId). Affects ALL devices simultaneously. Takes effect on their very NEXT request — even mid-session.


### Flow 5 — Forgot Password (3-Endpoint Secure Design)



# 4. Product, Taxonomy & Image APIs

## 4.1 Taxonomy Hierarchy
Products are organised in a four-level strict tree — no many-to-many relationships:
ProductType (e.g., Electronics)
└── Category (e.g., Computer Peripherals)
└── SubCategory (e.g., Keyboards)
└── Product (e.g., Anker Multimedia Keyboard)

getFullTree() caching: The taxonomy tree is cached in memory for 5 minutes using a SimpleCache class. Every search, product list, and admin form loads the taxonomy — caching eliminates repeated database queries for rarely-changing data.

## 4.2 Image Upload — Multer Configuration

## 4.3 Soft Delete for Products
@DeleteDateColumn() on Product entity. When softRemove() is called, TypeORM sets deletedAt = now instead of deleting the row. TypeORM automatically excludes soft-deleted products from ALL find() queries.
- Solves the FK constraint problem: OrderItem references Product with RESTRICT — hard delete fails if product appears in orders
- Preserves order history: customers can still see what product was in their past orders
- Admin can view deleted products (withDeleted: true) and restore them (recover())



# 5. Search, Filtering & Pagination

## 5.1 The Search Architecture
Critical requirement: Searching "table" must return BOTH "Wooden Table" (Furniture) AND "Multiplication Table Book" (Stationery) — cross-taxonomy results in one response.


## 5.2 andWhere vs where — The Most Common TypeORM Mistake

## 5.3 Server-Side Pagination Cap
Math.min(pageSize, 50) — This one line prevents a denial-of-service attack. Without it, a client sends ?pageSize=100000 and the server loads every product into memory in one query. The cap is invisible to legitimate users (they can request up to 50) but blocks all abuse.

## 5.4 Search Autocomplete — Separate Optimised Endpoint
GET /api/search/autocomplete?q= — A lightweight endpoint for instant suggestions as the user types.
- Only selects product.id and product.name — no relations loaded, no description, no images
- Separate rate limiter: 60 req/min (autocomplete fires on every keystroke)
- Limit 8 results maximum



# 6. Cart API

## 6.1 How the Cart Works
Key requirement: Cart must PERSIST across logout/login. This means it lives in the DATABASE (SQLite file on disk), not in memory or localStorage.

User (id: 1)
└── Cart (id: 1, userId: 1)      ← one cart per user, created at registration
├── CartItem (productId: 3, quantity: 2)
├── CartItem (productId: 7, quantity: 1)
└── CartItem (productId: 12, quantity: 4)

## 6.2 The Idempotent Add Pattern
When a customer clicks "Add to Cart" on an already-carted product:
- First click: CartItem(productId:3, quantity:1) — CREATED
- Second click: CartItem(productId:3, quantity:2) — UPDATED, not duplicated

IDOR Protection: On every updateQuantity and removeItem call — item.cart.user.id !== userId → 403. Prevents a customer from modifying another customer's cart by guessing cart item IDs.



# 7. Checkout & Order System

## 7.1 The Checkout Transaction — All or Nothing
Five operations must all succeed together or NONE commit:

## 7.2 manager.decrement() — Atomic Stock Reduction
manager.decrement(Product, { id }, "stock", qty) generates this SQL:
UPDATE product SET stock = stock - 2 WHERE id = 42


## 7.3 map() vs for...of — Service Logic Choice

## 7.4 Order Status Tracking
Orders have a status field with the workflow:
pending → processing → shipped → delivered
↘ cancelled

Business rule: Cannot un-cancel an order (status === "cancelled" → any other status = 409 Conflict)


# 8. Admin API

## 8.1 Router-Level Protection
router.use(requireAuth, requireRole("admin")) — applied at the TOP of admin.routes.ts, before any route is defined. Every route added to this file is automatically protected. It is physically impossible to add an admin route and forget to protect it.

## 8.2 Complete Admin Endpoint Map

## 8.3 Dashboard Stats — Promise.all Parallelism


# 9. Angular Frontend Architecture

## 9.1 BehaviorSubject — Shared Reactive State
Why BehaviorSubject instead of a plain variable? Multiple components across the entire app react to the same data: auth state, cart count, address list. A plain variable change notifies nobody. BehaviorSubject is an Observable that:
- Holds the current value at all times
- Immediately emits that value to ANY new subscriber (late subscribers get the current value instantly)
- Emits the new value to ALL active subscribers the moment it changes


Pattern: private currentUserSubject (write access — BehaviorSubject) + public currentUser$ (read-only — .asObservable()). Only AuthService can change the user. All other components subscribe to currentUser$ which is read-only.

## 9.2 HTTP Interceptor — withCredentials
Problem: HTTP-only cookies are NOT sent in cross-origin requests by default. In development, Angular runs on port 4200 and Express on port 3000 — different origins. The auth cookie would never reach the server.

Solution: CredentialsInterceptor runs on EVERY outgoing HTTP request, clones it (HttpRequest is immutable), and adds withCredentials: true.


## 9.3 Route Guards

Critical: Guards run BEFORE Angular decides whether to download a lazy module. AdminGuard.canActivate() returns false → the admin JavaScript bundle is NEVER downloaded. Non-admin users never download admin code.

Why parent-level guard? canActivate: [AdminGuard] on the parent /admin route protects ALL children automatically. If placed on each child individually, adding a new child and forgetting the guard creates an unprotected route.

## 9.4 Lazy Loading — The Admin Module
loadChildren: () => import("./admin/admin.module").then(m => m.AdminModule)
- The dynamic import() is only called when someone navigates to /admin for the first time
- For a customer who never visits /admin — the admin bundle is NEVER downloaded
- The chunk is cached after first download — navigating within admin doesn't re-download


## 9.5 Reactive Forms
Why reactive forms over template-driven? The entire form structure — controls, validators, cross-field validators — is defined in TypeScript. Test it without rendering a template. Validation errors in one place, not scattered across HTML.

markAllAsTouched() before invalid check: Validation error messages only show when a field is "touched". On first submit with empty form, no fields are touched — no errors show. markAllAsTouched() makes ALL error messages appear simultaneously.

Cross-field validator (password match): Applied to the FormGroup, not a control. Group validator receives the entire group — reads both password and confirmPassword. Error set on group: { passwordMismatch: true }. Template checks: form.hasError("passwordMismatch").

## 9.6 Auth State Restoration After Page Refresh
Problem: HTTP-only cookies are invisible to JavaScript. Angular cannot read the cookie to check login state. After refresh, Angular has no idea who is logged in.
Solution: AppComponent.ngOnInit() calls authService.checkSession() → GET /api/profile. Browser automatically sends the cookie. If valid, server returns user → BehaviorSubject updated. If 401 → null state. No redirect needed — user might be on a public page.


# 10. Complete API Endpoint Reference



# 11. Production Optimisations



# 12. Key Interview Questions & Answers

Q1: Why do you have both app.ts and server.ts instead of one file?

Q2: Why must reflect-metadata be the very first import in server.ts?

Q3: Why is price_at_purchase on OrderItem instead of reading product.price?

Q4: Why use RESTRICT on OrderItem → Product instead of CASCADE?

Q5: Your session store is in memory — what happens when the server restarts?

Q6: Why do you run bcrypt.compare even when the user isn't found?

Q7: Why use AppDataSource.transaction() for checkout instead of cascade: true?

Q8: Why does the product list component subscribe to route.queryParams instead of calling loadProducts() directly?

Q9: Why is the Admin module lazy loaded but the Auth guard runs eagerly before the module loads?

Q10: Why does the share button satisfy the spec's requirement that "if the URL is pasted on another device, the user should be directed to the same product page"?

Q11: You chose SQLite — how would this change if this went to production?

Q12: Why store only the filename in the database rather than the full image URL?


# 13. Quick Reference — Key Decisions Cheat Sheet


Study Tip
For every decision, be able to explain: WHAT it is, WHY you chose it, WHAT the alternative was, and WHY the alternative was worse for this specific project.
| Why one process?
Eliminates CORS complexity in production. No cross-origin headers needed. One deployment, one port, one server. |
| --- |
| Package | Role | Real-World Analogy |
| --- | --- | --- |
| express | Web framework & HTTP routing | The waiter who takes orders from customers |
| typeorm | ORM — maps JS classes to DB tables | The translator between JavaScript and SQL |
| sqlite3 (v5) | Database driver for SQLite | The telephone wire connecting to the DB file |
| reflect-metadata | Enables TypeORM decorators at runtime | The note-taking system for class metadata |
| bcrypt | Password hashing — slow by design | A bank vault that scrambles passwords irreversibly |
| jsonwebtoken | Creates/verifies signed JWT tokens | A tamper-proof digital ID card after login |
| cookie-parser | Parses HTTP cookie headers | Reads the ID card from the browser pocket |
| passport + passport-jwt | Auth middleware / JWT strategy | The security checkpoint at every door |
| multer | Handles multipart file uploads | The file clerk who processes image uploads |
| cors | Allows Angular (4200) to call API (3000) | The security gate allowing cross-origin calls |
| compression | Gzip compresses all responses | Shrinks food portions before delivery — same taste, lighter package |
| helmet | Sets security HTTP headers | Locks all windows and doors with security features |
| dotenv | Loads .env secrets into process.env | The secret vault keeping passwords out of code |
| express-validator | Validates + sanitises input | The checklist that verifies all form data at once |
| uuid | Generates unique session IDs (jti) | Creates a unique serial number for each login |
| Layer | File | Responsibility | What it CANNOT do |
| --- | --- | --- | --- |
| Routes | auth.routes.ts | Define URL, apply middleware, delegate | Touch database or business logic |
| Controllers | auth.controller.ts | Extract req data, call service, send res | Hash passwords or query DB directly |
| Services | auth.service.ts | ALL business logic — hash, query, decide | Know about req or res objects |
| Interview Answer: "Why three layers?"
"If I want to add a mobile app later, I only write new Routes — the Service layer is reused unchanged. If I want to unit test login logic, I test the Service directly without spinning up an HTTP server. The Controller is the only layer that knows about both HTTP and the business layer." |
| --- |
| Folder | Contents | Rule |
| --- | --- | --- |
| core/ | Guards, Interceptors, Auth/Cart/Order Services | Singleton — instantiated once for the whole app |
| features/ | Auth pages, Products, Cart, Checkout, Orders, Profile | Each feature is self-contained, lazy-loaded |
| shared/ | ProductCard, Pagination, Navbar | Purely presentational "dumb" components |
| admin/ | Dashboard, Products CRUD, Customers, Orders | Separate lazy-loaded AdminModule — never downloaded by customers |
| Entity | Table Name | Key Columns | Relationships |
| --- | --- | --- | --- |
| User | users | id, name, email (unique), passwordHash, role, isLocked | OneToOne Cart, OneToMany Orders |
| ProductType | product_types | id, name | OneToMany Categories |
| Category | categories | id, name, typeId (FK) | ManyToOne ProductType, OneToMany SubCategories |
| SubCategory | sub_categories | id, name, categoryId (FK) | ManyToOne Category, OneToMany Products |
| Product | products | id, name, description, price (decimal), stock, imagePath, deletedAt | ManyToOne SubCategory |
| Cart | carts | id, userId (FK, unique) | OneToOne User, OneToMany CartItems |
| CartItem | cart_items | id, cartId, productId, quantity | ManyToOne Cart, ManyToOne Product |
| Order | orders | id, userId, totalAmount, paymentMethod, status | ManyToOne User, OneToMany OrderItems |
| OrderItem | order_items | id, orderId, productId, quantity, priceAtPurchase | ManyToOne Order, ManyToOne Product |
| PasswordResetCode | password_reset_codes | id, userId, code (6-digit), expiresAt, used | ManyToOne User |
| The Problem
If OrderItem only stores a foreign key to Product, and an admin raises the price from ₹500 to ₹750, order history would show ₹750 — not what the customer actually paid. |
| --- |
| Interview Answer: "Why store the price twice?"
"This is a deliberate, justified violation of 3NF called denormalisation by intent. Product.price reflects current price — it can change. OrderItem.priceAtPurchase is a historical fact — the price the customer actually paid. Joining to Product.price for order history would show wrong amounts, which could be a legal issue. The price snapshot makes order history immutable to future pricing changes. Compare it to a movie ticket stub — it shows ₹200 even if today's ticket costs ₹500." |
| --- |
| CASCADE (delete children too) | RESTRICT (refuse to delete parent) |
| --- | --- |
| Used on: CartItem → User | Used on: OrderItem → Product |
| Logic: If user deleted, their cart items have no meaning | Logic: Cannot delete a product that appears in real orders — that would corrupt history |
| Effect: Auto-cleanup when parent is removed | Effect: Forces admin to mark product inactive instead of hard-deleting |
| Entity | Purpose | Key Business Rule |
| --- | --- | --- |
| RecentlyViewed | Tracks last 10 products viewed by customer | Upsert pattern — update timestamp if already viewed; enforce 10-item limit |
| Address | Shipping addresses per customer | When default address deleted, auto-promote next most recent as default |
| Review | Product ratings (1-5) + comments | isVerifiedPurchase set by server — customer must have a delivered order for this product |
| Payment | Payment record per order | Created AFTER transaction commits — external concern with its own failure modes |
| Layer | Technology | What It Prevents |
| --- | --- | --- |
| Layer 1 — Password | bcrypt (cost factor 12) | Brute-force: ~250ms per hash = catastrophic for attackers |
| Layer 2 — Token | JWT in HTTP-only cookie | XSS: JS cannot read httpOnly cookie. CSRF: sameSite: lax blocks cross-site POST |
| Layer 3 — Session | In-memory Map (jti key) | Stale JWT: immediately revoke any session without waiting for expiry |
| Interview Answer: "Why Map instead of a database for sessions?"
"A Map lookup is nanoseconds — a database query is milliseconds. Every single authenticated request checks the session store. At scale, that's thousands of checks per second. The in-memory Map handles this at near-zero cost. The tradeoff: sessions are lost on server restart. In production, we'd use Redis — an external in-memory store that survives restarts." |
| --- |
| Flag | Value | Why This Value |
| --- | --- | --- |
| httpOnly | true | JavaScript cannot read this cookie — blocks XSS token theft completely |
| sameSite | 'lax' | Blocks CSRF on cross-site POST/DELETE. Allows cookie on top-level GET navigations (clicking links from Google) |
| secure | true in production | Cookie only sent over HTTPS — prevents interception on unsecured networks |
| maxAge | 7 days | Browser auto-expires the cookie — no manual cleanup needed |
| Why lax not strict for sameSite?
"With strict, if a customer clicks a product link shared via WhatsApp or email, they appear logged out — the browser withholds the cookie from external navigations. For an e-commerce store, maintaining login state during external navigation is critical for conversion rates. lax blocks cross-site AJAX (CSRF attacks) while allowing seamless top-level navigation." |
| --- |
| Step | What Happens | Why |
| --- | --- | --- |
| 1. Rate limit | authLimiter: max 20 req / 15 min per IP | Prevents registration spam and bot attacks |
| 2. Validate | express-validator checks email format, password strength | Collects ALL errors at once — better UX than fail-fast |
| 3. Normalise | email.toLowerCase().trim() | USER@EMAIL.COM and user@email.com = same account |
| 4. Duplicate check | findOne({ where: { email } }) | Returns 409 Conflict (not 400 — request is valid, state conflicts) |
| 5. Hash password | bcrypt.hash(password, 12) | ~250ms — fast for humans, catastrophic for brute force |
| 6. Create Cart | Cascade creates Cart entity | Every customer has a cart from day one |
| 7. Strip hash | const { passwordHash: _, ...safeUser } = saved | Defence in depth — hash never leaves the server in any response |
| Step | What Happens | Security Reason |
| --- | --- | --- |
| 1. Find user | findOne({ where: { email } }) | Look up by normalised email |
| 2. Timing attack mitigation | If not found → still run bcrypt.compare() on dummy hash | Without this: unknown email = 1ms response, wrong password = 250ms. Attacker can enumerate registered emails by measuring response time |
| 3. Check isLocked | Return 403 before password check | Consistent response time whether locked or not |
| 4. Password compare | bcrypt.compare(submitted, hash) | Extracts embedded salt, rehashes, compares — original never stored |
| 5. Generate jti | uuid.v4() | Unique per-session identifier — enables per-device logout |
| 6. Sign JWT | jwt.sign({ id, role, jti }, JWT_SECRET, { expiresIn: 7d }) | Payload is readable (base64) but signature is tamper-proof |
| 7. Register session | sessionStore.create(jti, { userId, ip, userAgent }) | JWT alone is irrevocable — Map enables immediate invalidation |
| 8. Set cookie | res.cookie("token", jwt, { httpOnly, sameSite: lax }) | Browser stores it; never visible to JavaScript |
| Interview: "What if the JWT is still valid when account is locked?"
"Without the session store, a locked customer could continue making API calls for up to 7 days — until their JWT expires. The two-layer system makes both locks work together: isLocked in the DB prevents re-login; deleting the jti from the Map invalidates the current session immediately. Neither layer alone is sufficient." |
| --- |
| Endpoint | What It Does | Security Design |
| --- | --- | --- |
| POST /forgot-password | Generates 6-digit code, stores in DB with 10-min expiry | Always returns 200 with SAME message whether email found or not — prevents user enumeration |
| POST /get-reset-code | Returns the stored code (mock email delivery) | Rate limited 3 req/15 min — makes brute force of 10-min code infeasible |
| POST /reset-password | Validates code, marks used, hashes new password, invalidates all sessions | Code marked used BEFORE password changed — prevents replay attacks |
| Why separate get-reset-code endpoint?
"The original design returned the code in the forgotPassword response — a complete authentication bypass. Any attacker who knows a valid email can call the endpoint and get the code in the response body, then take over the account in two calls. The fix: forgotPassword stores the code but reveals nothing. A separate rate-limited endpoint (3 attempts / 15 min) retrieves the code — brute forcing a 6-digit code in 10 minutes at 3 attempts per 15 min is mathematically impossible." |
| --- |
| Decision | Implementation | Why |
| --- | --- | --- |
| Store only filename in DB | imagePath: "keyboard-1703456.jpg" | If domain changes from localhost:3000 to shop.com, only env var changes — no DB migration needed |
| Unique timestamp filename | Date.now() + random + extension | Prevents collision (two uploads of photo.jpg) and path traversal attacks (../../../index.js) |
| MIME type filter | Check file.mimetype against allowlist | File extensions are spoofable — malware.exe renamed to product.jpg would pass extension check |
| 5MB size limit | limits: { fileSize: 5MB } | Prevents disk exhaustion from large uploads |
| fs.unlinkSync on delete | Delete file BEFORE removing DB row | Prevents orphaned files accumulating on disk indefinitely |
| Interview: "Why soft delete instead of hard delete?"
"Hard deleting a product that appears in OrderItem rows fails immediately due to RESTRICT foreign key. We could CASCADE, but that destroys every order containing that product — a financial record corruption. Soft delete solves both: the row stays in the database so all OrderItem references remain valid and order history is complete, but deletedAt being non-null causes TypeORM to exclude it from all customer-facing queries automatically." |
| --- |
| Filter | SQL Generated | Implementation Note |
| --- | --- | --- |
| Full-text search | LOWER(name) LIKE :q OR LOWER(description) LIKE :q | Searches BOTH name and description. LOWER() on both sides = case insensitive on any database |
| Taxonomy (type) | WHERE type.id = :typeId | Hierarchy: SubCategory > Category > Type. Most specific wins |
| Taxonomy (category) | WHERE category.id = :catId | Applied only if no subCategoryId provided |
| Taxonomy (subCategory) | WHERE subCategory.id = :subId | Most specific — overrides category and type filters |
| Price range | WHERE price >= :min AND price <= :max | Applied conditionally — only if min/max provided |
| In stock | WHERE stock > 0 | Applied only if inStock query param = true |
| Pagination | LIMIT :take OFFSET :skip | take = Math.min(pageSize, 50). Server caps at 50 — prevents DoS |
| .where() — OVERWRITES previous condition | .andWhere() — APPENDS with AND |
| --- | --- |
| qb.where("price >= :min")  ← sets condition | qb.where("price >= :min")  ← sets condition |
| qb.where("stock > 0")  ← REPLACES price filter! | qb.andWhere("stock > 0")  ← adds to price filter |
| SQL: WHERE stock > 0  (price filter is GONE) | SQL: WHERE price >= 500 AND stock > 0  (correct) |
| Interview: "Why a separate endpoint for autocomplete?"
"Autocomplete is called on every keystroke — a user typing keyboard sends 8 requests. Using the full search endpoint would load all relations (subCategory, category, type), run join queries, and apply pagination logic on each keystroke. The autocomplete endpoint runs a single SELECT with only two columns and LIMIT 8 — it executes in microseconds. Different use cases deserve different, purpose-built queries." |
| --- |
| Cart (Database — Persistent) | Session (Memory Map — Ephemeral) |
| --- | --- |
| Storage: Disk (SQLite file) | Storage: RAM (Node.js process heap) |
| Survives: server restarts, crashes | Lost: on any server restart |
| Speed: fast (disk) | Speed: extremely fast (nanoseconds) |
| Analogy: A notebook written in ink | Analogy: A whiteboard erased at night |
| Step | Operation | What Fails Without It |
| --- | --- | --- |
| 0 (pre-tx) | Validate payment method, load cart, check stock | Cheap validation before acquiring DB lock — keeps transaction body minimal |
| 1 (in tx) | Create Order record | No parent for OrderItems |
| 2 (in tx) | Create OrderItems with priceAtPurchase snapshot | No record of what was purchased at what price |
| 3 (in tx) | manager.decrement(Product, id, "stock", qty) | Stock count becomes inaccurate |
| 4 (in tx) | Delete CartItems | Cart still has items — double-order risk |
| Post-tx | paymentService.createPaymentRecord() | Payment is external concern — done after commit to keep transaction short |
| Load-subtract-save (WRONG — race condition) | manager.decrement() (CORRECT — atomic) |
| --- | --- |
| Thread A: read(stock=10) | Thread A: UPDATE stock = stock - 2  → stock = 8 |
| Thread B: read(stock=10)  ← same value! | Thread B: UPDATE stock = stock - 2  → stock = 6 |
| Thread A: write(stock=8) | Database serialises — both decrements applied correctly |
| Thread B: write(stock=8) ← 4 units sold, only 2 decremented! | No window for race condition — subtraction is atomic at SQL level |
| .map() — used for OrderItem creation | for...of — used for stock decrement |
| --- | --- |
| Purpose: transform cartItems array into orderItems array | Purpose: await each decrement sequentially |
| Synchronous entity creation — no await needed | Each decrement is async — must await each one |
| Readable: "turn every A into a B" | Using .map() with async creates parallel promises — harder to control |
| Perfect: one-line declarative transformation | Perfect: sequential, predictable, each step waits for previous |
| Method | Endpoint | Service Action |
| --- | --- | --- |
| GET | /api/admin/dashboard | Promise.all([customerCount, orderCount, lockedCount, activeSessions]) |
| GET | /api/admin/customers | All customers + activeSessions count from sessionStore |
| PATCH | /api/admin/customers/:id/lock | isLocked = true in DB + deleteAllForUser() in Map |
| PATCH | /api/admin/customers/:id/unlock | isLocked = false in DB only (user already logged out) |
| GET | /api/admin/orders | All orders with customer info |
| GET | /api/admin/orders/:id | Full order detail with items |
| PATCH | /api/admin/orders/:id/status | Update order status with business rule validation |
| GET/POST/PUT/DELETE | /api/admin/products | Delegates to productService — no logic duplication |
| GET | /api/admin/products/deleted | Products with withDeleted: true |
| PATCH | /api/admin/products/:id/restore | Calls productRepo.recover(product) |
| Sequential (WRONG — slow) | Promise.all (CORRECT — parallel) |
| --- | --- |
| const c = await userRepo.count(...)  ← 10ms | const [c, o, l] = await Promise.all([ |
| const o = await orderRepo.count()  ← +10ms | userRepo.count({ where: { role: "customer" } }), |
| const l = await userRepo.count({ isLocked })  ← +10ms | orderRepo.count(), |
| Total: 30ms (sum of all) | userRepo.count({ where: { isLocked: true } }) |
|  | ])  ← Total: 10ms (slowest single query) |
| Subject Type | Stores? | New Subscribers Get | Best For |
| --- | --- | --- | --- |
| Subject | No | Only future values | Events (button clicks, one-time actions) |
| BehaviorSubject | Yes (last 1) | Current value immediately | State (currentUser, cartItems, addresses) |
| ReplaySubject | Yes (many) | Last X values (buffer) | Command history, event logs |
| AsyncSubject | Yes (last 1) | Only after complete() called | Final result of long calculation |
| Both sides must be configured
Backend: cors({ credentials: true }) — "I allow credentials from this origin"
Frontend: withCredentials: true — "Please send credentials with this request"
Without BOTH, the cookie is silently omitted on every request. |
| --- |
| Guard | Protects | Logic |
| --- | --- | --- |
| AuthGuard | All authenticated routes (/cart, /checkout, /orders, /profile) | Reads authService.currentUser$ with take(1). Returns false → redirect to /login |
| AdminGuard | All /admin/* routes | Checks currentUser?.role === "admin". Returns false → redirect to / |
| Interview: "Why NgModule over standalone components for admin?"
"The requirement document states: The Admin panel must be implemented as a separate lazy-loaded Angular module. The word module maps directly to @NgModule. NgModules also provide more interview depth — there is more to explain about declarations, providers, forChild routing, and lazy loading than standalone components." |
| --- |
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/auth/register | None | Register new customer |
| POST | /api/auth/login | None | Login — sets httpOnly cookie |
| POST | /api/auth/logout | Auth | Logout current session |
| POST | /api/auth/logout/:sessionId | Auth | Logout specific device by jti |
| POST | /api/auth/logout-all | Auth | Logout all devices |
| POST | /api/auth/forgot-password | None | Generate reset code (no code in response) |
| POST | /api/auth/get-reset-code | None (rate limited) | Retrieve the stored code (mock email) |
| POST | /api/auth/reset-password | None | Use code to set new password |
| GET | /api/profile | Auth | Get profile + active sessions list |
| PUT | /api/profile | Auth | Update name/email |
| PUT | /api/profile/change-password | Auth | Change password (invalidates all other sessions) |
| GET | /api/taxonomy/tree | None | Full taxonomy tree (ProductType → Category → SubCategory) |
| POST/PUT/DELETE | /api/taxonomy/types/* | Admin | CRUD for ProductTypes |
| POST/PUT/DELETE | /api/taxonomy/categories/* | Admin | CRUD for Categories |
| POST/PUT/DELETE | /api/taxonomy/subcategories/* | Admin | CRUD for SubCategories |
| GET | /api/products | None | All products (list view) |
| GET | /api/products/:id | Optional Auth | Product detail (tracks RecentlyViewed if logged in) |
| GET | /api/products/recently-viewed | Customer | Last 10 products viewed |
| GET | /api/search | None | Full search + filter + sort + pagination |
| GET | /api/search/autocomplete?q= | None (rate limited) | Fast name suggestions |
| GET | /api/cart | Customer | Get cart with items + totals |
| POST | /api/cart/items | Customer | Add item (idempotent — increments if exists) |
| PUT | /api/cart/items/:id | Customer | Update quantity (IDOR protected) |
| DELETE | /api/cart/items/:id | Customer | Remove item (IDOR protected) |
| DELETE | /api/cart | Customer | Clear entire cart |
| POST | /api/orders/checkout | Customer | Checkout (atomic transaction — 5 operations) |
| GET | /api/orders/my | Customer | My order history |
| GET | /api/orders/:id | Customer/Admin | Order detail (IDOR: customer sees own only) |
| GET | /api/addresses | Customer | All addresses (default first) |
| POST | /api/addresses | Customer | Create address |
| PUT | /api/addresses/:id | Customer | Update address (IDOR protected) |
| DELETE | /api/addresses/:id | Customer | Delete address (auto-promotes new default) |
| PATCH | /api/addresses/:id/set-default | Customer | Set as default address |
| GET | /api/products/:id/reviews | None | Get reviews + rating distribution summary |
| POST | /api/products/:id/reviews | Customer | Write review (isVerifiedPurchase auto-detected) |
| PUT | /api/products/:id/reviews/:rid | Customer | Edit own review |
| DELETE | /api/products/:id/reviews/:rid | Customer/Admin | Delete review |
| GET | /api/payments/order/:orderId | Customer/Admin | Payment record for order |
| GET | /api/payments/my | Customer | All my payments |
| PATCH | /api/payments/order/:orderId/status | Admin | Update payment status |
| GET | /api/admin/dashboard | Admin | Stats: customers, orders, locked, active sessions |
| GET | /api/admin/customers | Admin | All customers + activeSessions count |
| PATCH | /api/admin/customers/:id/lock | Admin | Lock account + kill all sessions immediately |
| PATCH | /api/admin/customers/:id/unlock | Admin | Unlock account |
| GET | /api/admin/orders | Admin | All orders with customer info |
| GET | /api/admin/orders/:id | Admin | Full order detail |
| PATCH | /api/admin/orders/:id/status | Admin | Update order status |
| GET/POST/PUT/DELETE | /api/admin/products | Admin | Product CRUD (delegates to productService) |
| GET | /api/admin/products/deleted | Admin | Soft-deleted products |
| PATCH | /api/admin/products/:id/restore | Admin | Restore soft-deleted product |
| GET | /api/health | None | Server health check (status, uptime, timestamp) |
| Optimisation | Implementation | Impact |
| --- | --- | --- |
| asyncHandler | Wraps all controllers: fn(req,res,next).catch(next) | Eliminates 40+ try/catch blocks. All errors reach globalErrorHandler. |
| compression | app.use(compression({ threshold: 1024 })) | JSON responses compressed with gzip — up to 70% smaller |
| helmet | app.use(helmet({ crossOriginResourcePolicy: "cross-origin" })) | Sets 15 security headers (X-Frame-Options, CSP, etc.) automatically |
| requestLogger | res.on("finish") — logs method, URL, status, duration, IP | Color-coded output. Production: only critical errors. Dev: all requests. |
| validateEnv | process.exit(1) if JWT_SECRET missing or < 32 chars on startup | Server never starts in broken state — fail-fast before accepting requests |
| DB Indexes | idx on products.name, products.price, orders.userId, carts.userId | Full-table scans → O(log n) index lookups on heavily queried columns |
| Taxonomy Cache | SimpleCache TTL 5 min — taxonomy never changes per session | Eliminates repeated DB queries for every search and admin form load |
| trackBy in ngFor | trackByProductId, trackByOrderId in all Angular lists | Angular reuses DOM elements instead of destroying and recreating all |
| OnPush detection | ChangeDetectionStrategy.OnPush on dumb components | Angular skips change detection unless @Input() reference changes |
| Debounce search | Subject + debounceTime(350) + distinctUntilChanged() | Prevents API call on every keystroke — waits 350ms after user stops typing |
| select optimization | Only load columns needed for list view (not description) | Reduces query payload — description not needed until product detail page |
| Promise.all | Dashboard stats, parallel cart validations | Parallel DB queries — total time = slowest query, not sum of all |
| Graceful shutdown | SIGTERM/SIGINT → server.close() → AppDataSource.destroy() | No in-flight requests dropped. DB connection cleanly closed. |
| Answer
app.ts builds and configures the Express application — middleware, static files, routes — and exports it. server.ts imports that app, initialises the database connection, and only once the database confirms it's ready, calls app.listen(). This separation means you can import app in a test file without starting a real server or opening a real database connection. If the DB fails, process.exit(1) prevents the server from ever accepting requests in a broken state. |
| --- |
| Answer
TypeORM decorators like @Column() use the Reflect API to attach type metadata to class properties at definition time. reflect-metadata is a polyfill that patches the global Reflect object. If any TypeORM entity is evaluated before the Reflect API exists, the metadata registration silently no-ops — you get no error, but entities have no columns and DB queries return empty results. The correct load sequence: reflect-metadata → dotenv → app imports → AppDataSource.initialize() → app.listen(). |
| --- |
| Answer
product.price reflects the current price which can be changed by an admin at any time. If we joined against it when displaying order history, a customer who paid ₹500 would see ₹750 after a price increase — which is incorrect, potentially a legal issue, and a terrible user experience. By copying the price at the moment of order creation as a plain decimal column, we make order history immutable to future pricing changes. This is deliberate denormalisation — a justified exception to 3NF normalisation rules. |
| --- |
| Answer
If we used CASCADE, deleting a product from the admin panel would silently delete all OrderItem rows referencing it — destroying historical order data. A customer's past order would become incomplete or disappear entirely. RESTRICT forces the admin to face a database error if they try to delete a product with order history, which surfaces the problem rather than silently corrupting data. The correct solution is soft delete — mark the product as deleted without removing the row. |
| --- |
| Answer
All active sessions are lost — every logged-in user is silently logged out on their next request. For a course project this is acceptable. In production, the session store would be backed by Redis — an external in-memory data store that survives restarts and can be shared across multiple server instances. The interface we built (create, get, delete, deleteAllForUser) is intentionally simple enough that swapping the Map for a Redis client only changes the implementation inside sessionStore.ts — no middleware or route code changes. |
| --- |
| Answer
Timing attack mitigation. If we return 401 immediately when the user doesn't exist (~1ms), but take 250ms when the password is wrong (bcrypt runs), an attacker can measure response times to determine which emails are registered in our system — a user enumeration attack. Running bcrypt on a dummy hash regardless ensures the endpoint always takes ~250ms, making timing attacks infeasible. |
| --- |
| Answer
cascade: true on a TypeORM relation automatically saves child entities when the parent is saved — it handles creating Order and OrderItems. But it cannot handle stock decrement or cart clearing — those are operations on entirely different entities. A transaction wraps ALL five steps including the unrelated ones, giving a true all-or-nothing guarantee across the entire checkout flow. Using cascade alone would give partial atomicity — OrderItems consistent with their Order, but stock and cart could still be in an incorrect state if an error occurred mid-flow. |
| --- |
| Answer
Using route.queryParams as the single source of truth means the URL always reflects the current filter state. If a user searches for "table" the URL becomes /products?q=table — they can bookmark it, share it, or paste it in a new tab and get the same results. If we called loadProducts() directly on filter change without updating the URL, the filter state would be invisible and lost on refresh. The browser back button also works correctly — navigating back restores the previous filter state automatically. |
| --- |
| Answer
Route guards run synchronously before Angular decides whether to load a lazy module. AdminGuard.canActivate() checks authService.isAdmin — a synchronous check against the in-memory BehaviorSubject value — and returns false before Angular even attempts to download the admin bundle. This means the lazy load network request never fires for non-admin users. The guard is the gate; lazy loading is the vault — the guard prevents reaching the vault entirely. |
| --- |
| Answer
The product detail route is /products/:id where :id is the product's database ID. This URL is deterministic and permanent — the same product always maps to the same URL. window.location.href returns the full current URL including the ID. When shared and opened on another device, Angular's router matches the URL to the ProductDetailComponent route, extracts the :id parameter, and fetches the same product from the backend. The Express catch-all route (*) sends index.html for any unknown URL, Angular boots up, reads the URL, and renders the correct product. The share button just copies the URL — the routing architecture is what makes the deep link work. |
| --- |
| Answer
SQLite is a single-file, single-writer database. It handles reads well but serialises all writes — under concurrent write load (simultaneous checkouts), requests queue behind each other. For production with multiple simultaneous users, I would switch to PostgreSQL or MySQL, which support true concurrent writes via row-level locking. The TypeORM DataSource config is the only file that changes — every entity, service, and query written against TypeORM's QueryBuilder works identically across all three databases. That portability is a direct benefit of using an ORM abstraction. |
| --- |
| Answer
Storing the full URL like http://localhost:3000/images/keyboard.jpg couples the database to the deployment environment. If the domain changes from localhost:3000 to shop.example.com, or from HTTP to HTTPS, every image URL in the database is wrong — requiring a full data migration. Storing only the filename — keyboard.jpg — means the URL is constructed at query time by the application layer, which knows the current base URL from environment variables. One environment variable change updates every image URL instantly with no database migration needed. |
| --- |
| Question | Answer | One-Line Reason |
| --- | --- | --- |
| Why bcrypt over SHA-256? | bcrypt is deliberately slow | SHA-256: billions/sec. bcrypt: 1 hash per 250ms — catastrophic for brute force |
| Why jti instead of full JWT as session key? | UUID short key, not full token | jti enables per-device logout; short key = less memory; independent of token rotation |
| Why sameSite: lax not strict? | Balance security + UX | strict breaks login when user clicks link from email/Google search |
| Why Map not Redis? | Course project scope | In production: Redis survives restarts, scales horizontally. Interface unchanged. |
| Why synchronize: false in production? | Migrations give control | synchronize: true can silently drop columns when you rename entity properties |
| Why three-layer architecture? | Testability + reusability | Service tested without HTTP. Routes swapped without touching business logic. |
| Why HttpOnly cookie not localStorage? | XSS protection | Malicious JS cannot read HttpOnly cookie. localStorage is readable by any script. |
| Why Math.min(pageSize, 50)? | DoS prevention | Client sends pageSize=100000 → server loads entire DB. Cap is invisible to legitimate users. |
| Why .andWhere not .where in QueryBuilder? | .where() overwrites | Each .where() replaces the previous condition. andWhere() appends with AND. |
| Why priceAtPurchase on OrderItem? | Historical accuracy | Product.price changes. Order history must show what customer actually paid. |
| Why RESTRICT on Product → OrderItem? | Data integrity | CASCADE would silently delete order history when product is removed. |
| Why soft delete not hard delete? | RESTRICT FK + history | Hard delete fails if product in orders. Soft delete preserves history, hides from customers. |
| Why father-level canActivate for AdminGuard? | DRY + safety | One declaration protects entire tree. Child guard = one missed route = security hole. |
| Why lazy load AdminModule? | Performance + security perception | Customers never download admin code. Saves bandwidth. Admin code not in customer's browser. |
| Why BehaviorSubject for currentUser? | Late subscriber gets current value | If navbar subscribes after login, BehaviorSubject immediately emits the user. Subject would not. |
| Why manager.decrement() not load-subtract-save? | Atomic SQL avoids race condition | UPDATE stock = stock - 2 is atomic in DB. Load-subtract-save has race window between two threads. |
| Why validate before starting transaction? | Keep lock window minimal | Opening transaction acquires DB lock. Validate everything possible before — shorter lock = better throughput. |
| Why paymentService called after tx commit? | External concern | Payment processing can fail independently. Should not rollback the order if payment record fails. |