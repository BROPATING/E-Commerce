<!-- converted from ecommerce_interview_guide.docx -->

E-Commerce
Full-Stack Application
End-to-End Interview Preparation Guide
Node.js  •  Express  •  TypeORM  •  SQLite  •  Angular 17

60+ Questions  •  Model Answers  •  Code Examples  •  Quick-Reference Tables

# Section 1 — Architecture & Tech Stack
## 1.1  System Architecture
The application follows a monorepo full-stack structure: one Node.js process on port 3000 serves both the Angular frontend (compiled static files) and the Express REST API. In development, Angular runs on port 4200 with a proxy to the backend.

Q1  Walk me through the overall architecture of your e-commerce application.
Model Answer
The backend is a Node.js/Express server using TypeORM as the ORM and better-sqlite3 as the database. It follows a strict three-layer pattern — Routes handle HTTP concerns and apply middleware, Controllers extract request data and call services, Services contain all business logic and database queries. The frontend is Angular 17 using NgModule-based architecture with lazy-loaded feature modules. In production, ng build compiles Angular into static files that Express serves alongside the API, eliminating CORS entirely since both are on the same origin.
Interview Tip  Draw the three layers on a whiteboard. Interviewers love seeing Routes → Controllers → Services.

Q2  Why did you choose a three-layer architecture? Why not put logic directly in routes?
Model Answer
Three reasons: testability, reusability, and maintainability. If I want to add a mobile API later, I write new Routes without touching the Service layer. If I want to unit-test login logic, I call the Service directly without spinning up an HTTP server. The Controller is the only layer that knows about both HTTP and business logic — it acts as the translator. Putting database queries directly in routes couples HTTP handling to data access, making it impossible to test either in isolation.

Q3  Why use TypeORM instead of raw SQL or Prisma?
Model Answer
TypeORM was chosen because it uses decorators that map directly to TypeScript classes — the entity definitions serve as both the TypeScript type and the database schema. This eliminates a separate schema definition file. TypeORM also provides a QueryBuilder for complex queries with full type safety, while still allowing raw SQL when needed. Compared to Prisma, TypeORM is decorator-based which integrates naturally with the existing TypeScript class structure and requires less code generation.


## 1.2  Tech Stack — Key Package Decisions

Q4  Why did you use bcrypt with a cost factor of 12? Why not MD5 or SHA-256?
Model Answer
MD5 and SHA-256 are fast hashing algorithms — modern GPUs can compute billions of them per second, making brute-force dictionary attacks trivial. bcrypt is an adaptive algorithm deliberately designed to be slow. Cost factor 12 means 2^12 = 4096 internal iterations, taking ~250ms on a server. For a legitimate user logging in once, 250ms is imperceptible. For an attacker running a dictionary attack against a stolen database, 250ms per attempt means 4 attempts per second — a 10-million-entry dictionary would take 29 days on a single machine. The cost factor can be increased as hardware gets faster, maintaining the same time cost.
Interview Tip  Mention that bcrypt also automatically generates and embeds a unique salt per hash, eliminating rainbow table attacks.


# Section 2 — Database Design
## 2.1  Schema & Entity Design
The application has 10 core entities with carefully designed relationships. The most critical design decision is the price snapshot on OrderItem.

Q5  Explain your database schema. How did you decide which entities to create?
Model Answer
The schema follows the domain model: Users have Carts (one-to-one) and Orders (one-to-many). Products are organised in a four-level taxonomy — ProductType → Category → SubCategory → Product — because the requirement specified category filtering. Orders have OrderItems which store a price snapshot. There are also supporting entities: PasswordResetCode for the forgot-password flow, and future entities like Review, Address, and Payment which were designed but kept separate to avoid coupling unrelated concerns.

Q6  Why does OrderItem have a priceAtPurchase column instead of just referencing Product.price?
Model Answer
This is the most important design decision in the system. Product.price reflects the current market price — it can be changed by an admin at any time. If order history simply joined against Product.price, a customer who paid Rs.500 would see Rs.750 in their order history after a price increase. This is both incorrect and potentially a legal issue. By copying the price as a plain decimal at the moment of checkout, we make order history immutable to future pricing changes. This is deliberate denormalisation — a justified exception to 3NF normalisation rules. Think of it like a movie ticket stub: it shows Rs.200 even if today's ticket costs Rs.500.
Interview Tip  Say: "deliberate denormalisation" and "justified violation of 3NF" — these phrases show database design maturity.

Q7  Why use RESTRICT on the OrderItem → Product foreign key instead of CASCADE?
Model Answer
CASCADE would silently delete every OrderItem row when a Product is deleted — destroying historical order data. A customer's past purchase would disappear or show incomplete totals, which is a financial record corruption. RESTRICT forces the database to refuse the deletion, surfacing the problem explicitly. The correct solution is soft delete: mark the product as deleted without removing the row. The TypeORM @DeleteDateColumn decorator sets deletedAt to now when softRemove() is called, excluding the product from all customer-facing queries while preserving all OrderItem references intact.

Q8  Explain your taxonomy hierarchy and why you chose a four-level tree instead of tags.
Model Answer
The taxonomy is ProductType → Category → SubCategory → Product. A four-level tree was chosen because the requirements specified hierarchical category browsing — users should be able to filter by "Electronics" broadly, then narrow to "Mobile Phones", then to "Smartphones". Tags are many-to-many and work well for cross-cutting concerns, but the requirement was hierarchical navigation with parent-child drilling. The tree structure also enables efficient queries — filtering by type loads only that subtree, and the taxonomy is cached in memory since it changes rarely.


## 2.2  Foreign Keys & Data Integrity

Q9  What is soft delete and why did you use it for products?
Model Answer
Soft delete uses a @DeleteDateColumn() on the Product entity. When softRemove() is called, TypeORM sets deletedAt = now() instead of issuing a DELETE statement. TypeORM automatically adds WHERE deletedAt IS NULL to all find() queries, effectively hiding soft-deleted products from customers without removing the database row. This solves two problems simultaneously: the RESTRICT foreign key no longer blocks deletion (the row stays), and order history remains complete because OrderItem references still resolve to valid Product rows. Admins can view deleted products with withDeleted: true and restore them with recover().


# Section 3 — Authentication & Security
## 3.1  The Three-Layer Security Model
Authentication uses three complementary layers. No single layer is sufficient alone — each one covers a different attack vector.

Q10  Walk me through the complete login flow from form submission to authenticated request.
Model Answer
Step 1: Rate limiter checks IP — max 10 requests per 15 minutes to prevent brute force. Step 2: Find user by normalised email. Step 3: Even if user not found, run bcrypt.compare() on a dummy hash to prevent timing attacks — response time is consistent regardless of whether the email exists. Step 4: Check isLocked — return 403 immediately if locked. Step 5: bcrypt.compare() validates password. Step 6: Generate UUID (jti) for this session. Step 7: Sign JWT containing user ID, role, and jti with 7-day expiry. Step 8: Register session in in-memory Map with IP and userAgent. Step 9: Set JWT as httpOnly cookie. Step 10: Return safe user object — passwordHash never leaves the server.
Interview Tip  Practice drawing this flow on a whiteboard. Interviewers often ask you to trace the entire auth lifecycle.

Q11  What is a timing attack and how did you mitigate it in your login endpoint?
Model Answer
A timing attack exploits measurable differences in server response time. If the login endpoint returns immediately (1ms) when an email is not found but takes 250ms when the password is wrong (bcrypt runs), an attacker can enumerate which emails are registered by measuring response times. The mitigation: always run bcrypt.compare() regardless of whether the user exists, using a pre-computed dummy hash. This ensures the endpoint consistently takes ~250ms for both "email not found" and "wrong password" responses, making timing enumeration impossible.

Q12  Why store the JWT in an httpOnly cookie instead of localStorage?
Model Answer
localStorage is accessible to any JavaScript running on the page — including injected malicious scripts from XSS vulnerabilities. If an attacker successfully injects script (e.g., via a stored XSS in a product name), they can read the JWT from localStorage and exfiltrate it, gaining permanent account access. An httpOnly cookie is invisible to JavaScript by browser design — document.cookie does not include httpOnly cookies. The attacker cannot steal what they cannot read. The cookie is automatically sent with every request to the same origin, so no application code change is needed.

Q13  What is CSRF and how does sameSite: lax protect against it?
Model Answer
CSRF (Cross-Site Request Forgery) tricks an authenticated user's browser into making a request to your API from a malicious third-party site. Since the browser automatically attaches cookies to same-origin requests, the server receives the auth cookie and processes the forged request. sameSite: lax tells the browser to only send the cookie on same-site requests AND top-level cross-site GET navigations. Cross-site POST/PUT/DELETE requests (the dangerous ones) never include the cookie — CSRF is blocked. lax was chosen over strict because strict blocks the cookie even when the user clicks a legitimate product link shared via WhatsApp or email, causing them to appear logged out.

Q14  What is a jti and why use it instead of the full JWT as the session key?
Model Answer
jti stands for JWT ID — a UUID embedded in the JWT payload that uniquely identifies this specific login session. Using the full JWT string as the Map key would waste memory (hundreds of characters per session) and couple the key to the token format. A UUID is 36 characters regardless. More importantly, the jti enables per-device logout: DELETE /auth/logout/:jti removes exactly one session without invalidating the user's other devices. The Map stores jti → SessionInfo (IP, userAgent, userId, createdAt), enabling both instant revocation and active session management from the profile page.

Q15  What happens when an admin locks a customer account? Does the customer get logged out immediately?
Model Answer
Two things happen simultaneously. First, user.isLocked = true is persisted to the database — this survives server restarts and prevents any future login attempts. Second, sessionStore.deleteAllForUser(userId) removes every jti for that user from the in-memory Map — this affects all devices simultaneously and takes effect on their very next authenticated request. Without the Map deletion, the customer could continue making API calls for up to 7 days — until their JWT naturally expires. The two-layer system makes both locks work together: isLocked prevents re-login; deleting the jti invalidates the current session immediately.
Interview Tip  This is a favourite follow-up question. Make sure you can explain both the persistent DB lock AND the immediate session kill.

Q16  Explain the forgot-password flow. Why is it designed as three separate endpoints?
Model Answer
Three endpoints: POST /forgot-password generates a 6-digit code with 10-minute expiry and stores it in the database, always returning 200 with the same message regardless of whether the email exists — preventing user enumeration. POST /get-reset-code retrieves the stored code (simulating email delivery) and is rate-limited to 3 requests per 15 minutes — making brute force of a 6-digit code in 10 minutes mathematically impossible. POST /reset-password validates the code, marks it as used before changing the password (preventing replay attacks), hashes the new password, and invalidates all active sessions. The original design returned the code in the forgot-password response — a complete authentication bypass that was corrected.


# Section 4 — Products, Search & Filtering
## 4.1  Search Architecture
Q17  How does your product search work? Explain the SQL it generates.
Model Answer
The search uses TypeORM's QueryBuilder with conditional andWhere() clauses. For text search: LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q — LOWER() on both sides makes it case-insensitive on any database engine. For taxonomy filtering, the query joins through the full chain: product → subCategory → category → type. typeId filtering: WHERE type.id = :typeId. categoryId filtering: WHERE category.id = :categoryId. subCategoryId filtering: WHERE subCategory.id = :subCategoryId. Price range: WHERE price >= :min AND price <= :max. Each condition is only added if the parameter was provided, so unused filters don't appear in the SQL.

Q18  What is the difference between .where() and .andWhere() in TypeORM QueryBuilder?
Model Answer
.where() sets the entire WHERE clause, overwriting any previously set condition. If you call qb.where("price >= :min") and then qb.where("stock > 0"), the price filter is completely gone — SQL becomes WHERE stock > 0 only. .andWhere() appends to the existing condition with AND — so the same two calls produce WHERE price >= 500 AND stock > 0. This is the most common TypeORM mistake. The fix is to always start with an initial .where("1=1") or conditionally use .where() for the first filter and .andWhere() for all subsequent ones.

Q19  Why did you create a separate autocomplete endpoint instead of reusing the main search?
Model Answer
Autocomplete fires on every keystroke — a user typing "keyboard" sends 8 requests. The main search endpoint joins four tables (product, subCategory, category, type), applies pagination, and returns full product objects with all fields. Running this on every keystroke is extremely expensive. The autocomplete endpoint runs a single SELECT with only product.id and product.name, no joins, LIMIT 8, no pagination logic — it executes in microseconds. It also has a separate rate limiter: 60 requests per minute (vs 100/15min for main search). Different use cases deserve purpose-built queries.

Q20  Why does your pagination have a server-side cap of 50 results?
Model Answer
Without a server-side cap, a client can send ?pageSize=100000 and the server loads the entire products table into memory in a single query. This is a denial-of-service attack vector requiring zero authentication. Math.min(pageSize, 50) is a single line that prevents this completely. The cap is invisible to legitimate users who never request more than 50 results per page. It blocks all abuse. Similarly, page numbers are validated: if page * limit exceeds total records, the query returns an empty array rather than erroring.

Q21  How does image URL construction work? Why store only the filename in the database?
Model Answer
The database stores only the filename — e.g., "keyboard-1703456789-492.jpg". The full URL is constructed at query time: imageBaseUrl + "/" + imagePath. imageBaseUrl comes from an environment variable. Storing the full URL like "http://localhost:3000/images/keyboard.jpg" couples the database to the deployment environment. If the domain changes from localhost:3000 to shop.example.com, every image URL in the database is wrong — requiring a full data migration. With only the filename stored, changing one environment variable instantly updates every image URL with no database changes. External URLs from the seed data are detected by checking startsWith("http") — those are returned as-is without prepending the base URL.


# Section 5 — Cart & Checkout
## 5.1  Cart System
Q22  How does the cart persist across login/logout? Where is it stored?
Model Answer
The cart is stored in the SQLite database, not in memory or localStorage. Each user gets a Cart entity (one-to-one) created at registration time — they always have a cart, even before adding their first item. CartItems are rows in the cart_items table linked by cartId. Since the database persists to disk, the cart survives server restarts, browser closes, and logout/login cycles. This contrasts with the session store which is in-memory (RAM) and lost on restart. The analogy: the cart is a notebook written in ink; the session store is a whiteboard erased at night.

Q23  What is the idempotent add-to-cart pattern?
Model Answer
When a customer clicks "Add to Cart" for a product already in their cart, the correct behaviour is to increment quantity, not create a duplicate CartItem. The implementation: first attempt findOne({ where: { cartId, productId } }). If found, increment quantity. If not found, create a new CartItem. This makes the add operation idempotent with respect to duplicates — calling it multiple times for the same product produces a single CartItem with increasing quantity, not multiple rows. This prevents subtle bugs where the same product appears twice in the cart with separate line totals.

Q24  What is an IDOR vulnerability and how did you prevent it in the cart?
Model Answer
IDOR stands for Insecure Direct Object Reference. If the endpoint DELETE /api/cart/items/42 simply deletes CartItem with id=42 without checking ownership, any authenticated user can delete any other user's cart items by guessing IDs. The fix: before any cart item modification, load the item with its full relation chain: cartItem.cart.user.id. If that userId does not match the authenticated user's ID, return 403 Forbidden. This check was applied to updateQuantity and removeItem. The same pattern is used for order detail access — customers can only view their own orders.


## 5.2  Checkout Transaction
Q25  Walk me through the checkout transaction. Why is it a transaction?
Model Answer
Checkout performs five operations that must ALL succeed or NONE commit: (1) Create the Order record, (2) Create OrderItems with priceAtPurchase snapshots, (3) Decrement product stock using manager.decrement(), (4) Delete CartItems, (5) Post-transaction: create payment record. If any step fails — say stock decrement fails due to a race condition — the database rolls back: the Order and OrderItems are never committed, stock stays unchanged, and the cart is intact. Without a transaction, a crash between steps 2 and 3 would create an order with no stock deducted, or worse, deducted stock with no order record.
Interview Tip  Draw the 5 steps with an arrow and mark the transaction boundary. Show what happens if step 3 fails without a transaction.

Q26  Why use manager.decrement() for stock reduction instead of loading the product and subtracting?
Model Answer
Load-subtract-save has a race condition. Thread A reads stock=10, Thread B reads stock=10 (same value, Thread A hasn't written yet), Thread A writes 8, Thread B writes 8 — four units were sold but stock only decreased by 2. manager.decrement(Product, { id }, "stock", quantity) generates UPDATE product SET stock = stock - 2 WHERE id = 42. This subtraction happens atomically inside the database engine which serialises concurrent updates. Both decrements are applied correctly: 10-2=8, then 8-2=6. The database handles the concurrency — no application-level locking required.

Q27  Why validate stock and payment method before starting the transaction?
Model Answer
Opening a database transaction acquires a lock. The longer the lock is held, the more other requests are blocked waiting. Validating payment method and checking stock before the transaction starts keeps the transaction body as short as possible — it only runs if we know the operation will succeed. Cheap, synchronous checks outside the transaction; expensive, lock-holding operations inside. This pattern maximises throughput under concurrent load.


# Section 6 — Angular Frontend Architecture
## 6.1  Module Architecture & Lazy Loading
Q28  Why did you use NgModule-based architecture instead of standalone components?
Model Answer
The requirement document explicitly states: "The Admin panel must be implemented as a separate lazy-loaded Angular module." The word module maps directly to @NgModule. NgModules also provide more architectural depth for discussion: declarations, providers, forChild routing, and lazy loading boundary are all NgModule-specific concepts. SharedModule avoids re-declaring commonly used components (ProductCard, Navbar) in every feature module. The admin module is lazy-loaded — customers never download admin code, saving bandwidth and keeping admin logic out of customer browsers completely.

Q29  How does lazy loading work for the admin module? When does the code download?
Model Answer
The app-routing.module.ts defines the admin route with loadChildren: () => import("./admin/admin.module").then(m => m.AdminModule). The dynamic import() is only called the first time someone navigates to /admin. For a customer who never visits /admin, the admin JavaScript bundle is never downloaded. After first download, the browser caches the chunk — navigating within admin doesn't re-download. More importantly, Angular's route guard (AdminGuard) runs before the lazy load — if canActivate() returns false, the import() never fires. The guard is the gate; the lazy module is the vault — you never reach the vault if the gate refuses you.

Q30  Explain how your route guards work. What is the difference between AuthGuard and AdminGuard?
Model Answer
Both guards implement CanActivate and return an Observable<boolean>. AuthGuard reads authService.currentUser$ with take(1) — a single emission. If the user is null (not logged in), it redirects to /login and returns false. It protects /cart, /checkout, /orders, and /profile. AdminGuard additionally checks currentUser.role === "admin" — it redirects to / if the role is wrong. The critical architectural decision is applying AdminGuard at the parent /admin route level, not on each child. canActivate: [AdminGuard] on the parent automatically protects all children. Adding a new child route cannot accidentally be unprotected — the parent guard always runs first.

Q31  How do you restore authentication state after a page refresh? Angular cannot read the httpOnly cookie.
Model Answer
AppComponent.ngOnInit() calls authService.checkSession() which makes GET /api/profile. The browser automatically sends the httpOnly cookie with this request — the application code cannot read it, but the browser attaches it transparently. If the cookie is valid, the server returns the user profile and the BehaviorSubject is updated with the current user. If the cookie has expired or was revoked (jti deleted from Map), the server returns 401, and the BehaviorSubject is set to null. No redirect is issued — the user may be on a public page and the null state is correct for unauthenticated visitors.


## 6.2  State Management & Reactive Patterns
Q32  Why use BehaviorSubject for currentUser instead of a plain property?
Model Answer
A plain property change notifies nobody — the Navbar, AdminGuard, AuthGuard, and CartService all need to react when the user logs in or out. BehaviorSubject is an Observable that holds the current value AND emits it to every new subscriber immediately. If the Navbar subscribes after login, it gets the current user instantly — a regular Subject would miss the emission. The pattern is: private currentUserSubject (BehaviorSubject, write access inside AuthService only) + public currentUser$ (.asObservable(), read-only outside). Only AuthService can change the user. All other components subscribe to the read-only Observable.

Q33  Explain how the HTTP Interceptor makes authentication work in development.
Model Answer
In development, Angular runs on port 4200 and Express on port 3000 — different origins. By default, the browser omits cookies from cross-origin requests. CredentialsInterceptor implements HttpInterceptor and intercepts every outgoing HttpClient request. It clones the request (HttpRequest is immutable) and adds withCredentials: true. This tells the browser to include cookies on cross-origin requests. Both sides must be configured: the backend has cors({ credentials: true, origin: "http://localhost:4200" }) — "I allow credentials from this origin", and the frontend interceptor adds withCredentials — "please send credentials with this request". Without both, the cookie is silently omitted.

Q34  How does the product list component handle URL-based filtering? Why use queryParams instead of form state?
Model Answer
The component subscribes to route.queryParams in ngOnInit. Every filter — search term, typeId, categoryId, price range, inStock — is read from the URL and patched into the reactive form. When the user applies filters, applyFilters() navigates to /products with the filter values as query parameters. This makes the URL the single source of truth. Benefits: the user can bookmark a filtered view (/products?search=laptop&minPrice=30000), share the link, or paste it in a new tab and get identical results. Browser back/forward navigation restores previous filter states automatically. Refreshing the page does not lose the current filter.


# Section 7 — Angular Deep Dive
## 7.1  Reactive Forms & Validation
Q35  Why use Reactive Forms over Template-Driven Forms?
Model Answer
Reactive forms define the entire form structure — controls, validators, cross-field validators — in TypeScript. This makes the form logic testable without rendering a template: call formGroup.setValue() and check formGroup.valid in a unit test. Validation logic lives in one place rather than scattered across HTML attributes. Reactive forms also enable cross-field validation — a group validator receives the entire FormGroup, making "password must match confirmPassword" trivial to implement. Template-driven forms use two-way binding which makes it harder to track form state programmatically.

Q36  Why call markAllAsTouched() before checking form validity on submit?
Model Answer
Angular validation error messages only show when a field is "touched" — meaning the user has interacted with it. On first submit with an empty form, no fields are touched, so no error messages appear even though the form is invalid. The button appears to do nothing. markAllAsTouched() programmatically marks every control as touched, causing all validation error messages to appear simultaneously. This makes the form's invalid state immediately visible to the user without requiring them to click every field individually.

Q37  How did you implement the cross-field password match validator?
Model Answer
A cross-field validator is applied to the FormGroup, not an individual control. It receives the entire FormGroup — reads both the password and confirmPassword control values — and returns null if they match or { passwordMismatch: true } if they differ. Applied at group level: this.fb.group({ password: [...], confirmPassword: [...] }, { validators: [passwordMatchValidator] }). The template checks form.hasError("passwordMismatch") rather than form.get("confirmPassword").hasError("mismatch"). The error is on the group because the condition involves two controls — placing it on one control would be semantically incorrect.


## 7.2  Performance Optimisations
Q38  What is trackBy in *ngFor and why is it important for your product list?
Model Answer
Without trackBy, Angular re-renders the entire list on every change detection cycle — destroying and recreating every DOM element even if only one product changed. trackBy: (index, product) => product.id tells Angular to identify list items by their database ID. If the same product ID appears in both old and new arrays, Angular reuses the existing DOM element and only updates changed properties. For a product grid of 12 items, this means 11 DOM elements are reused on a single product update instead of all 12 being destroyed and recreated. The visual effect is also smoother — no flickering from element recreation.

Q39  Explain the debounced search pattern. What problem does it solve?
Model Answer
Without debouncing, the search input fires an API call on every keystroke. Typing "laptop" sends 6 requests: "l", "la", "lap", "lapt", "lapto", "laptop". Only the last one is useful. Subject + debounceTime(350) waits until the user stops typing for 350ms before emitting. distinctUntilChanged() prevents re-querying if the value hasn't changed (e.g., user deletes and retypes the same character). Together, typing "laptop" normally sends 1 request — only after the user pauses. This reduces backend load by ~80% for typical search interactions.

Q40  What is OnPush change detection and where did you apply it?
Model Answer
Angular's default change detection runs on every browser event (click, timer, HTTP response) and checks every component in the tree. ChangeDetectionStrategy.OnPush tells Angular to only run change detection on a component when one of three conditions is met: an @Input() reference changes, an event originates inside the component, or an Observable with async pipe emits. Applied to "dumb" components like ProductCardComponent and NavbarComponent which receive data via @Input() and never mutate state independently. The parent (ProductListComponent) owns the data — when the products array is replaced, all cards update. When unrelated state changes elsewhere in the app, the card components are skipped entirely.


# Section 8 — Admin Panel
## 8.1  Admin API Design
Q41  How did you protect all admin routes without adding middleware to each one individually?
Model Answer
router.use(requireAuth, requireRole("admin")) is applied at the very top of admin.routes.ts, before any route is defined. Router-level middleware applies to all routes registered on that router. It is architecturally impossible to add an admin route to this file and forget to protect it — every route handler registered after the router.use() call is automatically protected. This is safer than the alternative of applying middleware to each route individually, where one missed annotation creates an unprotected endpoint.

Q42  Why use Promise.all for dashboard statistics instead of sequential awaits?
Model Answer
Dashboard requires four database counts: customer count, order count, locked account count, and active sessions. With sequential awaits, each query waits for the previous one to complete: 10ms + 10ms + 10ms + 10ms = 40ms total. These four queries are completely independent — there is no dependency between them. Promise.all([query1, query2, query3, query4]) fires all four simultaneously. Total time = the slowest single query (~10ms). The parallelism reduces dashboard load time to 25% of the sequential approach. This pattern applies anywhere multiple independent async operations are needed.

Q43  How does the admin product form handle edit mode? Specifically, why does the subCategory dropdown fail to pre-select in some implementations?
Model Answer
The subCategory dropdown fails when taxonomy loads after patchValue is called. The fix is forkJoin([taxonomy$, product$]) which fires both requests simultaneously and waits until BOTH complete before running any logic. Only then is taxonomy set (populating the select options) and patchValue called (pre-selecting the value). The second issue is type mismatch: HTML select option values are always strings, but product.subCategory.id from the API is a number. String("3") !== 3 in Angular's form binding. The fix: patchValue({ subCategoryId: String(product.subCategory.id) }) and [value]="sub.id.toString()" on each option element.


# Section 9 — Production Readiness
## 9.1  Security & Reliability
Q44  How did you handle errors globally in Express? What is asyncHandler?
Model Answer
Express has a built-in global error handler: app.use((err, req, res, next) => { res.status(500).json({ error: err.message }) }). But async route handlers don't automatically forward errors to it — an unhandled Promise rejection in an async controller crashes silently or hangs the request. asyncHandler is a higher-order function: (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next). Wrapping every controller with asyncHandler means any thrown error or rejected promise automatically calls next(err), forwarding it to the global error handler. Without it, every controller needs its own try/catch block — 40+ redundant catch blocks.

Q45  What does validateEnv() do and why is it called before app.listen()?
Model Answer
validateEnv() checks that critical environment variables exist and meet minimum security requirements before the server accepts a single request. JWT_SECRET must exist and be at least 32 characters — a shorter secret is brute-forceable. DATABASE_URL must be defined. If any check fails, process.exit(1) kills the server immediately. This is the "fail-fast" principle: it is better to refuse to start in a broken state than to start and serve requests with no authentication security. Without this check, forgetting to set JWT_SECRET in a production deployment would result in a server that accepts any JWT — a complete authentication bypass.

Q46  You chose SQLite for this project. How would the architecture change for production?
Model Answer
SQLite is a single-writer database — all writes are serialised, which bottlenecks under concurrent checkout load. For production with multiple simultaneous users, I would switch to PostgreSQL which supports true concurrent writes via row-level locking, connection pooling, and horizontal read replicas. The TypeORM DataSource config is the only file that changes — entity definitions, QueryBuilder queries, and all service logic are database-agnostic and work identically across SQLite, PostgreSQL, and MySQL. That portability is a direct benefit of the ORM abstraction. I would also move the in-memory session Map to Redis for persistence across server restarts and horizontal scaling.

Q47  What database indexes did you add and how do they improve performance?
Model Answer
Indexes were added on: products.name and products.price (for search and price range filtering), orders.userId (for "get my orders" — one of the most frequent queries), and carts.userId (for "get my cart" — called on every page load). Without indexes, these queries perform full table scans — O(n) where n is the number of rows. With a B-tree index, the database jumps directly to matching rows — O(log n). For a table with 10,000 orders, a userId lookup goes from scanning all 10,000 rows to checking ~13 nodes in the B-tree. At 100,000 orders, the improvement is even more dramatic.


# Section 10 — Scenario & Problem-Solving Questions
Q48  Two users checkout the same last item simultaneously. What happens?
Model Answer
Both checkout requests pass the pre-transaction stock check (both see stock=1). Both enter the transaction. The first to execute manager.decrement() issues UPDATE product SET stock = stock - 1 WHERE id = X, setting stock to 0. The second decrement sets stock to -1. This is the oversell problem. The fix: add a constraint check inside the transaction — after decrement, reload the product and verify stock >= 0. If negative, throw an error to rollback the transaction. A more robust fix is to add WHERE stock >= quantity to the decrement: UPDATE product SET stock = stock - 1 WHERE id = X AND stock >= 1. If 0 rows affected, the update failed — throw OversoldError and rollback.

Q49  A customer reports their order shows the wrong product name. How would you debug this?
Model Answer
First check: does OrderItem store productId only, or does it also store a product name snapshot? In this design, order items join to the Product table — if the product name was updated after the order, the displayed name changes. This is the same problem as the price snapshot, extended to the name. The fix is a productName snapshot column on OrderItem, populated at checkout time. For debugging, check the order's createdAt timestamp against the product's updatedAt timestamp — if product was updated after the order, the name mismatch is confirmed. Long term: snapshot immutable fields (name, price) at order time.

Q50  How would you add a product review system? Walk through the API design.
Model Answer
The Review entity: id, userId, productId, rating (1-5 integer), comment, isVerifiedPurchase (boolean set by server), createdAt. Endpoints: GET /api/products/:id/reviews returns reviews with rating distribution summary (count per star). POST /api/products/:id/reviews creates review — the server checks if the user has a delivered OrderItem for this product and sets isVerifiedPurchase accordingly. PUT /api/products/:id/reviews/:rid allows editing own review. DELETE allows the reviewer or admin to delete. One review per user per product — enforced by a unique constraint on (userId, productId). Average rating is computed fresh per request or cached with the product.

Q51  How would you implement a wishlist feature?
Model Answer
A Wishlist entity is essentially a Cart without quantities: userId (unique FK to User), with WishlistItems: id, wishlistId, productId. Created at registration alongside the Cart. Add to wishlist: POST /api/wishlist/items — idempotent, check if already exists first. Remove: DELETE /api/wishlist/items/:productId. The "Move to Cart" action calls both removeFromWishlist and addToCart atomically. The product card gets an isWishlisted flag from the API — the frontend sends GET /api/products with userId context to mark which products are wishlisted. On the product detail page, a heart button toggles wishlist state optimistically.

Q52  The server starts receiving 10x normal traffic. What would fail first and what would you do?
Model Answer
In order of failure: (1) SQLite's single-writer bottleneck causes write queue to back up — checkout requests timeout. (2) In-memory session Map grows with active sessions — Node.js heap pressure increases. (3) Image serving from disk becomes a bottleneck. Immediate mitigations: rate limiting at the load balancer level, caching the taxonomy tree more aggressively, and moving images to a CDN (S3 + CloudFront). Medium-term: migrate to PostgreSQL for concurrent writes and Redis for sessions. Long-term: horizontal scaling with multiple Node.js instances behind a load balancer — only possible once the session store and DB are external.


# Section 11 — Quick Reference Cheat Sheet
Use this table for rapid revision before the interview.


# Section 12 — Study Strategy & Final Tips
## 12.1  The WWWA Framework
For every technical decision, prepare to explain four things:
- WHAT is it? (define the technology or pattern clearly)
- WHY did you choose it? (the specific problem it solves in your project)
- WHAT was the alternative? (show you considered other options)
- WHY was the alternative worse? (for THIS project specifically)

## 12.2  High-Value Topics to Practise Out Loud
- Complete login flow — from form submit to authenticated request (draw it)
- Checkout transaction — all 5 steps, what fails without a transaction
- Why httpOnly cookie over localStorage (XSS attack scenario)
- priceAtPurchase — why historical accuracy requires denormalisation
- manager.decrement() vs load-subtract-save — race condition diagram
- Lazy loading + AdminGuard — when does the bundle download?
- BehaviorSubject vs Subject — late subscriber scenario
- forkJoin in the edit form — why sequential calls fail
- Route guard at parent level — why not individual child routes

## 12.3  Phrases That Show Seniority
- "This is deliberate denormalisation — a justified exception to 3NF."
- "The Map lookup is O(1); iterating sessions would be O(n)."
- "We fail-fast at startup — better to refuse to start than serve requests in a broken state."
- "The guard runs before Angular decides whether to download the lazy module."
- "Both sides must be configured — backend cors({ credentials: true }) and frontend withCredentials: true."
- "RESTRICT forces explicit handling; CASCADE would silently corrupt data."
- "The transaction keeps the lock window minimal by validating before acquiring it."

## 12.4  Common Traps to Avoid
- Do NOT say "I used JWT because it's industry standard" — explain WHY httpOnly cookie specifically, not just JWT.
- Do NOT say "TypeORM is better than raw SQL" — explain the specific portability benefit for this project.
- Do NOT say "transactions are for safety" — explain the specific 5-operation atomic requirement.
- Do NOT say "lazy loading improves performance" — also mention the security benefit (guard prevents bundle download).
- Do NOT confuse .where() and .andWhere() — this is a known trap question.

Good luck with your interview. You built this — you understand every decision.
| Package | Why This Package |
| --- | --- |
| bcrypt | Deliberately slow — ~250ms per hash makes brute force catastrophically slow. SHA-256 is microseconds — billions of attempts per second possible. |
| jsonwebtoken (JWT) | Stateless authentication token. Signed with server secret — payload readable but tamper-proof. Stored in httpOnly cookie, never in localStorage. |
| passport-jwt | Extracts JWT from cookie on every request. Integrates with Express middleware chain cleanly. |
| multer | Multipart form handler for image uploads. Provides file size limits, MIME type filtering, and custom filename generation. |
| express-validator | Collects ALL validation errors in one pass. Better UX than fail-fast — user sees all errors simultaneously. |
| compression | Gzip compresses all responses. JSON payloads can shrink up to 70%. |
| helmet | Sets 15 security HTTP headers automatically — X-Frame-Options, CSP, HSTS, etc. |
| uuid | Generates unique session IDs (jti). Enables per-device logout without invalidating all sessions. |
| Relationship | Strategy |
| --- | --- |
| CartItem → User | CASCADE |
| OrderItem → Product | RESTRICT |
| OrderItem → Order | CASCADE |
| Cart → User | CASCADE |
| Layer | Technology |
| --- | --- |
| 1 — Password Storage | bcrypt cost factor 12 |
| 2 — Token Transport | JWT in httpOnly cookie |
| 3 — Session Management | In-memory Map (jti key) |
| Question | One-Line Answer + Reason |
| --- | --- |
| Why bcrypt over SHA-256? | bcrypt is deliberately slow (~250ms). SHA-256: billions/sec. Slow = catastrophic for brute force. |
| Why httpOnly cookie not localStorage? | localStorage readable by any JS including XSS scripts. httpOnly cookie invisible to JavaScript. |
| Why sameSite: lax not strict? | strict breaks login when user clicks link from email/WhatsApp. lax blocks cross-site POST (CSRF) while allowing top-level navigation. |
| Why jti not full JWT as session key? | jti = 36 chars (UUID), full JWT = 200+ chars. jti enables per-device logout; short key saves memory. |
| Why Map not Redis for sessions? | Map = nanosecond lookups. Trade-off: lost on restart. Production would use Redis for persistence + horizontal scaling. |
| Why priceAtPurchase on OrderItem? | Product.price can change. OrderItem.priceAtPurchase is historical fact — immutable to future pricing changes. |
| Why RESTRICT not CASCADE on Product? | CASCADE silently deletes order history. RESTRICT forces explicit handling via soft delete. |
| Why soft delete not hard delete? | Hard delete fails RESTRICT FK. Soft delete preserves history, TypeORM auto-excludes from queries. |
| Why three-layer architecture? | Service testable without HTTP. Routes swappable without touching business logic. |
| Why .andWhere() not .where()? | .where() overwrites previous condition. .andWhere() appends with AND. |
| Why Math.min(pageSize, 50)? | DoS prevention. ?pageSize=100000 would load entire DB. Cap invisible to legitimate users. |
| Why manager.decrement() not load-save? | UPDATE stock = stock - qty is atomic in DB. Load-subtract-save has race condition window. |
| Why validate before transaction? | Opening transaction acquires DB lock. Validate outside = shorter lock = better throughput. |
| Why Promise.all for dashboard? | Four independent queries. Sequential = 40ms. Parallel = 10ms (slowest single query). |
| Why BehaviorSubject not Subject? | BehaviorSubject emits current value to late subscribers immediately. Subject only emits to active subscribers. |
| Why lazy load AdminModule? | Customers never download admin code. Bundle not in customer browser. Guard prevents lazy load for non-admins. |
| Why forkJoin for edit form? | Guarantees taxonomy loads before patchValue runs. Sequential calls cause race condition: dropdown empty when pre-selecting. |
| Why store only filename in DB? | Full URL couples DB to deployment environment. Filename + env var = zero-migration domain changes. |
| Why synchronize: false in production? | synchronize: true can silently drop columns when entity properties are renamed. Migrations give explicit control. |
| Why reflect-metadata first import? | TypeORM decorators need Reflect API at class definition time. If polyfill loads after entities, metadata is silently lost. |