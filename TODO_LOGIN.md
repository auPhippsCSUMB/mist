# Login TODO (Where to Build It)

## 1. Database (users table)
Location: MySQL database used by [index.mjs](index.mjs)

- [ ] Create a `users` table with: `id`, `username`, `email`, `password_hash`, `created_at`
- [ ] Add unique indexes for `username` and `email`
- [ ] Keep only hashed passwords (never plain text)

## 2. Session Setup
Location: [index.mjs](index.mjs)

- [ ] Add `app.use(session({...}))` near other middleware
- [ ] Use `secret` from `.env`
- [ ] Set secure cookie options (`httpOnly`, `sameSite`, `maxAge`)

## 3. Sign Up (Create Account)
Location: [index.mjs](index.mjs) and [views/signUp.ejs](views/signUp.ejs)

- [ ] Add `POST /signUp` route
- [ ] Validate input (`username`, `email`, `password`)
- [ ] Hash password with bcrypt
- [ ] Insert new user into database
- [ ] Show success message or redirect to login

## 4. Login (Start Session)
Location: [index.mjs](index.mjs) and [views/login.ejs](views/login.ejs)

- [ ] Build login form in [views/login.ejs](views/login.ejs) (email/username + password)
- [ ] Add `POST /login` route
- [ ] Look up user by email/username
- [ ] Compare password with bcrypt
- [ ] On success, set session values:
  - [ ] `req.session.userAuthenticated = true`
  - [ ] `req.session.userId = user.id`
- [ ] Redirect to `/profile` (or home)

## 5. Protect Website Pages (Require Login)
Location: [index.mjs](index.mjs)

- [ ] Keep `isUserAuthenticated` middleware
- [ ] Apply it to pages that need login, for example:
  - [ ] `/profile`
  - [ ] `/addFriends`
  - [ ] `/addGame`
  - [ ] `/friendsWishlist`
  - [ ] `/aISearch`
- [ ] Redirect unauthenticated users to `/login`

## 6. Logout (End Session)
Location: [index.mjs](index.mjs) and [views/partials/nav.ejs](views/partials/nav.ejs)

- [ ] Add `POST /logout` route
- [ ] Destroy session and clear cookie
- [ ] Add logout button in nav when logged in

## 7. UI/Navigation Rules
Location: [views/partials/nav.ejs](views/partials/nav.ejs)

- [ ] Show `Login` / `Sign Up` when logged out
- [ ] Show `Profile` / `Logout` when logged in
- [ ] Hide protected links for logged-out users

## 8. Validation and Error Messages
Location: [views/login.ejs](views/login.ejs), [views/signUp.ejs](views/signUp.ejs), [index.mjs](index.mjs)

- [ ] Show invalid login message
- [ ] Show duplicate email/username message on sign up
- [ ] Keep server-side validation for all fields

## 9. Final Test Checklist
Location: run from project root

- [ ] New user can sign up
- [ ] Existing user can log in
- [ ] Logged-out user cannot open protected routes
- [ ] Logged-in user can open protected routes
- [ ] Logout ends access to protected routes
