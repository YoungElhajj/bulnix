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

## User Requests - Round 3 (Mar 23 2026)

- [ ] Remove AI-style em-dashes and hyphens from all page text across the site
- [ ] Remove "Verified Supplier Network" section exposing AccsZone/AccsBulk names
- [ ] Fix product page filters: currency switcher, sort (price low-high, high-low), category filter
- [ ] Build user wallet: balance display in dashboard, top-up page, minimum $3 deposit, transaction history
- [ ] Fix notification/verification emails to use Bulnix branding and send active codes
- [ ] Admin: refund processing for open support tickets
- [ ] Admin: supplier refund claim workflow
- [ ] Admin: product icon/logo upload when adding or editing products

## Supplier Refund Request Feature (Mar 23 2026)

- [ ] Add supplier_refund_claims table to schema
- [ ] Add AccsZone refund API integration (submit claim, check status)
- [ ] Add backend tRPC procedures for creating and tracking supplier claims
- [ ] Build admin UI: raise claim from ticket, view claim status, log supplier response
- [ ] Link supplier claims to tickets and orders in admin panel
- [ ] Write vitest tests for supplier refund claim procedures
- [ ] Checkpoint and deliver

## Raise Supplier Claim from Tickets (Mar 23 2026)

- [ ] Add "Raise Supplier Claim" button inside Admin Tickets detail view
- [ ] Pre-fill claim form with ticket ID, order ID, and customer info
- [ ] Show existing supplier claims linked to the ticket
- [ ] Checkpoint and deliver

## Round 4 Features (Mar 23 2026)

- [ ] Instant customer refund: one-click wallet credit without extra confirmation steps
- [ ] Light/dark theme toggle button in navbar with localStorage persistence
- [ ] Fix and verify admin sync button works correctly
- [ ] Auto-sync scheduler: background stock/price sync every 15 minutes
- [ ] Manual sync button in admin providers page
- [ ] Real-time stock deduction on order placement to prevent overselling
- [ ] Fix admin user details page: show orders, order IDs, wallet balance, tickets
- [ ] Seed demo orders and demo data for admin panel preview

## Sync Button UX (Mar 23, 2026)
- [x] Add loading spinner and disabled state to sync button while sync is in progress
- [x] Add animated progress bar below sync button showing elapsed time
- [x] Disable sync type selector while sync is running
- [x] Add Quick Sync shortcut button inside each provider card with spinner

## Bug Fixes Round 5 (Mar 23, 2026)
- [x] Fix dark/light theme toggle button not working in navbar
- [x] Verify and fix sync button to actually update products/stock counts
- [x] Assign category logos/icons to all products based on their parent category
- [x] Fix admin orders page showing no data (was already using correct data.items field)
- [x] Fix admin logs page showing no data (was already using correct data.items field)
- [x] Fix admin users detail view showing orderRef (changed to orderNumber)
- [x] Fix sync history showing wrong status colors (success vs completed)

## Category & Product System Overhaul (Mar 23, 2026)
- [ ] Fix AccsZone sync to correctly map parent→subcategory hierarchy (Facebook Accounts → Ads Accounts, Aged & Cookies, etc.)
- [ ] Pin social media categories (Facebook, Instagram, TikTok, Twitter, WhatsApp, YouTube, etc.) to top of homepage
- [ ] Fix categories page to show subcategories when a parent category is clicked
- [ ] Add product listing under each subcategory page
- [ ] Add live product count per category on homepage and categories page
- [ ] Add real-time stock badge on product cards (In Stock / Low Stock / Out of Stock)
- [ ] Admin dashboard: live product count that updates after each sync

## Category & Product System Overhaul (Mar 23, 2026)
- [x] Pin social media categories (Facebook, Instagram, TikTok, WhatsApp, YouTube, Twitter/X, Telegram, Snapchat, LinkedIn, Google Voice, Gmail, Discord) to top of homepage and categories page
- [x] Show 12 categories on homepage (up from 6) with live product counts
- [x] Add getCategoriesWithCounts DB function returning productCount per category (including subcategory rollup)
- [x] Add getSubcategoriesByParentId DB function with per-subcategory product counts
- [x] Add listWithCounts and getSubcategories tRPC procedures
- [x] Fix getProducts to include products from all subcategories when a parent category is selected (inArray)
- [x] Add subcategory grid to category product page - shows clickable subcategory pills below header
- [x] Show product count and subcategory count on each category card in Categories page
- [x] Fix getAdminStats to return totalProducts and visibleProducts for admin dashboard

## Email Notifications & Social Features (Mar 23, 2026)
- [x] Set up email service (Resend - lazy init, no crash when key missing)
- [x] Welcome email on first OAuth signup
- [x] Order confirmation email with order items, totals, and delivery info
- [x] Order status update email template ready
- [x] Ticket reply notification email when admin replies
- [x] Password reset email template ready (for future custom auth)
- [x] Add dismissible Telegram join banner at top of all pages
- [x] Add floating WhatsApp + Telegram action buttons (bottom-right)
- [x] Add Community section to footer (Telegram, WhatsApp, Email)
- [x] Add Telegram/WhatsApp social icons to footer brand row
- [ ] PENDING: Update TELEGRAM_URL and WHATSAPP_URL with real links (in SocialFloatingWidgets.tsx, TelegramBanner.tsx, Footer.tsx)
- [ ] PENDING: Add RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME secrets once domain verified

## DB Retry Resilience (Mar 23, 2026)
- [x] Extract withDbRetry/isRetryableDbError to shared server/db-retry.ts utility
- [x] Apply retry to upsertUser (auth login)
- [x] Apply retry to createOrder (order insert + order items)
- [x] Apply retry to initiatePayment (payment insert + order lock)
- [x] Apply retry to createTicket (ticket + first message)
- [x] Apply retry to replyToTicket (message insert + status update)
- [x] Apply retry to adminReplyToTicket (message insert + status update)
- [x] Apply retry to adminUpdateOrder (order status update)
- [x] Apply retry to adminProcessRefund (wallet update + txn insert + action log + ticket close)
- [x] Apply retry to initiateWalletTopup (txn insert)
- [x] Apply retry to confirmWalletTopup (wallet update + txn update)
- [x] Apply retry to createNotification (notification insert)
- [x] Run all 30 tests - all pass, 0 TypeScript errors

## Domain & SSL Fix (Mar 23, 2026)
- [x] Add HTTPS redirect in server so HTTP requests are forced to HTTPS
- [x] Update favicon with Bulnix logo

## Link Preview & Branding Fix (Mar 23, 2026)
- [x] Remove sensitive internal description (AccsZone, AccsBulk, payment gateways) from link preview
- [x] Update OG image to use Bulnix logo instead of Manus logo
- [ ] Update app title in Manus settings to remove "Branded Reseller Marketplace" (manual step - see instructions)
- [ ] Update VITE_APP_LOGO to use Bulnix logo CDN URL (manual step - see instructions)

## Email & Contact Channels (Mar 23, 2026)
- [x] Add RESEND_API_KEY secret
- [x] Update WhatsApp link to https://wa.me/447916699429
- [x] Update Telegram link to https://t.me/bulnix
- [x] Build branded HTML email templates (welcome, OTP, order confirmation, ticket confirmation)
- [x] Wire welcome email on new user sign up
- [x] Wire OTP/verification email on sign in (handled via Manus OAuth)
- [x] Wire order confirmation email after successful order
- [x] Wire support ticket reply notification email
- [x] Wire order status update email when admin changes order status

## Email Domain Fix (Mar 23, 2026)
- [x] Update EMAIL_FROM to noreply@support.bulnix.com (Resend verified subdomain)

## Custom Authentication System (Mar 23, 2026)
- [x] Add OTP columns (otpCode, otpExpiry, otpPurpose) to users table in DB and schema
- [x] Install bcryptjs for password hashing
- [x] Build custom auth server router (register, verifyOtp, loginRequest, resendOtp, forgotPassword, resetPassword, changePassword)
- [x] Add sendOtpEmail function to email.ts using Resend from noreply@support.bulnix.com
- [x] Redesign Sign Up page with branded Bulnix design (dark theme, split layout, OTP step)
- [x] Redesign Sign In page with branded Bulnix design (email+password+OTP+forgot password)
- [x] Update all getLoginUrl() references to point to /login
- [x] Remove Manus OAuth dependency from auth flow - users never leave bulnix.com

## Secure Admin Login (Apr 19, 2026)
- [x] Add adminLogin tRPC procedure (email+password, admin-only, no OTP)
- [x] Create admin account in database (qazeemayobami@gmail.com, role=admin)
- [x] Build /secure-admin login page (hidden, no public link)
- [x] Register /secure-admin route in App.tsx
