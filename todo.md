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
