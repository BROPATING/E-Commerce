# Complete Workflow Reference

---

## 1. How an API Request Flows Through the Backend

Every single request — login, add to cart, place an order — travels the exact same highway through your backend. The stops never change. Only the destination does.

---

### The Complete Journey — `POST /api/orders/checkout`

```
BROWSER
   │
   │  POST http://localhost:3000/api/orders/checkout
   │  Headers: Cookie: token=eyJhbGciOiJIUzI1NiJ9...
   │  Body: { "paymentMethod": "credit_card" }
   │
   ▼
─────────────────────────────────────────────────────
STOP 1 — Operating System / TCP Layer
─────────────────────────────────────────────────────
   │
   │  Node.js receives the raw TCP packet on port 3000.
   │  At this point it is just bytes. Nobody has read it yet.
   │
   ▼
─────────────────────────────────────────────────────
STOP 2 — server.ts  (Entry Point)
─────────────────────────────────────────────────────
   │
   │  This file is just standing by listening.
   │  It called app.listen(3000) at startup.
   │  It hands the request to the Express app object.
   │  server.ts itself does nothing further with requests.
   │
   ▼
─────────────────────────────────────────────────────
STOP 3 — app.ts  (The Middleware Stack)
─────────────────────────────────────────────────────
   │
   │  Express processes every middleware in registration order.
   │  Each one runs, does its job, then calls next() to continue.
   │  If any middleware calls res.send() or throws — the chain stops.
   │
   ├── helmet()
   │     Adds security headers to the RESPONSE before it even leaves.
   │     X-Frame-Options, Content-Security-Policy, etc.
   │     Does not touch the request body.
   │
   ├── compression()
   │     Registers a response transformer.
   │     Will gzip the outgoing response body later.
   │     Does nothing to the request.
   │
   ├── cors({ origin: "http://localhost:4200", credentials: true })
   │     Reads the Origin header on the request.
   │     Adds Access-Control-Allow-Origin to the response.
   │     If origin is not whitelisted → 403 here and stops.
   │
   ├── cookieParser()
   │     Reads the raw Cookie header string:
   │       "token=eyJhbGciOiJIUzI1NiJ9..."
   │     Parses it into:
   │       req.cookies = { token: "eyJhbGciOiJIUzI1NiJ9..." }
   │     Without this, req.cookies is undefined forever.
   │
   ├── express.json()
   │     Reads the raw request body bytes.
   │     Parses the JSON string into a JavaScript object.
   │     Places it on req.body:
   │       req.body = { paymentMethod: "credit_card" }
   │     Without this, req.body is undefined.
   │     If body is malformed JSON → 400 here and stops.
   │
   └── passport.initialize()
         Sets up Passport's internal request-level state.
         Does nothing visible. Just prepares Passport to run.
   │
   ▼
─────────────────────────────────────────────────────
STOP 4 — app.ts  (Route Matching)
─────────────────────────────────────────────────────
   │
   │  Express walks through registered routers in order:
   │
   │   app.use("/api/auth",    authRoutes)     ← no match
   │   app.use("/api/profile", profileRoutes)  ← no match
   │   app.use("/api/products",productRoutes)  ← no match
   │   app.use("/api/search",  searchRoutes)   ← no match
   │   app.use("/api/cart",    cartRoutes)     ← no match
   │   app.use("/api/orders",  orderRoutes)    ← MATCH ✓
   │
   │  Express strips "/api/orders" from the URL.
   │  Remaining path: "/checkout"
   │  Hands the request to orderRoutes router.
   │
   ▼
─────────────────────────────────────────────────────
STOP 5 — order.routes.ts  (Router-Level Middleware)
─────────────────────────────────────────────────────
   │
   │  This router has its own middleware registered at the top:
   │
   ├── requireAuth  (from auth.middleware.ts)
   │   │
   │   ├── Calls passport.authenticate("jwt", { session: false })
   │   │
   │   ├── Passport calls cookieExtractor(req)
   │   │     → reads req.cookies["token"]
   │   │     → returns "eyJhbGciOiJIUzI1NiJ9..."
   │   │
   │   ├── Passport calls jwt.verify(token, JWT_SECRET)
   │   │     → verifies signature (was this signed by us?)
   │   │     → checks exp claim (has it expired?)
   │   │     → If invalid or expired → 401 here and stops
   │   │     → If valid → decodes payload:
   │   │          { id: 5, role: "customer", jti: "f47ac10b..." }
   │   │
   │   ├── The Passport verify callback runs:
   │   │     → sessionStore.get("f47ac10b...")
   │   │     → If undefined → 401 "Session expired or revoked"
   │   │     → If found → session info retrieved
   │   │
   │   ├── Loads user from database:
   │   │     → userRepo.findOne({ where: { id: 5 } })
   │   │     → If not found → 401
   │   │     → If user.isLocked → 403
   │   │
   │   └── Attaches user to request:
   │         req.user = { id: 5, role: "customer", jti: "f47ac10b..." }
   │         Calls next() — request continues
   │
   ├── requireRole("customer")
   │     Reads req.user.role
   │     "customer" === "customer" → ✓
   │     Calls next()
   │
   └── Route matching inside this router:
         POST /checkout → MATCH ✓
         Calls orderController.checkout(req, res)
   │
   ▼
─────────────────────────────────────────────────────
STOP 6 — order.controller.ts  (The Translator)
─────────────────────────────────────────────────────
   │
   │  The controller's only job: translate HTTP into plain data.
   │  It reads from req, calls a service, sends res.
   │  It does NOT contain business logic.
   │
   ├── asyncHandler wrapper catches any thrown error
   │     and forwards it to next(err) automatically
   │
   ├── Extracts data from request:
   │     const { paymentMethod } = req.body
   │     const userId = req.user.id   (set by requireAuth)
   │
   ├── Calls the service:
   │     const result = await orderService.checkout(userId, paymentMethod)
   │
   └── Sends the HTTP response:
         res.status(201).json(result)
   │
   ▼
─────────────────────────────────────────────────────
STOP 7 — order.service.ts  (The Brain)
─────────────────────────────────────────────────────
   │
   │  All business logic lives here. Knows nothing about
   │  req or res. Just receives plain data and returns plain data.
   │
   ├── Validate payment method
   │     if (!VALID_METHODS.includes(paymentMethod)) throw BadRequestError()
   │
   ├── Load cart from database
   │     cartRepo.findOne({ where: { user: { id: userId } },
   │                         relations: ["items", "items.product"] })
   │     if empty → throw BadRequestError("Cart is empty")
   │
   ├── Validate stock for all items
   │     for each item: if product.stock < item.quantity → throw 400
   │
   ├── Calculate total server-side
   │     (never trust client-submitted totals)
   │
   ├── BEGIN DATABASE TRANSACTION
   │   │
   │   ├── Create Order record
   │   ├── Create OrderItems (copy priceAtPurchase NOW)
   │   ├── Decrement stock (atomic SQL: stock = stock - qty)
   │   └── Delete CartItems
   │   │
   │   ├── COMMIT (all 4 ops permanent simultaneously)
   │   └── or ROLLBACK (if any op failed — DB returns to pre-checkout state)
   │
   └── After commit: paymentService.createPaymentRecord()
         Called outside transaction (external concern)
   │
   ▼
─────────────────────────────────────────────────────
STOP 8 — Back up to order.controller.ts
─────────────────────────────────────────────────────
   │
   │  orderService returned the new order object.
   │  Controller sends the HTTP response:
   │    res.status(201).json({ message: "Order placed.", order })
   │
   ▼
─────────────────────────────────────────────────────
STOP 9 — app.ts  (Response Middleware)
─────────────────────────────────────────────────────
   │
   │  compression() transforms the response body with gzip.
   │  Content-Encoding: gzip header is added.
   │  Response size reduced by ~70%.
   │
   ▼
─────────────────────────────────────────────────────
STOP 10 — Browser Receives Response
─────────────────────────────────────────────────────
   │
   │  Status: 201 Created
   │  Body: { message: "Order placed.", order: { id: 23, ... } }
   │
   │  Angular's HttpClient Observable emits the parsed JSON.
   │  CheckoutComponent receives it in the .subscribe() next callback.
   │  cartService.clearLocalCart() is called.
   │  router.navigate(["/orders", 23]) runs.
   │  The confirmation page renders.
   │
   ▼
   DONE
```

---

### What Happens if Something Goes Wrong at Stop 7

```
orderService throws: new AppError("Cart is empty", 400)
   │
   ▼
asyncHandler wrapper catches it:
   fn(req, res, next).catch(next)
   │
   → next(err) is called with the AppError object
   │
   ▼
Express skips ALL remaining route handlers
and jumps directly to the error handler
   │
   ▼
─────────────────────────────────────────────────────
STOP 11 — error.middleware.ts  (Global Error Handler)
─────────────────────────────────────────────────────
   │
   (err, req, res, next) — 4 parameters = Express error handler
   │
   ├── Is it an AppError?
   │     → res.status(err.statusCode).json({ error: err.message })
   │     → 400 { error: "Cart is empty" }
   │
   ├── Is it a SQLITE_CONSTRAINT error?
   │     → res.status(409).json({ error: "Conflict with existing data" })
   │
   ├── Is it a Multer file size error?
   │     → res.status(400).json({ error: "File too large. Maximum 5MB." })
   │
   └── Unknown error?
         → console.error(err.stack)  ← logged on server, never sent to client
         → res.status(500).json({ error: "An unexpected error occurred." })
```

---

## 2. When an Error Logs at the Console — Where to Look

There are two consoles. Knowing which one shows the error tells you immediately which side of the stack to look at.

---

### The Two Consoles

```
Browser DevTools Console          Terminal (where npm run dev runs)
─────────────────────────         ─────────────────────────────────
Angular errors                    Express errors
HTTP errors (4xx, 5xx)            Database errors
TypeScript errors                 TypeORM errors
JavaScript runtime errors         Passport errors
CORS errors                       File system errors
Missing module errors             Unhandled promise rejections
```

---

### Browser Console — Reading the Error

**The most important piece of information is the HTTP status code:**

```
Status 400 — Bad Request
   Your data was wrong.
   Look in: the request body you sent.
   Common cause: missing required field, failed validation,
                 negative quantity, invalid enum value.
   Where in code: the service method that throws BadRequestError().

Status 401 — Unauthorized
   Auth failed. One of three reasons:
   a) No cookie sent (withCredentials: true missing on interceptor)
   b) JWT expired or tampered
   c) jti not in session store (server restarted, or account locked)
   Where in code: auth.middleware.ts → passport.ts → sessionStore.ts

Status 403 — Forbidden
   Authenticated but wrong role.
   Either: customer trying to reach /api/admin/*
   Or: account is locked (isLocked: true in DB)
   Where in code: requireRole() in auth.middleware.ts

Status 404 — Not Found
   Two possibilities:
   a) The URL is wrong (typo in Angular service apiUrl)
   b) The database record genuinely does not exist
   Where in code: service method that throws NotFoundError()

Status 409 — Conflict
   Business rule violation:
   - Email already registered
   - Already reviewed this product
   - Account already locked
   - Cannot un-cancel a cancelled order
   Where in code: the service method that checks for the conflict

Status 429 — Too Many Requests
   Rate limiter triggered.
   - On login/register: authLimiter (20 req / 15 min)
   - On autocomplete: 60 req / 1 min
   - On get-reset-code: 3 req / 15 min
   Where in code: express-rate-limit config in app.ts or routes file

Status 500 — Internal Server Error
   Something unexpected happened on the server.
   This error is deliberately vague to the client.
   The REAL error is in the TERMINAL, not the browser console.
   Where in code: globalErrorHandler logged it with console.error(err.stack)
```

---

### The Error Investigation Flowchart

```
Error appears in browser console
         │
         ▼
Is it a CORS error?
("Access-Control-Allow-Origin" in the message)
         │
    YES  │  NO
    ─────┤
    ↓    │
Check:   │
cors() in app.ts       ▼
credentials: true    Is it a network error?
Angular proxy        ("ERR_CONNECTION_REFUSED" or "Failed to fetch")
                              │
                         YES  │  NO
                         ─────┤
                         ↓    │
                    Is backend    ▼
                    running?    Read the HTTP status code
                    npm run dev      │
                    in terminal      ▼

                    ┌─────────────────────────────────────────────┐
                    │ Status 400 → look at request body           │
                    │ Status 401 → look at auth.middleware.ts     │
                    │ Status 403 → look at requireRole()          │
                    │ Status 404 → look at service findOne()      │
                    │ Status 409 → look at conflict check in svc  │
                    │ Status 429 → look at rate limiter config    │
                    │ Status 500 → LOOK AT THE TERMINAL           │
                    └─────────────────────────────────────────────┘
```

---

### Terminal — Reading Server Errors

**Pattern 1 — TypeORM / Database Error**

```
QueryFailedError: SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email
```
→ Duplicate email. Look in: `auth.service.ts` register method.
→ The duplicate check `findOne({ where: { email } })` either failed or
  wasn't called before the save.

```
QueryFailedError: SQLITE_CONSTRAINT: NOT NULL constraint failed: orders.userId
```
→ You tried to save an Order without linking it to a User.
→ Look in: `order.service.ts` — the order.create() call is missing the user relation.

```
EntityMetadataNotFoundError: No metadata for "Product" was found.
```
→ `Product` entity is not in the `entities[]` array in `data-source.ts`.
→ OR `reflect-metadata` was not imported first in `server.ts`.

```
ColumnTypeUndefinedError: Column type for User#passwordHash is not defined
```

→ `reflect-metadata` not imported before TypeORM entities were evaluated.
→ Fix: make it the very first line of `server.ts`.

**Pattern 2 — JWT / Passport Error**

```
JsonWebTokenError: invalid signature
```
→ JWT_SECRET in `.env` changed after tokens were issued.
→ All existing sessions are now invalid — users must log in again.

```
TokenExpiredError: jwt expired
```
→ Token is past its 7-day expiry.
→ This is handled in passport.ts and returns 401. If you see it in the terminal,
  your error handler is logging it unnecessarily.

**Pattern 3 — Runtime Error**

```
TypeError: Cannot read properties of undefined (reading 'id')
```
→ You accessed `.id` on something that is `undefined`.
→ Read the stack trace — the filename and line number tell you exactly where.
→ Most common cause: forgot `await` before an async call, so you got a
  Promise object instead of the resolved value.

```
UnhandledPromiseRejection: ...
```
→ An async function threw an error that was never caught.
→ Most common cause: a route handler is async but is not wrapped
  in `asyncHandler`. The error bypassed the global error handler.

**Pattern 4 — Port Error**

```
Error: listen EADDRINUSE: address already in use :::3000
```
→ Another process is already using port 3000.
→ Fix on Windows: `netstat -ano | findstr :3000` to find the PID,
  then `taskkill /PID <number> /F` to kill it.
→ Or just change PORT in `.env` to 3001.

---

### Angular-Side Errors in the Browser Console

```
NullInjectorError: No provider for HttpClient
→ HttpClientModule missing from app.module.ts imports array.

NG0201: No provider found for AuthService
→ Service is not @Injectable({ providedIn: 'root' })
  or not provided anywhere in the module tree.

ERROR TypeError: this.authService.login is not a function
→ The wrong thing was injected. Check the constructor injection
  type matches the actual service class name exactly.

NG8001: 'app-product-card' is not a known element
→ ProductCardComponent is standalone but was not added
  to the imports[] array of the component that uses it.

ExpressionChangedAfterItHasBeenCheckedError
→ Component state changed during Angular's change detection cycle.
→ Move the state change to ngOnInit() or wrap in setTimeout(() => {}, 0).

Cannot read properties of null (reading 'role')
→ You accessed currentUser.role but currentUser is null
  (user not logged in yet or session check still in progress).
→ Use optional chaining: currentUser?.role
```

---

## 3. Every Important Workflow Explained in Plain Language

---

### How the Application Starts

When you run `npm run dev`, Node.js executes `server.ts`. The very first line imports `reflect-metadata` which patches the global Reflect object so TypeORM decorators can store metadata about your entity classes. Then `dotenv` loads the `.env` file and injects every variable into `process.env` — the JWT secret, the database filename, the port number. Only after these two setup steps does the code import `app.ts`, which registers all the middleware and routes onto the Express application object. At this point the server is configured but not yet listening. Then `AppDataSource.initialize()` opens the SQLite database file, reads every entity class, and confirms the schema is in place. Only when the database confirms it is ready does `app.listen(PORT)` get called — opening the port and beginning to accept requests. If the database fails to connect, `process.exit(1)` kills the process immediately. The server never opens the port in a broken state.

---

### How a User Registers

The Angular register form calls `POST /api/auth/register`. Express routes the request through the middleware stack — CORS headers added, body parsed from JSON into `req.body`. The rate limiter checks whether this IP has made too many registration requests recently. The controller extracts name, email, and password from `req.body` and hands them to the auth service. The service normalises the email to lowercase and trims whitespace, then queries the database for any existing user with that email — if found, it returns 409 Conflict. It never reveals whether the email exists for security reasons — it simply says "email already taken." If the email is new, bcrypt hashes the password with a cost factor of 12, which takes about 250 milliseconds deliberately — fast enough for a human, catastrophically slow for a brute-force script trying millions of passwords. The hashed string is saved to the `passwordHash` column — the original password is never stored anywhere and never appears in any response. TypeORM's cascade setting automatically creates an empty `Cart` record linked to the new user at the same time. The saved user is returned to the controller with `passwordHash` stripped out before sending the 201 response.

---

### How Login Creates a Secure Session

When a user logs in, the server must solve a fundamental problem: HTTP is stateless, so every future request needs to prove identity without re-sending the password. The login service finds the user by email, checks `isLocked`, then runs `bcrypt.compare()` regardless of whether the user was found — always taking ~250ms to prevent timing attacks that would reveal which emails are registered. If the password matches, the service generates a UUID called a `jti` (JWT ID). It signs a JWT containing the user's ID, role, and this jti using the `JWT_SECRET`. The jti and full session info — IP address, user agent, timestamp — are stored in the in-memory Map. The JWT is then placed into an HTTP-only cookie on the response. The browser stores the cookie and from this point sends it automatically on every request without Angular doing anything. The JWT cannot be read by JavaScript, making the token invisible to XSS attacks.

---

### How Every Protected Request Is Verified

Every route protected by `requireAuth` runs through the same verification chain. The browser automatically includes the cookie in the request header. `cookieParser()` reads it from the raw header and puts it on `req.cookies`. Passport's JWT strategy extracts the token from the cookie, calls `jwt.verify()` to check the signature and expiry, and if valid, decodes the payload to get the jti. It then looks up that jti in the session store Map — a nanosecond in-memory operation. If the jti is missing, the session was either revoked by logout or killed by an admin lock, and the request receives 401 immediately even if the JWT itself is still cryptographically valid. If the session exists, the full user is loaded from the database and attached to `req.user`. Downstream controllers can then read `req.user.id` and `req.user.role` with confidence that authentication is complete.

---

### How Account Locking Works in Real Time

When an admin locks a customer's account, two operations happen in sequence. First, `user.isLocked` is set to `true` in the SQLite database — this is the persistent layer that survives server restarts and prevents all future login attempts for this user. Second, `sessionStore.deleteAllForUser(userId)` iterates the userIndex Map and removes every jti associated with this user ID — this is the real-time enforcement layer. On the customer's very next HTTP request — even if they are actively browsing at that exact moment — Passport looks up their jti in the session Map, finds nothing, and returns 401. The customer is effectively logged out of every device simultaneously without any warning and without waiting for their JWT to expire. Without the session Map, the lock would only take effect when the JWT expires up to seven days later. Both layers together make the lock both immediate and permanent.

---

### How the Search Engine Works

The search endpoint receives optional query parameters — a search term, taxonomy IDs, price range, stock filter, sort preference, and page number. The service builds a TypeORM QueryBuilder starting with a base query that joins product to subCategory, category, and type. Filters are applied conditionally using `andWhere()` — a critical distinction from `where()` which would overwrite the previous condition instead of appending to it. Full-text search uses `LOWER(name) LIKE :q OR LOWER(description) LIKE :q` with the search term wrapped in `%` wildcards, making it case-insensitive and able to match partial words anywhere in either column. This is why searching "table" returns products from completely different categories — the search operates on content, not taxonomy. The taxonomy filter applies the most specific level provided — if a subCategoryId is given, only that level is filtered and the broader category and type filters are ignored. The page size is capped at 50 server-side regardless of what the client requests, preventing a denial-of-service where someone requests every product in one call. `getManyAndCount()` returns both the page of results and the total count in a single database round trip, which the controller uses to calculate total pages for the pagination component.

---

### How Checkout Protects Financial Integrity

Checkout is the most critical operation in the entire application because it involves money and inventory. Before touching the database at all, the service validates the payment method and loads the cart with all product relations, checking that stock is sufficient for every item. These validations happen outside the transaction deliberately — opening a database transaction acquires a lock, and any validation that can be done before acquiring the lock keeps the lock window as short as possible. Once validation passes, a QueryRunner opens a transaction. Inside it, five operations are executed as one atomic unit: the Order record is created, OrderItems are created with `priceAtPurchase` set to the current product price copied as a plain decimal value, stock is decremented using `UPDATE stock = stock - quantity` as atomic SQL to prevent race conditions, and all CartItems are deleted. If any single operation fails, the entire transaction rolls back and the database returns to exactly the state before checkout began — no partial order, no reduced stock, no cleared cart. The customer can try again safely. Only after the transaction commits does the payment record get created — it is outside the transaction because payment processing is an external concern with its own failure modes that should not roll back a successfully placed order.

---

### How the Angular App Knows Who Is Logged In After a Page Refresh

This is a question that confuses many Angular developers. When the user refreshes the page, Angular boots from scratch — all JavaScript variables, including the `currentUser` BehaviorSubject, reset to `null`. Angular cannot read the JWT because it is in an HTTP-only cookie invisible to JavaScript. So Angular has to ask the server. In `app.component.ts` `ngOnInit()`, `authService.checkSession()` is called immediately. This makes a `GET /api/profile` request. The browser automatically attaches the cookie to this request. If the cookie is valid and the session exists in the server's Map, the server returns the user object and the BehaviorSubject is updated to that user — all components subscribed to `currentUser$` update instantly, the navbar shows the username, the cart badge loads, role-based links appear. If the cookie is expired or the session is gone, the server returns 401 and the BehaviorSubject stays null. This session restoration happens in the background on every page load and is completely invisible to the user when it succeeds.

---

### How the Admin Module Is Kept Away From Customers

The Angular router defines the `/admin` route with `canActivate: [AuthGuard, AdminGuard]` and `loadChildren` pointing to the AdminModule. When any user navigates to `/admin`, Angular evaluates both guards synchronously before making any network request for the admin bundle. `AuthGuard` checks the BehaviorSubject for a logged-in user. `AdminGuard` checks that the user's role is `admin`. Both checks are in-memory reads — no server call. If either guard fails, Angular cancels the navigation, redirects appropriately, and never calls the `loadChildren` function. This means the network request for the admin JavaScript chunk never fires. Customers never download admin code — it is not sent to their browser at all. The first time a genuine admin navigates to `/admin` successfully, Angular downloads the admin chunk and caches it for the session. Subsequent navigation within the admin section uses the cached module.

---

### How Product Images Are Stored and Served

When an admin uploads a product image through the admin panel, Angular sends a `multipart/form-data` request — a special encoding that allows binary file data to be mixed with text fields in the same request body, something regular JSON cannot do. Multer middleware intercepts this request before it reaches the controller. It runs the file through a filter that checks the MIME type — not the file extension, which is trivially spoofable — against an allowlist of jpeg, png, and webp. If the type is invalid, the upload is rejected at this stage. If valid, Multer generates a unique filename using the current timestamp and a random number with the original extension, writes the binary data to the `ProductImages` folder on disk, and populates `req.file` with the filename. The controller reads `req.file.filename` and stores only that filename in the database — not the full URL. When the product is returned in any API response, the service constructs the full URL by prepending `/images/` to the filename. Express serves the `ProductImages` folder as static files under the `/images` path. This design means if the server's domain or port ever changes, only an environment variable changes — every image URL in the database remains correct because they are constructed at query time, not stored as absolute URLs.

---

### How the Frontend and Backend Connect in Production

During development, Angular runs on port 4200 and Express on port 3000 as two separate processes. The Angular dev server has a proxy configured in `proxy.conf.json` that forwards any request to `/api/*` or `/images/*` to `http://localhost:3000`. From Angular's perspective, requests are same-origin — no CORS complications. For production, `npm run build` inside the frontend folder compiles all Angular TypeScript into optimised, minified JavaScript bundles with content-hash filenames placed in `dist/frontend/browser/`. Express is then configured to serve that entire folder as static files and to respond to any URL that is not an API route with `index.html`. This catch-all route is how Angular's client-side routing works in production: a user navigates to `/products/42` directly, Express serves `index.html`, Angular boots, reads the URL, matches it to the ProductDetail route, loads the component, and makes an API call to `GET /api/products/42`. The share button works for the same reason — the URL `/products/42` is deterministic and permanent, the Express catch-all ensures Angular always boots for any URL, and Angular always renders the correct page based on whatever URL it finds in the address bar.
