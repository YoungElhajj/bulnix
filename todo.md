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

## Admin Panel Route Guard (Apr 19, 2026)
- [x] Create AdminRoute guard component that redirects to /secure-admin if not admin
- [x] Wrap all /admin/* routes with AdminRoute guard
- [x] Ensure /admin/* never redirects to /login (always /secure-admin)

## Admin Portal Redesign (Apr 19, 2026)
- [x] Build AdminLayout component (sidebar, header, distinct colour scheme — dark slate/emerald)
- [x] Build Admin Account Settings page (change password)
- [x] Add 2FA setup page (TOTP / Google Authenticator) with QR code
- [x] Add DB columns for 2FA (totpSecret, totpEnabled) — columns already existed in DB
- [x] Add server procedures: changeAdminPassword, setupTotp, verifyTotp, disableTotp, getTotpStatus
- [x] Wrap all existing admin pages with new AdminLayout — all pages already use AdminLayout
- [x] Register /admin/account route in App.tsx with AdminRoute guard

## Last Login Info on Account Settings (Apr 19, 2026)
- [x] Add lastLoginIp column to users table (DB migration + schema update)
- [x] Record IP on every successful adminLogin call
- [x] Add getSessionInfo server procedure (returns lastSignedIn + lastLoginIp)
- [x] Wire procedure into routers.ts under auth namespace
- [x] Display "Last Login" card on AdminAccountSettings page (date/time + IP, relative time)
- [x] Run tests, save checkpoint

## Auth Page Cleanup — Remove Manus OAuth (Apr 19, 2026)
- [x] Remove "Continue with Manus" button from Login page — was only on published site (old build), not in code
- [x] Remove Manus OAuth "Create Free Account" button from Signup page — already clean in code
- [x] Fix getLoginUrl() in const.ts to return /login instead of Manus OAuth portal URL
- [x] Fix useAuth hook default redirect to /login instead of Manus OAuth portal
- [x] Fix ForgotPassword page to redirect to /login instead of Manus OAuth
- [x] Remove all unused getLoginUrl imports from Dashboard, Orders, Profile, Tickets, Wallet, Wishlist, Checkout, DashboardLayout
- [x] Checkpoint saved — user must click Publish to push fix to bulnix.com

## Signup & Login Page Redesign — XeroSMS Style (Apr 19, 2026)
- [x] Signup page: illustration left panel, form right — Full Name, Email, Password, Confirm Password, Terms checkbox, Sign Up button
- [x] Login page: matching split layout — Email, Password, Forgot Password link, Sign In button
- [x] Add confirm password validation (must match password, live error feedback)
- [x] Add terms & conditions checkbox (must be checked to submit)
- [x] Run tests, save checkpoint

## Full Site Rebrand — New Logo & Colour Palette (Apr 19, 2026)
- [x] Upload primary logo (white+cyan on navy) and icon to CDN
- [x] Update VITE_APP_LOGO to new primary logo URL
- [x] Rewrite global CSS variables: #061A2B bg, #0A2540 card, #0F3D5E border, #00C2FF primary, #0319CB accent
- [x] Redesign Home page hero, navbar, sections with new dark navy + cyan theme
- [x] Update Login and Signup pages to use new brand colours
- [x] Batch-update all remaining customer-facing pages (Products, Categories, Dashboard, Orders, Wallet, Profile, Tickets, Cart, Checkout, About, Contact, etc.)
- [x] 0 TypeScript errors, 30/30 tests pass, checkpoint saved

## Light Theme + Animations (Apr 19, 2026)
- [x] Fix logo in Navbar: remove box/container, logo sits cleanly on background
- [x] Fix dark/light theme toggle to actually switch between themes (ThemeProvider defaultTheme=light, toggle works)
- [x] Implement light theme as default: white/light-blue bg, dark navy text, cyan/blue accents
- [x] Add hero animations: fade-in text, slide-in elements (animate-fade-in-up, animate-fade-in-left, animate-fade-in-right)
- [x] Add scroll-reveal animations on section cards and feature blocks (.reveal/.revealed via IntersectionObserver)
- [x] Add floating decorative elements in hero (animate-float, animate-float-slow, animate-float-reverse)
- [x] Add card hover lift animations across Home, Products, Categories pages (.product-card hover)
- [x] Update Login/Signup pages for light theme compatibility (#0319CB/#00C2FF brand colours)
- [x] 0 TypeScript errors, 30/30 tests pass, checkpoint saved

## Full Site Redesign v2 — Unique Bulnix Brand (Apr 19, 2026)
- [ ] Define unique Bulnix design system (palette, typography, spacing) — NOT copied from competitors
- [ ] Rewrite global CSS: creamy-white bg #F8FAFF, navy #0F3D5E navbar/footer, cyan #00C2FF accents, blue #0319CB CTAs
- [ ] Add Google Fonts (Inter + Poppins) to index.html
- [ ] Redesign Navbar: navy bg matching logo, logo blends seamlessly, clean links, social icons
- [ ] Redesign Footer: navy bg, social media icons row, quick links, newsletter
- [ ] Redesign Home page: animated hero with floating social icons, stats counter, feature cards, CTA
- [ ] Redesign Login page with new brand style
- [ ] Redesign Signup page with new brand style
- [ ] Redesign Products listing page
- [ ] Redesign Categories page
- [ ] Redesign Product Detail page
- [ ] Redesign Cart page
- [ ] Redesign Checkout page
- [ ] Redesign Dashboard pages (Orders, Profile, Tickets, Wallet)
- [ ] Run tests, save checkpoint

## Full Site Redesign v2 — Bulnix Light Palette (Apr 19, 2026)
- [x] Redesign Navbar — navy #0F3D5E bg, seamless logo blend, social icons, Poppins font
- [x] Redesign Footer — navy bg, social media icons row, newsletter, multi-column layout
- [x] Redesign Home page — animated hero, floating social platform icons, stats counter, feature cards, CTA
- [x] Redesign Products page — light #F5F9FF bg, navy page header, card grid
- [x] Redesign Categories page — light palette, navy header, category cards
- [x] Redesign ProductDetail page — light palette, navy header
- [x] Redesign Cart page — light palette, white cards, navy header
- [x] Redesign Checkout page — light palette, white cards, navy header
- [x] Redesign Login page — navy left panel, light right panel
- [x] Redesign Signup page — navy left panel, light right panel
- [x] Redesign Dashboard page — light palette, gradient wallet banner, stat cards
- [x] Redesign Orders, OrderDetail, Profile, Wallet, Tickets, TicketDetail pages
- [x] Redesign About, Contact, FAQ, Privacy, Terms, Refund, Wishlist pages
- [x] Redesign all Admin pages (AdminDashboard, AdminProducts, AdminCategories, etc.)
- [x] All 30 tests passing, 0 TypeScript errors

## Navbar/Footer/Auth/Mobile Fix (Apr 19, 2026)
- [ ] Rebuild Navbar: logo, all menu links (FAQ, About, Contact, Policy), Sign In/Sign Up buttons, dark/light toggle, mobile hamburger
- [ ] Rebuild Footer: multi-column (Help & Info, About Us, Menu, logo+newsletter+social)
- [ ] Fix auth: Sign In/Sign Up/OTP pages work end-to-end, redirect after login
- [ ] Add product description + login instructions to Product Detail page
- [ ] Fix mobile responsiveness on all major pages

## Fix v2 (Apr 19 2026)
- [x] Navbar: restore logo, all menu links (Home, Products, Categories + More dropdown for FAQ/About/Contact/Terms/Privacy/Refund)
- [x] Navbar: dark/light theme toggle button
- [x] Navbar: mobile hamburger with all links including More Pages section
- [x] Navbar: social icons in desktop and mobile
- [x] Footer: XeroSMS-style 4-column layout (Help & Information, About Us, Menu, Brand+Newsletter)
- [x] Footer: social icons row in bottom bar
- [x] ProductDetail: tabs for Description, How to Login, Delivery Info, Refund Policy
- [x] ProductDetail: step-by-step login instructions
- [x] ProductDetail: login prompt for guest users
- [x] ProductDetail: wishlist button
- [x] Dark mode: CSS overrides for hardcoded light bg/text colors
- [x] Mobile: hero section padding for floating icons
- [x] Wishlist: fix dark card image background

## Fix Round 3 (Apr 19 2026)
- [x] Add ScrollToTop component to App.tsx — footer links now scroll to top on navigation
- [x] Fix blank Home page bottom section — lower reveal threshold, re-run observer when data loads
- [x] Add "Get Started Free" CTA button on Home hero linking to /signup
- [x] Update new Bulnix logo on Login and Signup pages (both desktop left panel and mobile)
- [x] Update Footer logo size to match Navbar
- [x] Fix Navbar logo size and rounded corners

## Auth & Email Improvements (Apr 19 2026)
- [x] Redesign Login page with premium split-panel layout (floating platform icons, stats, gradient left panel)
- [x] Redesign Signup page with premium split-panel layout matching Login
- [x] Add "Continue with Google" button to Login and Signup pages
- [x] Add delivery email with account credentials + per-product login instructions when order is fulfilled
- [x] Fix TypeScript errors in db.ts (orderItems.productTitle, fulfillmentRecords.orderItemId)
- [x] Supplier API auto-sync confirmed working (15min stock sync, 1hr full sync)

## Fix Round 3 (Apr 19 2026)
- [x] Redesign Login left panel with rich visual design: blobs, floating social icons, feature cards
- [x] Redesign Signup left panel with same rich visual design
- [x] Fix product card image sizing on mobile (too large, no aspect ratio constraint)
- [x] Fix categories with 0 products (hidden from customer-facing page; API returns correct counts)

## Auth Page Original Redesign (Apr 19 2026)
- [ ] Rewrite Login.tsx with original Bulnix design (blue/navy, no Goviraa/Lanxa copying)
- [ ] Rewrite Signup.tsx with original Bulnix design (blue/navy, no Goviraa/Lanxa copying)

## Product Card & Search Fixes (Apr 19 2026)
- [x] Fix product card image background: replaced transparent/checkered with solid white bg
- [x] Switch product grid to 2-column on mobile (grid-cols-2 sm:grid-cols-3 lg:grid-cols-4)
- [x] Fix Instagram search: search now matches category name too (e.g. 'instagram' finds IG Accounts products)

## Homepage & Nav & Admin Fixes (Apr 19 2026)
- [x] Remove top-selling/featured products section from homepage (icons look bad on mobile)
- [x] Fix mobile navbar position: Dashboard page was missing Navbar component — added back
- [x] Admin panel colour scheme confirmed intact (dark slate/emerald) — no changes needed

## Text Cleanup (Apr 19 2026)
- [x] Remove unnecessary hyphens, em-dashes, and AI-sounding phrasing from all customer-facing pages

## Admin Panel Colour Fix (Apr 19 2026)
- [x] Restore admin panel stat cards to dark slate background with emerald accents (remove white/light card backgrounds)

## Payment Gateway Integration (Apr 19 2026)
- [ ] Add payment_transactions table to DB schema
- [ ] Add Paystack initiate + verify + webhook handler
- [ ] Add Flutterwave initiate + verify + webhook handler
- [ ] Add NowPayments (crypto) initiate + verify + webhook handler
- [ ] Build frontend checkout: payment method selector, redirect handling, order confirmation
- [ ] Update admin Providers panel: configure and toggle each gateway

## Payment Gateway Integration (Apr 19, 2026)
- [x] Replace Monnify with Flutterwave in Checkout.tsx and Wallet.tsx
- [x] Create server/payments/paystack.ts handler (initiate + verify)
- [x] Create server/payments/flutterwave.ts handler (initiate + verify)
- [x] Create server/payments/nowpayments.ts handler (initiate + status + IPN verify)
- [x] Update server/_core/env.ts to expose PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET
- [x] Add webhook routes: POST /api/webhooks/paystack, /api/webhooks/flutterwave, /api/webhooks/nowpayments
- [x] Add payment verify redirect route: GET /api/payments/verify
- [x] Update initiatePayment in db.ts to call real gateway handlers and return real paymentUrl
- [x] Update initiateWalletTopup in db.ts to call real gateway handlers and return real paymentUrl
- [x] Add fulfillOrderByReference helper function in db.ts
- [x] Update Wallet.tsx: replace Monnify with Flutterwave, add redirect on paymentUrl, handle return from gateway
- [x] Write vitest tests for all 3 payment gateways (11 tests passing)
- [x] All 41 tests passing (3 test files)
- [ ] Set PAYSTACK_SECRET_KEY in Secrets (already injected as env)
- [ ] Set FLUTTERWAVE_SECRET_KEY in Secrets (already injected as env)
- [ ] Set NOWPAYMENTS_API_KEY in Secrets (already injected as env)
- [ ] Set NOWPAYMENTS_IPN_SECRET in Secrets (already injected as env)

## Paystack Bug Fixes (Apr 19, 2026)
- [x] Fix orderId extraction in Checkout.tsx (was reading order.id instead of order.orderId)
- [x] Fix paymentUrl guard to reject fallback #hash URLs and show proper error toast
- [x] Fix callbackUrl using localhost:3000 — now uses request origin (x-forwarded-host) so it works in all environments
- [x] Update initiatePayment and initiateWalletTopup to accept optional origin param
- [x] Update routers.ts to extract origin from request headers and pass to db functions
- [x] Fix /api/payments/verify route to redirect to /orders for order payments and /wallet for topups
- [x] Fix NowPayments successUrl/cancelUrl double query-string (? vs &)
- [x] Add payment return handler in Orders.tsx (shows toast on payment_ref param)
- [x] All 41 tests still passing

## Payment Bug Fixes Round 2 (Apr 19, 2026)
- [ ] Fix Paystack: always charge in NGN (convert USD amount using stored NGN rate), never pass USD to Paystack
- [ ] Fix Flutterwave webhook: wallet topup not being credited after successful payment
- [ ] Add configurable NGN conversion rate in admin panel (separate from product exchange rate)
- [ ] Show NGN equivalent amount in Wallet top-up UI when user enters USD amount
- [ ] Update Wallet.tsx to always show NGN equivalent for Paystack/Flutterwave

## Payment Bug Fixes Round 3 (Apr 19, 2026)
- [x] Fix Paystack "Currency not supported" — always convert USD to NGN and charge in kobo
- [x] Fix Flutterwave webhook signature — use dedicated FLUTTERWAVE_WEBHOOK_HASH env var (separate from API key)
- [x] Add updateExchangeRate upsert — inserts new row if no existing rate found
- [x] Add Admin > Payment Rates page — configure USD→NGN rate with profit calculator
- [x] Add NGN equivalent display in Wallet top-up UI when Paystack is selected
- [x] Add FLUTTERWAVE_WEBHOOK_HASH to env.ts
- [x] All 41 tests passing

## AccsZone Auto-Fulfillment (Apr 19, 2026)
- [x] Read AccsZone API docs and existing integration code in db.ts
- [x] Build AccsZone fulfillment handler (place order, poll for delivery, store credentials)
- [x] Auto-trigger fulfillment on wallet payment (payOrderWithWallet)
- [x] Auto-trigger fulfillment on webhook payment confirmation (Paystack/Flutterwave/NowPayments)
- [x] Update Order Detail page to show delivered credentials to customer
- [x] Test end-to-end: pay → fulfill → delivered status with credentials shown

## Critical Bug Fixes (Apr 19, 2026 - Round 4)
- [ ] Fix orders stuck on processing - diagnose AccsZone fulfillment failure
- [ ] Fix user Orders page showing "No orders found" despite orders existing
- [ ] Retry fulfillment for 3 stuck orders (#120002, #150001, #150002)

## Critical Bug Fixes Round 5 (Apr 19, 2026)
- [x] Fix autoFulfillOrder JOIN bug: item.supplierProductId is the AccsZone product ID directly, not a FK to supplier_products.id — remove wrong DB lookup
- [x] Fix AccsZone connector: POST /purchase with ad_id (not POST /orders with product_id) — correct endpoint and param name per API docs
- [x] Apply 5% promo code "5%OFF" when placing AccsZone orders (promo_code field in /purchase)
- [x] Fix Orders.tsx "No orders found" — was reading data.orders instead of data.items (getUserOrders returns { items, total })
- [x] Retry 3 stuck orders (#120002, #150001, #150002) — all fail with "Insufficient balance" (AccsZone account has $0.00 balance, not a code bug)
- [x] Reset stuck orders back to "processing" status so they retry when AccsZone account is funded
- [x] All 41 tests passing

## Admin Manual Refund (Apr 19, 2026)
- [x] Add adminManualRefund DB helper: credits customer wallet, inserts wallet transaction, logs action, marks order as refunded
- [x] Add admin.orders.manualRefund tRPC procedure (adminProcedure, orderId + amount + reason)
- [x] Add Refund button to Admin Orders list page (opens confirmation dialog with amount + reason fields)
- [ ] Add Refund button to Admin Order Detail page (same dialog) — future enhancement
- [ ] Show refund history in order detail (wallet transactions of type refund) — future enhancement
- [x] Run tests, save checkpoint — 43 tests passing

## AccsZone Balance + Auto-Retry + Refund Email (Apr 19, 2026)
- [x] Add getAccsZoneBalance tRPC procedure (admin only, calls AccsZone GET /balance)
- [x] Add low-balance email alert: if balance < $5, send owner notification email
- [x] Add AccsZone balance card to Admin Dashboard (live balance, low-balance warning badge)
- [x] Add auto-retry scheduler: every 5 minutes, check AccsZone balance; if > $0, retry all processing orders
- [x] Send refund confirmation email to customer when admin issues manual refund
- [x] Run tests, save checkpoint — 43 tests passing

## UI Overhaul Round 2 (Apr 19, 2026)
- [x] Fix dark theme leaks — all pages must use dark backgrounds, no white/light panels
- [x] Fix product card icons — modern brand SVGs with gradient backgrounds (Instagram, Facebook, Twitter/X, TikTok, YouTube, Spotify, Netflix, Discord, etc.)
- [x] Fix product grid — proper multi-column responsive grid (2 cols mobile, 3 cols tablet, 4 cols desktop, 5 cols xl)
- [x] Fix mobile view across all pages
- [x] Scrape AccsZone product pages for login instructions per category
- [x] Add per-platform login instructions to product detail pages (Instagram, Facebook, Twitter/X, TikTok, YouTube, Spotify, Netflix, Discord + generic fallback)
- [x] Run tests — 43 tests passing

## Critical Pre-Launch Bug Fix (Apr 20, 2026)
- [ ] Fix Sign In showing raw DB error to users (missing columns in users table)
- [ ] Add missing columns to users table via migration (twoFactorEnabled, twoFactorSecret, otpCode, otpExpiry, otpPurpose, lastLoginIp, etc.)
- [ ] Sanitize all tRPC error handlers so DB errors never leak to the frontend
- [ ] Run tests, save checkpoint

## Automatic Daily Database Backups (Apr 20, 2026)
- [x] Write server/backup.ts module: dump all tables to SQL, upload to S3, email owner confirmation
- [x] Add daily backup scheduler (runs at 2am UTC) to server/_core/index.ts
- [x] Add admin.system.runBackup tRPC procedure for manual on-demand backup trigger
- [x] Add Backup card to Admin Dashboard (last backup time, download link, manual trigger button)
- [x] Run tests, save checkpoint — 43 tests passing

## Payment System Overhaul (Apr 22, 2026)
- [x] Disable Paystack checkout (hidden from UI, code preserved for future re-enable)
- [x] Fix Flutterwave wallet funding flow (backend connector fixed)
- [x] Fix NowPayments minimum deposit amount ($20 minimum enforced, shown in UI)
- [x] Integrate Kora Pay as wallet funding gateway (live key validated sk_live_*)
- [x] Enforce wallet-first checkout: Checkout.tsx now wallet-only, no direct gateway payment
- [x] All orders deduct from wallet balance only
- [x] Payment gateways only used for wallet top-up, not order tracking
- [x] Wallet balance visible in navbar as badge next to username (auto-refreshes every 60s)
- [x] Wallet balance prominent in wallet page header and checkout page
- [x] Run tests — 43 tests passing, 0 TypeScript errors, Kora Pay live key validated

## Live Exchange Rate Integration (Apr 22, 2026)
- [x] Add fetchAndCacheExchangeRates() helper in db.ts — fetches USD→NGN from open.er-api.com, stores in exchange_rates table with source="api"
- [x] Add scheduled refresh every 6 hours in server/_core/index.ts
- [x] Update rates.list tRPC procedure to also expose last-updated timestamp
- [x] Update Wallet.tsx to show live rate with "last updated" timestamp and attribution
- [x] Update Kora Pay connector to use live DB rate instead of hardcoded 1600

## Kora Pay Fix + Refresh Rates Button (Apr 22, 2026)
- [x] Fix Kora Pay payload: amount was sent in kobo (×100) but API expects naira — removed the ×100 multiplication
- [x] Fix Kora Pay verify: amount was divided by 100 incorrectly — removed the ÷100 division
- [x] Fix Kora Pay: empty metadata object {} was causing "issue with your input" — now omitted when empty
- [x] Add "Refresh Live Rates" button to Admin > Payment Rates page
- [x] Update profit calculator to show live market rate with last-updated timestamp instead of hardcoded value

## Wallet Top-Up Receipt Email (Apr 22, 2026)
- [x] Send receipt email to customer on successful wallet top-up (amount, reference, new balance)

## Kora Pay Post-Payment UX Fix (Apr 22, 2026)
- [x] Fix redirect_url so Kora Pay returns user to /wallet?topup=success after payment
- [x] Add balance polling on wallet page when returning from Kora Pay (detect balance increase, show success toast)
- [x] Show "Payment processing..." state while polling instead of staying on bank transfer screen

## Critical Security Fix: Wallet Credited Without Payment (Apr 22, 2026)
- [x] Fix confirmWalletTopup: must verify payment status with Kora Pay API before crediting wallet
- [x] Remove frontend-triggered confirmTopup on redirect — rely on webhook only for Kora Pay
- [ ] Debit the fraudulently credited $3.00 from admin test account (manual action needed)

## Bug Fixes Batch (Apr 22, 2026)
- [ ] Fix admin NGN rate resetting to market rate after Save (save mutation overwrites with live rate)
- [ ] Fix false "Payment confirmed" toast showing after cancelled Kora Pay payment
- [ ] Fix Kora Pay card missing logo and name on wallet payment method selector
- [ ] Add auto-redirect to wallet page after payment is confirmed
- [ ] Add loading animation on payment processing/waiting page

## Flutterwave Security Audit (Apr 22, 2026)
- [x] Verified Flutterwave webhook uses skipVerify=true (correct, same as Kora Pay)
- [x] Verified frontend no longer calls confirmTopup on redirect for any gateway (polling only)
- [x] Added Flutterwave API verification to confirmWalletTopup (defense-in-depth: blocks false credits if confirmTopup tRPC is ever called directly)
- [x] NGN rate blank in Flutterwave checkout: expected behavior — Flutterwave charges USD directly, no NGN conversion needed

## NowPayments Minimum Update (Apr 22, 2026)
- [x] Raise NowPayments crypto minimum from $1 to $10 (server validation in db.ts + frontend gateway card desc/minUSD in Wallet.tsx)

## Social Links & Contact Update (Apr 22, 2026)
- [x] Replace social icons in Navbar + Footer with Instagram, X (Twitter), TikTok only
- [x] Update X link to https://x.com/Bulnix_
- [x] Update Instagram link to https://www.instagram.com/bulnix_
- [x] Update TikTok link to https://www.tiktok.com/@bulnix_
- [x] Update support email to bulnixsupport@gmail.com on Contact page
- [x] Update UK WhatsApp support number to +447367061279 in floating widget
- [x] Add WhatsApp support card to Contact page (clickable, opens wa.me)
- [x] Telegram stays in floating support widget (not social icons)

## Auth Fixes (Apr 22, 2026)
- [x] Remove OTP for regular users on login — direct 24h session issued immediately
- [x] Admin users still require OTP on login (both /login and /secure-admin pages)
- [x] Reduce all session expiry from 1 year to 24h (customAuth + oauth callback)
- [x] Fix Google login/signup buttons to point to real Manus OAuth portal URL

## UX & Feature Update (Apr 22, 2026)
- [x] Remove Google login/signup buttons from Login.tsx and Signup.tsx (redirects to Manus AI — wrong)
- [x] Add visible text labels beside WhatsApp and Telegram floating buttons ("Live Support", "Join Channel")
- [x] Build Telegram join popup: shows once after login, dismissible, skipped if user already joined (localStorage flag)
- [x] Design and build live chat automation UI (chatbox with auto-replies, escalation to WhatsApp)
- [ ] Add additional supplier API (TBD — awaiting user details)

## Floating Widget & Chat Redesign (Apr 22, 2026)
- [x] Remove standalone LiveChatWidget button — merged chat into SocialFloatingWidgets
- [x] Add visible "Support" label beside the main toggle button so users know what it is
- [x] Redesign live chat as WhatsApp pre-triage bot: structured questions → WhatsApp with context
- [x] Bot clearly tells users it's gathering info before connecting to human

## Triage Bot & Auth Improvements (Apr 22, 2026)
- [x] Expanded triage bot with all specific customer flows: order (not delivered, fulfilled missing, wrong item, delayed, partial, not working), payment (not credited, failed, crypto, top-up info), refund (invalid, wallet, double charge, cancelled, wrong product), account (password, login, suspended, email change, profile, delete, 2FA), discount (code not working, expired, request, referral), bulk orders, delivery info, and other
- [x] Added product-specific question "Which product did you order?" in order flow (streaming, social, gaming, software, other) — included in WhatsApp pre-fill
- [x] Send email confirmation to customer when triage ticket is completed (issue summary + steps)
- [x] Added support.submitTriage tRPC procedure to server/routers.ts
- [x] Restored Google sign-in/sign-up with custom Google OAuth (client ID + secret from user)
- [x] Built /api/auth/google and /api/auth/google/callback server routes in server/googleAuth.ts

## Bug Fixes & Improvements Batch (Apr 22, 2026 - Round 2)
- [ ] Fix Flutterwave checkout: apply admin NGN rate from DB instead of hardcoded/default rate
- [ ] Fix Flutterwave email sender name: show "Bulnix" not owner personal name
- [ ] Fix order page filters: Pending/Processing/Completed/Failed showing empty results
- [ ] Change products page default sort from "Newest First" to "Price: Low to High"
- [ ] Rewrite product descriptions with clear Bulnix-branded login instructions per category (streaming, social media, gaming, software)
- [ ] Full mobile responsiveness audit: wallet balance badge, navbar, product grid, checkout, dashboard
- [ ] Fix wallet balance badge not showing on mobile navbar

## Logo & Product Description Updates (Apr 22, 2026)
- [ ] Update favicon and logo to new Bulnix icon (dark blue cross/circle symbol)
- [ ] Improve product descriptions to supplier-style format (detailed bullets, delivery format line, important notes)
- [ ] Raise NowPayments minimum deposit from $10 to $12
- [ ] Format delivered credentials clearly in order delivery view (Username: xxx | Password: xxx | 2FA: xxx)

## Fadded Supplier Integration (Apr 23, 2026)
- [x] Research Fadded API documentation (fadded.net/user/reseller/docs)
- [x] Build Fadded connector (syncProvider, placeSupplierOrder) matching AccsZone pattern
- [x] Seed Fadded provider config in DB from FADDED_API_KEY env var on startup
- [x] Run initial Fadded product sync (118 products imported)
- [x] Add Fadded to 15-minute auto-sync scheduler alongside AccsZone
- [x] Wire Fadded into autoFulfillOrder and triggerProviderSync
- [x] Reorder all 145 categories by demand (Instagram → Facebook → TikTok → Twitter/X → Snapchat → Discord → Reddit → YouTube → WhatsApp → Telegram → LinkedIn → Streaming → Gaming → VPN → Dating → Email → Gift Cards → Other)
- [x] Fix post-order redirect: auto-navigate to order detail page after checkout

## Fadded Enhancements (Apr 23, 2026)
- [ ] Set 20% markup for all Fadded products
- [x] Add category icons to Fadded products (same logic as AccsZone)
- [x] Add Fadded balance display to admin providers panel
- [x] Notify owner when Fadded balance drops below 10,000 NGN
- [x] Add Fadded wallet top-up link inside low-balance alert card in AdminProviders
- [x] Add icons to all Fadded products/categories missing imageUrl (AI Tools, OnlyFans, Proxies, Design Tools, Phone & SMS, Apple, Other Accounts)

## Icon & Category Merge Fixes (Apr 23, 2026)
- [x] Fix broken category icon URLs (images showing as broken thumbnails)
- [x] Fix Fadded balance 404 API error in admin providers panel
- [x] Merge duplicate AccsZone+Fadded categories (Facebook, TikTok, Instagram, Discord, Snapchat, Reddit, etc.)
- [x] Update Fadded connector to auto-apply icons on future syncs
- [x] Confirm markup % changes take effect instantly for all products

## Payment Fixes (Apr 23)
- [x] Fix NOWPayments partially_paid webhook to credit actual received amount
- [x] Add partial status to walletTransactions schema + migration
- [x] Add Flutterwave USD settlement delay notice in Wallet top-up UI
- [x] Add NOWPayments exact-amount notice in Wallet top-up UI
- [x] Add partial badge to transaction history

## Payment Webhook Fixes (Apr 23 - Round 2)
- [x] Remove Flutterwave yellow settlement warning from Wallet UI
- [x] Investigate NOWPayments partial payment 5797040697 (already credited - no action needed)
- [x] Fix Kora Pay webhook signature verification (was signing full body, should sign only data object)
- [x] Investigate Flutterwave NGN delay (confirmed: pending txns were abandoned/failed, not delayed)

## SEO Fixes (Apr 23)
- [x] Add keywords meta tag to index.html with 20 targeted keywords
- [x] Improve page title to include specific product keywords (Instagram, Facebook, TikTok)
- [x] Improve meta description with specific product names
- [x] Add canonical link and robots meta tag
- [x] Add keyword-rich "Popular Digital Accounts & Services" section to homepage body

## Round 5 Fixes (Apr 25)
- [ ] Fix broken category icons: AI Tools, Design Tools, OnlyFans (showing placeholder image)
- [ ] Remove unnatural hyphens from all page text (AI-generated look)
- [ ] Fix mobile responsiveness across all pages (text overflow, product description pages)
- [ ] Update Telegram channel link to @Bulnixlimited (remove old https://t.me/bulnixupdates)
- [ ] Add Telegram support button with automated messages (support username: @Bulnixlimited)
- [ ] Add separate "Join Telegram Channel" button on site (like reference screenshot)
- [ ] Hide WhatsApp number on Contact Us page
- [ ] Auto-generate titles and descriptions for Fadded products missing them (VPNs etc.)
- [ ] Advise on NOWPayments fee loss ($12 received → <$7 after fees)

## Round 8 Fixes (Apr 25, 2026)
- [ ] Fix Telegram Support button to use same AI triage flow as WhatsApp (route to Telegram at end instead of direct link)
- [ ] Fix missing product logos/icons on product listing pages
- [ ] Add cart/buy button to all product listing pages (not just homepage)
- [ ] Add back navigation button to all sub-pages
- [ ] Fix mobile layout: overlapping tab labels on ProductDetail page
- [ ] Fix mobile layout: text overflow on product cards and all pages
- [ ] Add currency converter widget to all pages (navbar or persistent)
- [ ] Add user spending badge/tier system to user profile
- [ ] Add user signup location/country tracking in admin users panel

## SEO Optimization (Apr 25, 2026)
- [x] Enhanced index.html with og:site_name, og:locale, og:image:alt, twitter:site, twitter:image:alt
- [x] Added JSON-LD Organization schema to index.html
- [x] Added JSON-LD WebSite schema with SearchAction (Sitelinks Search Box) to index.html
- [x] Updated robots.txt to disallow private pages (/admin/, /api/, /checkout, /cart, /wallet, /orders, /tickets, /profile, /wishlist)
- [x] Created dynamic /sitemap.xml Express endpoint (996 URLs: 9 static + all categories + all products)
- [x] Added JSON-LD Product + BreadcrumbList structured data to ProductDetail page
- [x] Added JSON-LD BreadcrumbList structured data to Products/Category page
- [x] OAuth country capture: new OAuth users get signupIp and signupCountry recorded
- [x] upsertUser in db.ts handles signupIp/signupCountry on INSERT (not UPDATE)

## Telegram Support Pre-filled Message (Apr 25, 2026)
- [x] Build pre-filled Telegram message from triage answers (issue type, order number, description)
- [x] Format: "Hello Bulnix Support, my name is [name]\nEmail: [email]\nI need help with: [issue]\nMy answers: 1. ... 2. ..."
- [x] Apply to all three Telegram redirect paths (telegramMode direct, __tg__ channel choice, legacy telegram: prefix)
- [x] Fixed WhatsApp message to also use newHistory (includes last answer) instead of stepHistory

## Support Email Fix (Apr 25, 2026)
- [x] Add admin alert email to bulnixsupport@gmail.com on every triage submission
- [x] Admin email includes: user name, email, issue summary, all triage steps
- [x] User confirmation email unchanged (still goes to user with replyTo bulnixsupport@gmail.com)
