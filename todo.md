# Bulnix - Project TODO

## Phase 2: Project Setup & Design System
- [x] Create comprehensive database schema (all tables)
- [x] Apply database migrations
- [x] Set up Bulnix design system (dark theme, colors, fonts)
- [x] Upload Bulnix logo to CDN
- [x] Set up global layout with top navigation

## Phase 3: Landing Page & Public Pages
- [x] Landing page (hero, features, categories, how it works, payment methods, FAQ preview, footer)
- [x] Categories page
- [x] FAQ page
- [x] About page
- [x] Contact/Support page
- [x] Terms of Service page
- [x] Privacy Policy page
- [x] Refund Policy page

## Phase 4: Authentication System
- [x] Signup page (full name, email, country, terms)
- [x] Login page (email/password, forgot password)
- [x] Forgot password page
- [x] Session management (JWT + cookies)
- [x] Auth middleware (protectedProcedure, adminProcedure)

## Phase 5: Supplier API Connectors & Product Sync
- [x] AccsZone API connector (categories, listings, purchase, orders)
- [x] Product sync engine (manual trigger from admin)
- [x] Category sync and mapping
- [x] Stock sync
- [x] Price sync with markup rules
- [x] Local product caching in database
- [x] Product override system (title, description, price, visibility)
- [x] Provider config management
- [x] Sync logs

## Phase 6: Product Browsing, Cart & Checkout
- [x] Product listing page (grid, filters, search, sorting)
- [x] Product detail page (title, image, price, stock, quantity, description, buy now)
- [x] Cart page (items, update quantity, remove, subtotal, coupon)
- [x] Checkout page (billing details, payment method, order summary, pay now)
- [x] Currency switcher (NGN/USD/EUR/GBP)
- [x] Coupon/promo code validation

## Phase 7: Order Fulfillment & Payment
- [x] Order creation flow (pending_payment → paid → processing → fulfilled)
- [x] Order status states (pending_payment, paid, processing, fulfilled, partial, failed, cancelled, refunded, disputed)
- [x] Paystack payment integration (placeholder - awaiting API keys)
- [x] Monnify payment integration (placeholder - awaiting API keys)
- [x] Crypto gateway integration (placeholder/NOWPayments - awaiting API keys)
- [x] Payment webhook handling structure
- [x] Webhook verification structure
- [x] Supplier order placement after payment confirmation
- [x] Fulfillment data storage

## Phase 8: User Dashboard
- [x] User dashboard (overview, recent orders, saved products, tickets, profile)
- [x] My orders page (all orders, filters by status)
- [x] Order details page (order number, items, payment status, fulfillment, support action)
- [x] Profile settings (name, email, country, currency, notifications)
- [x] Support tickets (open ticket, history, replies)
- [x] Saved/wishlist products

## Phase 9: Admin Panel
- [x] Admin dashboard (stats: users, orders, revenue, failed orders, open tickets, pending orders)
- [x] Product management (title overrides, hide/show, category mapping, markup, featured toggle)
- [x] Order management (all orders, payment state, fulfillment state, retry failed, fraud flag)
- [x] User management (suspend/reactivate, view history)
- [x] Support/ticket management (admin replies, close tickets)
- [x] Provider settings (API keys, markup defaults, sync triggers)
- [x] Category management (create, visibility, sort order)
- [x] System logs (level/category filter, pagination)
- [x] Admin role-based access control (FORBIDDEN for non-admin)

## Phase 10: Logging, Security & Reliability
- [x] System logs table and API
- [x] Payment event logs
- [x] Supplier sync logs
- [x] Fraud detection flag on orders
- [x] Retry mechanism for failed supplier orders (admin trigger)
- [x] Admin alerts structure (notifyOwner)
- [x] Webhook verification structure

## Phase 11: Testing & Polish
- [x] Vitest unit tests for auth procedures (me, logout, cookie)
- [x] Vitest unit tests for categories, products, cart
- [x] Vitest unit tests for order flow (auth guard, create, list)
- [x] Vitest unit tests for tickets
- [x] Vitest unit tests for user profile
- [x] Vitest unit tests for admin access control (FORBIDDEN)
- [x] Vitest unit tests for all admin procedures
- [x] 30 tests passing

## Pending (awaiting user setup)
- [ ] Paystack API key → set in Admin > Providers or Secrets
- [ ] Monnify API key → set in Admin > Providers or Secrets
- [ ] NowPayments/crypto gateway API key → set in Admin > Providers
- [x] AccsZone API key → configured and synced (42 categories, 615 products live)
- [ ] MySQL database credentials → DATABASE_URL secret (production DB)
- [ ] Production deployment → click Publish button

## Bug Fixes & Enhancements (Round 2)
- [ ] Fix featured products not showing on homepage
- [ ] Fix products not showing on storefront/listing pages
- [ ] Fix category icons not displaying
- [ ] Sync AccsZone subcategories into database
- [ ] Admin: add product creation form
- [ ] Admin: add icon/image upload for products and categories
- [ ] Admin: edit individual categories (name, slug, icon, visibility, sort order)
- [ ] Admin: edit individual product listings (title, description, price, image, visibility, featured)
- [ ] Homepage: add "Become a Supplier" section
