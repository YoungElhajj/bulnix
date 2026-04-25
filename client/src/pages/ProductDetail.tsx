import Navbar from "@/components/Navbar";
import DOMPurify from "dompurify";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  Package, ShoppingCart, Shield, Zap, ChevronRight, Minus, Plus,
  CheckCircle, Info, LogIn, Truck, RefreshCw, Star, Heart, AlertTriangle,
  ExternalLink, Copy, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Tab = "description" | "how-to-login" | "delivery" | "refund";

// Detect platform from product title and return login instructions
function getLoginInstructions(title: string): {
  platform: string;
  loginUrl: string;
  steps: { title: string; detail: string }[];
  tips: string[];
  warnings: string[];
} | null {
  const t = title.toLowerCase();

  if (t.includes("instagram") || t.includes("ig account")) {
    return {
      platform: "Instagram",
      loginUrl: "https://www.instagram.com/accounts/login/",
      steps: [
        { title: "Open Instagram Login", detail: "Go to instagram.com/accounts/login/ on your browser, or open the Instagram app on your phone." },
        { title: "Enter the Credentials", detail: "In the 'Username, email or phone' field, enter the email address or username provided in your order. Enter the password in the password field." },
        { title: "Handle 2FA / Verification", detail: "If Instagram asks for a verification code, check the email inbox associated with the account. The email credentials are included in your order details. Log into that email to retrieve the code." },
        { title: "Change the Password", detail: "Once logged in, go to Settings → Account → Change Password and set a new strong password immediately. This secures the account as yours." },
        { title: "Update Recovery Email (Optional)", detail: "Go to Settings → Account → Personal Information and add your own email as the recovery address. This prevents lockout." },
        { title: "Disable Suspicious Login Alerts", detail: "If Instagram shows a 'Suspicious Login' warning, tap 'This Was Me' to confirm the login and dismiss the alert." },
      ],
      tips: [
        "Use a VPN matching the account's original country if login is blocked.",
        "Do not immediately follow hundreds of accounts. Warm up the account gradually over the first few days.",
        "Avoid logging in from multiple devices on the same day.",
        "Profile photo and bio changes should be made gradually over a few days.",
      ],
      warnings: [
        "Do not share the account credentials with others",
        "Do not use automation tools or bots immediately after login",
        "Contact Bulnix support via WhatsApp or the live chat within 24 hours if the credentials are invalid",
      ],
    };
  }

  if (t.includes("facebook") || t.includes("fb account")) {
    return {
      platform: "Facebook",
      loginUrl: "https://www.facebook.com/login/",
      steps: [
        { title: "Open Facebook Login", detail: "Go to facebook.com/login/ on your browser or open the Facebook app. Do not use a browser that is already logged into another Facebook account." },
        { title: "Enter Email and Password", detail: "Enter the email address and password provided in your order details. Click 'Log In'." },
        { title: "Complete Identity Verification", detail: "Facebook may show a 'Confirm Your Identity' screen. Select 'Confirm via Email', then log into the email account provided in your order to retrieve the code." },
        { title: "Skip Phone Verification (if prompted)", detail: "If Facebook asks for a phone number, tap 'Skip' or 'Not Now'. Do not add your personal phone number yet." },
        { title: "Change Password", detail: "Go to Settings & Privacy → Settings → Security and Login → Change Password. Set a new strong password." },
        { title: "Add Your Email (Optional)", detail: "In Settings → General Account Settings, add your own email as a secondary contact so you can recover the account." },
      ],
      tips: [
        "Use a VPN set to the account's original country for the first login.",
        "Avoid posting or liking content immediately. Wait 24 to 48 hours before engaging.",
        "Business Manager accounts: verify the BM is active before making any changes.",
        "If the account has 2FA enabled, the TOTP secret or backup codes are included in your order.",
      ],
      warnings: [
        "Do not add your personal phone number as the primary contact immediately",
        "Do not run Facebook Ads within the first 48 hours of taking ownership",
        "Report any issues to Bulnix support within 24 hours of purchase for warranty coverage",
      ],
    };
  }

  if (t.includes("twitter") || t.includes("x account") || t.includes("tweet")) {
    return {
      platform: "Twitter / X",
      loginUrl: "https://x.com/i/flow/login",
      steps: [
        { title: "Open X (Twitter) Login", detail: "Go to x.com/i/flow/login in your browser. Use a fresh browser session or incognito mode." },
        { title: "Enter Username or Email", detail: "Enter the username (without @) or email address provided in your order. Click 'Next'." },
        { title: "Enter Password", detail: "Enter the password from your order details. Click 'Log in'." },
        { title: "Handle Email Verification", detail: "If X asks to verify via email, log into the email account provided in your order and retrieve the verification code." },
        { title: "Change Password Immediately", detail: "Go to Settings → Security and Account Access → Security → Change Password. Set a new strong password." },
        { title: "Update Email (Optional)", detail: "In Settings → Your Account → Account Information → Email, add your own email address for account recovery." },
      ],
      tips: [
        "Use a VPN matching the account's original country for first login",
        "Do not tweet or retweet immediately. Wait 24 hours to avoid suspension",
        "Aged accounts with followers are more valuable. Treat them carefully.",
        "If the account is monetised, do not change the payout details immediately.",
      ],
      warnings: [
        "X (Twitter) may lock the account if it detects a new device login. Have the email ready for verification",
        "Do not use third-party apps or automation tools on the first day",
        "Contact Bulnix support within 24 hours if you cannot log in",
      ],
    };
  }

  if (t.includes("tiktok")) {
    return {
      platform: "TikTok",
      loginUrl: "https://www.tiktok.com/login/",
      steps: [
        { title: "Open TikTok Login", detail: "Go to tiktok.com/login on your browser or open the TikTok app. Choose 'Log in with Email or Phone'." },
        { title: "Enter Email and Password", detail: "Enter the email and password from your order. If the account uses a phone number, the number is included in your order details." },
        { title: "Verify via Email", detail: "TikTok will send a verification code to the account email. Log into the provided email to retrieve it." },
        { title: "Change Password", detail: "Go to Profile → Menu (☰) → Settings and Privacy → Security → Password. Set a new password." },
        { title: "Update Recovery Info", detail: "Add your own email or phone number as a backup in Settings → Security → Manage Account." },
      ],
      tips: [
        "Post content gradually. Avoid uploading many videos in the first 24 hours",
        "Use a VPN matching the account's original region if login fails",
        "Creator accounts may have linked payment info. Check before making any changes.",
      ],
      warnings: [
        "Do not change the username immediately on high-follower accounts",
        "Contact Bulnix support within 24 hours if credentials are invalid",
      ],
    };
  }

  if (t.includes("youtube") || t.includes("yt ")) {
    return {
      platform: "YouTube / Google",
      loginUrl: "https://accounts.google.com/",
      steps: [
        { title: "Open Google Login", detail: "Go to accounts.google.com and click 'Sign in'. YouTube uses Google accounts." },
        { title: "Enter Email and Password", detail: "Enter the Gmail address and password provided in your order." },
        { title: "Handle 2-Step Verification", detail: "If 2FA is enabled, a code will be sent to the backup email or phone. The backup credentials are included in your order." },
        { title: "Change Password", detail: "Go to myaccount.google.com → Security → Password. Set a new strong password." },
        { title: "Add Recovery Email", detail: "In Google Account → Security → Recovery Email, add your own email address." },
        { title: "Access YouTube Channel", detail: "Go to youtube.com and click your profile icon. Select the channel from the account switcher." },
      ],
      tips: [
        "Monetised channels: do not change the AdSense payout details immediately.",
        "Avoid mass-deleting or uploading videos in the first 48 hours.",
        "Enable 2FA with your own authenticator app after securing the account",
      ],
      warnings: [
        "Google may require phone verification on new device logins. Have the backup phone ready",
        "Do not violate YouTube's Terms of Service or the channel may be terminated",
        "Contact Bulnix support within 24 hours if you cannot access the account",
      ],
    };
  }

  if (t.includes("spotify")) {
    return {
      platform: "Spotify",
      loginUrl: "https://accounts.spotify.com/login",
      steps: [
        { title: "Open Spotify Login", detail: "Go to accounts.spotify.com/login or open the Spotify app. Click 'Log in with Email'." },
        { title: "Enter Credentials", detail: "Enter the email and password from your order details." },
        { title: "Verify Email if Prompted", detail: "Log into the provided email account to retrieve any verification code Spotify sends." },
        { title: "Change Password", detail: "Go to Account Overview → Change Password. Set a new strong password." },
        { title: "Update Email", detail: "In Account Overview → Edit Profile, update the email to your own address." },
      ],
      tips: [
        "Premium accounts: check the subscription expiry date in Account Overview.",
        "Do not log in from more devices than the plan allows at the same time.",
        "Family or Duo plans: do not change the plan owner details immediately.",
      ],
      warnings: [
        "Sharing Premium accounts violates Spotify's Terms of Service",
        "Contact Bulnix support within 24 hours if the account is not Premium as advertised",
      ],
    };
  }

  if (t.includes("netflix")) {
    return {
      platform: "Netflix",
      loginUrl: "https://www.netflix.com/login",
      steps: [
        { title: "Open Netflix Login", detail: "Go to netflix.com/login on your browser or open the Netflix app." },
        { title: "Enter Email and Password", detail: "Enter the email and password from your order details." },
        { title: "Select Your Profile", detail: "Netflix accounts have multiple profiles. Use the profile assigned to you (usually listed in your order)." },
        { title: "Set a Profile PIN (Optional)", detail: "Go to Account → Profile & Parental Controls → your profile → Profile Lock to set a PIN for your profile." },
        { title: "Change Password (if full account access)", detail: "If you have full account access, go to Account → Change Password and set a new password." },
      ],
      tips: [
        "Do not change the account email or password if it is a shared or profile-only account.",
        "Check the plan type (Standard, Premium) in Account → Plan Details",
        "Download content for offline viewing using the Netflix app",
      ],
      warnings: [
        "Do not sign out other devices if it is a shared account",
        "Netflix is cracking down on password sharing. Use the account from the correct region.",
        "Contact Bulnix support within 24 hours if the account is not accessible",
      ],
    };
  }

  if (t.includes("discord")) {
    return {
      platform: "Discord",
      loginUrl: "https://discord.com/login",
      steps: [
        { title: "Open Discord Login", detail: "Go to discord.com/login on your browser or open the Discord app." },
        { title: "Enter Email and Password", detail: "Enter the email and password from your order details." },
        { title: "Verify via Email", detail: "Discord may send a verification link to the account email. Log into the provided email to click the verification link." },
        { title: "Change Password", detail: "Go to User Settings (⚙️) → My Account → Change Password. Set a new strong password." },
        { title: "Update Email", detail: "In User Settings → My Account, update the email to your own address." },
        { title: "Enable 2FA", detail: "Go to User Settings → My Account → Two-Factor Authentication and enable it with your own authenticator app." },
      ],
      tips: [
        "Aged accounts with Nitro or rare badges are more valuable. Do not waste them",
        "Server ownership can be transferred to your main account after securing access",
        "Check if the account has any active bans before purchasing",
      ],
      warnings: [
        "Do not use the account for spam or self-botting as it will be banned",
        "Contact Bulnix support within 24 hours if you cannot log in",
      ],
    };
  }

  if (t.includes("amazon") || t.includes("prime video") || t.includes("prime")) {
    return {
      platform: "Amazon Prime",
      loginUrl: "https://www.amazon.com/ap/signin",
      steps: [
        { title: "Open Amazon Login", detail: "Go to amazon.com (or amazon.co.uk for UK accounts) and click 'Sign in'. Use a fresh browser session or incognito mode." },
        { title: "Enter Email and Password", detail: "Enter the email address and password from your Bulnix order details. Click 'Sign in'." },
        { title: "Handle OTP Verification", detail: "Amazon may send a one-time code to the account email. Log into the email account provided in your order to retrieve the code." },
        { title: "Change Password", detail: "Go to Account & Lists → Account → Login & Security → Password → Edit. Set a new strong password." },
        { title: "Update Recovery Email", detail: "In Login & Security, add your own email as a secondary address for account recovery." },
        { title: "Access Prime Video", detail: "Go to primevideo.com or open the Prime Video app. Sign in with the same Amazon credentials." },
      ],
      tips: [
        "Prime membership: check the renewal date in Account → Prime Membership",
        "Do not place orders on the account immediately. Secure it first",
        "Saved payment methods belong to the original owner. Do not use them",
      ],
      warnings: [
        "Do not use saved payment cards or gift card balances on the account",
        "Do not change the account's country/region immediately",
        "Contact Bulnix support within 24 hours if access is denied",
      ],
    };
  }

  if (t.includes("canva")) {
    return {
      platform: "Canva",
      loginUrl: "https://www.canva.com/login",
      steps: [
        { title: "Open Canva Login", detail: "Go to canva.com/login in your browser. Choose 'Continue with email'." },
        { title: "Enter Email and Password", detail: "Enter the email and password from your Bulnix order details." },
        { title: "Verify via Email if Prompted", detail: "Canva may send a magic link or OTP to the account email. Log into the provided email to complete verification." },
        { title: "Change Password", detail: "Go to Account Settings → Security → Change Password. Set a new strong password." },
        { title: "Update Account Email", detail: "In Account Settings → Account, update the email to your own address." },
        { title: "Check Plan Type", detail: "Go to Account Settings → Billing & Plans to confirm whether the account has Canva Pro, Teams, or Free." },
      ],
      tips: [
        "Canva Pro: check the subscription renewal date in Billing & Plans",
        "All your designs are saved to the account. Do not delete existing designs",
        "You can invite team members after securing the account",
      ],
      warnings: [
        "Do not cancel the Pro subscription immediately. Verify it is active first",
        "Contact Bulnix support within 24 hours if the account is not Pro as advertised",
      ],
    };
  }

  if (t.includes("microsoft") || t.includes("office 365") || t.includes("office365") || t.includes("ms office") || t.includes("xbox")) {
    return {
      platform: "Microsoft / Office 365",
      loginUrl: "https://login.microsoftonline.com/",
      steps: [
        { title: "Open Microsoft Login", detail: "Go to login.microsoftonline.com or account.microsoft.com in your browser. Use a fresh browser session." },
        { title: "Enter Email and Password", detail: "Enter the Microsoft account email and password from your Bulnix order details." },
        { title: "Handle 2-Step Verification", detail: "Microsoft may send a code to the backup email or phone. The backup credentials are included in your order." },
        { title: "Change Password", detail: "Go to account.microsoft.com → Security → Change Password. Set a new strong password." },
        { title: "Update Recovery Info", detail: "In Security → Advanced Security Options, add your own email or phone as a recovery contact." },
        { title: "Install Office Apps", detail: "For Office 365 accounts, go to office.com → Install Office to download Word, Excel, PowerPoint, and other apps." },
      ],
      tips: [
        "Office 365: check the subscription status at account.microsoft.com → Services & Subscriptions",
        "You can install Office on up to 5 devices with a personal Microsoft 365 subscription",
        "Xbox accounts: check for any active Game Pass subscriptions",
      ],
      warnings: [
        "Do not use any stored payment methods on the account",
        "Contact Bulnix support within 24 hours if the subscription is not active as advertised",
      ],
    };
  }

  if (t.includes("duolingo")) {
    return {
      platform: "Duolingo",
      loginUrl: "https://www.duolingo.com/login",
      steps: [
        { title: "Open Duolingo Login", detail: "Go to duolingo.com/login or open the Duolingo app. Choose 'I already have an account'." },
        { title: "Enter Email and Password", detail: "Enter the email and password from your Bulnix order details." },
        { title: "Change Password", detail: "Go to Profile → Settings → Account → Change Password. Set a new password." },
        { title: "Update Email", detail: "In Settings → Account, update the email to your own address." },
        { title: "Check Super Duolingo Status", detail: "In Settings → Super Duolingo, verify the subscription is active and check the renewal date." },
      ],
      tips: [
        "Super Duolingo: check the streak and XP. Do not reset them.",
        "Leagues and achievements are tied to the account. Preserve them",
      ],
      warnings: [
        "Contact Bulnix support within 24 hours if Super Duolingo is not active as advertised",
      ],
    };
  }

  if (t.includes("vpn") || t.includes("nordvpn") || t.includes("expressvpn") || t.includes("surfshark") || t.includes("ipvanish") || t.includes("hma vpn") || t.includes("purevpn") || t.includes("cyberghost") || t.includes("protonvpn") || t.includes("pia vpn")) {
    return {
      platform: "VPN Service",
      loginUrl: "",
      steps: [
        { title: "Download the VPN App", detail: "Go to the official website of the VPN service (e.g., nordvpn.com, expressvpn.com, surfshark.com, ipvanish.com) and download the app for your device (Windows, Mac, Android, or iOS)." },
        { title: "Open the App and Log In", detail: "Open the app and choose Log In. Enter the email and password from your Bulnix order details exactly as provided. Copy and paste to avoid typos." },
        { title: "Verify via Email if Prompted", detail: "If the VPN app asks for a verification code, log into the email account provided in your order to retrieve it." },
        { title: "Connect to a Server", detail: "Once logged in, select a server location and click Connect. Your internet traffic is now encrypted and protected." },
        { title: "Check Subscription Status", detail: "In the app, go to Account to confirm your plan is active and check the expiry date." },
      ],
      tips: [
        "Check the subscription expiry date in Account after logging in",
        "You can use the VPN on multiple devices simultaneously (check your plan's device limit)",
        "Use the fastest server for general browsing, or a specific country server for geo-restricted content",
        "This is a shared premium account. Do not change the login credentials so the subscription can be renewed",
      ],
      warnings: [
        "Do NOT change the account email or password. Changing login details will prevent renewal and affect other users",
        "Do not add or change payment methods on the account",
        "Contact Bulnix support within 24 hours if the subscription is not active as advertised",
      ],
    };
  }

  if (t.includes("gaming") || t.includes("steam") || t.includes("pubg") || t.includes("valorant") || t.includes("fortnite") || t.includes("roblox") || t.includes("minecraft") || t.includes("gta") || t.includes("cod") || t.includes("call of duty") || t.includes("battlenet") || t.includes("battle.net") || t.includes("epic games") || t.includes("playstation") || t.includes("psn")) {
    return {
      platform: "Gaming Account",
      loginUrl: "",
      steps: [
        { title: "Retrieve Your Credentials", detail: "After your order is fulfilled, go to My Orders → Order Details on Bulnix to find your login email and password." },
        { title: "Open the Platform Login", detail: "Go to the official platform website (e.g., store.steampowered.com, epicgames.com, account.activision.com) or open the game launcher." },
        { title: "Enter Email and Password", detail: "Enter the credentials exactly as shown in your order. Copy-paste to avoid typos." },
        { title: "Handle 2FA / Guard", detail: "If the platform uses 2FA (e.g., Steam Guard), the backup codes or authenticator details are included in your order." },
        { title: "Change Password Immediately", detail: "Go to Account Settings → Security → Change Password. Set a new strong password." },
        { title: "Update Recovery Email", detail: "Add your own email address as the recovery contact in Account Settings." },
      ],
      tips: [
        "Check the account's rank, level, and inventory before making any changes.",
        "Do not trade or sell in-game items immediately. Wait 24 to 48 hours first.",
        "Steam: enable Steam Guard with your own authenticator app after securing the account.",
      ],
      warnings: [
        "Do not use cheats or hacks as the account will be permanently banned",
        "Do not make purchases using stored payment methods on the account",
        "Contact Bulnix support within 24 hours if you cannot log in",
      ],
    };
  }

  // Generic fallback for any digital account
  return {
    platform: "Your Account",
    loginUrl: "",
    steps: [
      { title: "Retrieve Your Credentials", detail: "After your order is fulfilled, go to My Orders → Order Details. Your login credentials (email, username, and password) are displayed there." },
      { title: "Visit the Service Website", detail: "Open the official website or app for the service you purchased. Do not use unofficial third-party sites." },
      { title: "Enter Your Credentials", detail: "Enter the email/username and password exactly as shown in your order. Copy-paste to avoid typos." },
      { title: "Complete Verification", detail: "If the service asks for email verification, log into the email account provided in your order to retrieve the code." },
      { title: "Change Password Immediately", detail: "Once logged in, go to the account settings and change the password to something only you know." },
      { title: "Add Your Own Recovery Info", detail: "Add your own email address or phone number as a recovery contact to prevent future lockout." },
    ],
    tips: [
      "Use a VPN if login is blocked from your country",
      "Change the password immediately after first login",
      "Save your new credentials in a password manager",
      "Contact Bulnix support via WhatsApp or live chat within 24 hours if there are any issues",
    ],
    warnings: [
      "Do not share your credentials with others",
      "Do not log in from multiple devices simultaneously on the first day",
      "Contact Bulnix support within 24 hours if credentials do not work. Issues reported after 24 hours may not be covered under warranty",
    ],
  };
}

// Get product-specific description features, delivery format, and important notes
function getProductInfo(title: string): {
  features: string[];
  deliveryFormat: string;
  importantNotes: string[];
} {
  const t = title.toLowerCase();

  if (t.includes("instagram") || t.includes("ig account")) {
    const hasFollowers = t.match(/(\d+)\+?\s*follower/);
    const followerCount = hasFollowers ? hasFollowers[1] : "100+";
    const has2FA = t.includes("2fa");
    const hasEmail = t.includes("email");
    const isAged = t.includes("aged") || t.includes("old");
    const hasAvatar = t.includes("avatar") || t.includes("posts");
    return {
      features: [
        `${followerCount}+ followers added to the account`,
        ...(hasEmail ? ["Email verified with full email access (email address + email password included)"] : []),
        ...(has2FA ? ["2FA enabled. 2FA key and backup codes are included in delivery"] : []),
        ...(isAged ? ["Aged account created before 2024 for higher trust score"] : []),
        ...(hasAvatar ? ["Profile fully set up with avatar and posts"] : []),
        "Registered using a US IP/proxy for location consistency",
        "Phone number added to the account",
      ],
      deliveryFormat: has2FA && hasEmail
        ? "Instagram Username : Password : Email : Email Password : 2FA Key"
        : hasEmail
        ? "Instagram Username : Password : Email : Email Password"
        : "Instagram Username : Password",
      importantNotes: [
        "These are access-based Instagram accounts. The term 'verified' refers to email and phone association during account setup, not Meta blue-badge verification.",
        "We strongly recommend logging in using a US IP (mobile or high-quality residential proxy) to minimise security checks.",
        "If you face a login issue: first confirm you are using a US IP/location, and avoid VPNs, datacenter IPs, or previously flagged devices.",
        "If the issue continues, contact our support team for assistance.",
      ],
    };
  }

  if (t.includes("facebook") || t.includes("fb account")) {
    const hasEmail = t.includes("email");
    const has2FA = t.includes("2fa");
    const hasBM = t.includes("bm") || t.includes("business manager") || t.includes("ads account");
    return {
      features: [
        "100+ followers added to the account",
        "Phone number added to the account",
        ...(hasEmail ? ["Email verified with full email access (email address + email password included)"] : []),
        ...(has2FA ? ["2FA enabled. 2FA key and backup codes are included"] : []),
        ...(hasBM ? ["Business Manager access included"] : []),
        "Profile fully set up with profile picture, cover photo, and basic information",
        "Latin (English) names with realistic profile details",
        "Gender: male or female (random)",
        "Registered using a US IP/proxy for location consistency",
      ],
      deliveryFormat: has2FA && hasEmail
        ? "Facebook Email : Facebook Password : Email Password : 2FA : Facebook ID"
        : hasEmail
        ? "Facebook Email : Facebook Password : Email Password : Facebook ID"
        : "Facebook Email : Facebook Password : Facebook ID",
      importantNotes: [
        "These are access-based Facebook accounts. The term 'verified' refers to email verification and phone number association during account setup, not Meta blue-badge verification.",
        "We strongly recommend logging in using a US IP (mobile or high-quality residential proxy) to minimise security checks.",
        "If you face a login issue: first confirm you are using a US IP/location, and avoid VPNs, datacenter IPs, or previously flagged devices.",
        "Do NOT run Facebook Ads within the first 48 hours of taking ownership.",
      ],
    };
  }

  if (t.includes("twitter") || t.includes("x account") || t.includes("tweet")) {
    const hasEmail = t.includes("email");
    const has2FA = t.includes("2fa");
    return {
      features: [
        "Aged Twitter/X account with established history",
        ...(hasEmail ? ["Full email access included (email address + email password)"] : []),
        ...(has2FA ? ["2FA enabled. Backup codes are included."] : []),
        "Profile set up with username, bio, and profile picture",
        "Registered using a US IP for location consistency",
      ],
      deliveryFormat: hasEmail
        ? "Twitter Username : Password : Email : Email Password"
        : "Twitter Username : Password",
      importantNotes: [
        "Do not tweet or retweet immediately. Wait 24 hours to avoid suspension.",
        "Use a VPN matching the account's original country for first login.",
        "Change the password immediately after first login.",
        "Contact Bulnix support within 24 hours if credentials are invalid.",
      ],
    };
  }

  if (t.includes("tiktok")) {
    const hasEmail = t.includes("email");
    return {
      features: [
        "TikTok account with followers",
        ...(hasEmail ? ["Full email access included (email address + email password)"] : []),
        "Profile set up with username and profile picture",
        "Registered using a US IP for location consistency",
      ],
      deliveryFormat: hasEmail
        ? "TikTok Username : Password : Email : Email Password"
        : "TikTok Username : Password",
      importantNotes: [
        "Use a VPN matching the account's original country for first login.",
        "Do not post content immediately. Warm up the account gradually.",
        "Change the password immediately after first login.",
        "Contact Bulnix support within 24 hours if credentials are invalid.",
      ],
    };
  }

  if (t.includes("youtube") || t.includes("yt ")) {
    const hasEmail = t.includes("email");
    return {
      features: [
        "YouTube channel with subscribers",
        "Full Google account access included",
        ...(hasEmail ? ["Email access included (email address + email password)"] : []),
        "Channel set up with name, description, and profile picture",
      ],
      deliveryFormat: "Google Email : Password : Recovery Email : Recovery Password",
      importantNotes: [
        "Use a VPN matching the account's original country for first login.",
        "Do not upload videos immediately. Wait 24 to 48 hours.",
        "Change the password and add your own recovery email immediately after login.",
        "Contact Bulnix support within 24 hours if credentials are invalid.",
      ],
    };
  }

  if (t.includes("spotify")) {
    return {
      features: [
        "Spotify Premium subscription included",
        "Full account access (email + password)",
        "Ad-free listening, offline downloads, and unlimited skips",
        "Works on all devices (mobile, desktop, web)",
      ],
      deliveryFormat: "Spotify Email : Password",
      importantNotes: [
        "Do not change the email address on the account.",
        "Do not add payment methods to the account.",
        "Contact Bulnix support within 24 hours if the subscription is not active.",
      ],
    };
  }

  if (t.includes("netflix")) {
    return {
      features: [
        "Netflix subscription included (check plan in listing title)",
        "Full account access (email + password)",
        "Works on all devices (TV, mobile, desktop)",
        "HD/4K streaming depending on plan",
      ],
      deliveryFormat: "Netflix Email : Password",
      importantNotes: [
        "Do not change the email address or password on the account.",
        "Do not add payment methods to the account.",
        "Use only the profile slot assigned to you. Do not modify other profiles.",
        "Contact Bulnix support within 24 hours if access is not working.",
      ],
    };
  }

  if (t.includes("discord")) {
    const hasEmail = t.includes("email");
    return {
      features: [
        "Discord account with established history",
        ...(hasEmail ? ["Full email access included"] : []),
        "Profile set up with username and avatar",
        "Aged account for higher trust score",
      ],
      deliveryFormat: hasEmail
        ? "Discord Email : Password : Email Password : Token"
        : "Discord Email : Password : Token",
      importantNotes: [
        "Do not use the account for spam or self-botting as it will be banned.",
        "Change the password immediately after first login.",
        "Contact Bulnix support within 24 hours if credentials are invalid.",
      ],
    };
  }

  if (t.includes("amazon") || t.includes("prime video") || t.includes("prime")) {
    return {
      features: [
        "Amazon Prime subscription included",
        "Full account access (email + password)",
        "Access to Prime Video, Prime Music, and free delivery",
        "Works on all devices",
      ],
      deliveryFormat: "Amazon Email : Password",
      importantNotes: [
        "Do not place orders or use stored payment methods on the account.",
        "Do not change the email address on the account.",
        "Contact Bulnix support within 24 hours if access is not working.",
      ],
    };
  }

  if (t.includes("canva")) {
    return {
      features: [
        "Canva Pro subscription included",
        "Full account access (email + password)",
        "Access to all Pro templates, fonts, and assets",
        "Works on all devices",
      ],
      deliveryFormat: "Canva Email : Password",
      importantNotes: [
        "Do not change the email address on the account.",
        "Contact Bulnix support within 24 hours if access is not working.",
      ],
    };
  }

  if (t.includes("microsoft") || t.includes("office 365") || t.includes("office365") || t.includes("ms office")) {
    return {
      features: [
        "Microsoft 365 / Office subscription included",
        "Full account access (email + password)",
        "Access to Word, Excel, PowerPoint, Teams, and OneDrive",
        "Works on up to 5 devices",
      ],
      deliveryFormat: "Microsoft Email : Password",
      importantNotes: [
        "Do not change the email address on the account.",
        "Do not add payment methods to the account.",
        "Contact Bulnix support within 24 hours if access is not working.",
      ],
    };
  }

  if (t.includes("vpn") || t.includes("nordvpn") || t.includes("expressvpn") || t.includes("surfshark")) {
    return {
      features: [
        "VPN subscription included (check plan in listing title)",
        "Full account access (email + password)",
        "Access to all server locations",
        "Works on multiple devices simultaneously",
      ],
      deliveryFormat: "VPN Email : Password",
      importantNotes: [
        "Do not change the email address on the account.",
        "Do not add payment methods to the account.",
        "Contact Bulnix support within 24 hours if the subscription is not active.",
      ],
    };
  }

  if (t.includes("gaming") || t.includes("steam") || t.includes("pubg") || t.includes("valorant") || t.includes("fortnite") || t.includes("roblox") || t.includes("minecraft") || t.includes("gta") || t.includes("cod") || t.includes("call of duty") || t.includes("battlenet") || t.includes("epic games") || t.includes("playstation") || t.includes("psn")) {
    const has2FA = t.includes("2fa") || t.includes("guard");
    return {
      features: [
        "Gaming account with rank, level, and inventory as described",
        "Full account access (email + password)",
        ...(has2FA ? ["2FA/Guard codes included in delivery"] : []),
        "Account verified and tested before delivery",
      ],
      deliveryFormat: has2FA
        ? "Game Email : Password : 2FA Code : Account ID"
        : "Game Email : Password : Account ID",
      importantNotes: [
        "Do not use cheats or hacks as the account will be permanently banned.",
        "Do not make purchases using stored payment methods on the account.",
        "Check the account's rank, level, and inventory before making any changes.",
        "Contact Bulnix support within 24 hours if you cannot log in.",
      ],
    };
  }

  // Generic fallback
  return {
    features: [
      "100% genuine and verified product",
      "Instant digital delivery to your dashboard",
      "Full account credentials provided",
      "Support available if you encounter any issues",
    ],
    deliveryFormat: "Email / Username : Password",
    importantNotes: [
      "Credentials are valid at the time of delivery.",
      "If login details do not work on arrival, contact support within 24 hours.",
      "Our team will verify the issue and provide a suitable resolution according to our policy.",
    ],
  };
}

// Simple image area — show supplier image as-is on a white background
function ProductImageArea({ product }: { product: any }) {
  return (
    <div className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden border border-border shadow-sm max-h-[480px] w-full bg-white">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain p-8" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-[#0050D0]/30">
          <Package className="h-20 w-20"/>
          <span className="text-sm font-medium text-[#4A6080]">Digital Product</span>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <div className="bg-[#0F3D5E] h-24" />
      <div className="container pt-10 pb-16 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"/>
            <div className="h-6 bg-muted rounded w-1/4"/>
            <div className="h-32 bg-muted rounded"/>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <div className="bg-[#0F3D5E] h-24" />
      <div className="container pt-16 pb-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
          <Package className="h-10 w-10 text-muted-foreground"/>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">This product doesn't exist or may have been removed.</p>
        <Link href="/products">
          <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6">Browse Products</Button>
        </Link>
      </div>
    </div>
  );

  const p = product as any;
  const inStock = p.stockUnlimited || p.stockQuantity > 0;
  const loginInfo = getLoginInstructions(p.title ?? "");

  const handleAdd = () => {
    if (!inStock) { toast.error("Out of stock"); return; }
    for (let i = 0; i < qty; i++) {
      addItem({
        id: p.id, slug: p.slug, title: p.title, imageUrl: p.imageUrl,
        priceUSD: Number(p.customerPriceUSD), providerKey: p.providerKey,
        supplierProductId: p.supplierProductId ? String(p.supplierProductId) : undefined,
        stockQuantity: p.stockQuantity, stockUnlimited: p.stockUnlimited
      });
    }
    toast.success(`${qty}x ${p.title} added to cart`);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "description", label: "Description", icon: Info },
    { id: "how-to-login", label: "How to Login", icon: LogIn },
    { id: "delivery", label: "Delivery Info", icon: Truck },
    { id: "refund", label: "Refund Policy", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-6">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-white/50 flex-wrap">
            <Link href="/" className="hover:text-[#00C2FF] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/products" className="hover:text-[#00C2FF] transition-colors">Products</Link>
            {p.category?.name && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <Link href={`/categories/${p.category.slug ?? ""}`} className="hover:text-[#00C2FF] transition-colors">
                  {p.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-white line-clamp-1">{p.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-10">

          {/* Product Image */}
          <ProductImageArea product={p} />

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {p.isFeatured && (
                <Badge className="bg-[#00C2FF] text-[#0F3D5E] border-0 text-xs font-bold">⭐ Featured</Badge>
              )}
              <Badge className={inStock
                ? "bg-green-500/15 text-green-400 border-green-500/30 text-xs"
                : "bg-red-500/15 text-red-400 border-red-500/30 text-xs"
              }>
                {inStock ? (p.stockUnlimited ? "✓ In Stock" : `✓ ${p.stockQuantity} available`) : "✗ Out of Stock"}
              </Badge>
              {p.category?.name && (
                <Badge className="bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/30 text-xs">
                  {p.category.name}
                </Badge>
              )}
              {p.isDigital && (
                <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs">Digital</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {p.title}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= 4 ? "fill-amber-400 text-amber-400" : "text-muted fill-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.8 (124 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5 p-4 bg-card rounded-xl border border-border">
              <span className="text-4xl font-bold text-[#00C2FF]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ${Number(p.customerPriceUSD).toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm">USD</span>
              {p.customerPriceNGN && (
                <span className="text-muted-foreground text-sm ml-2">≈ ₦{Number(p.customerPriceNGN).toLocaleString()}</span>
              )}
            </div>

            {/* Short description */}
            {(p.shortDescription || p.description) && (
              <p className="text-foreground leading-relaxed mb-5 text-sm">
                {p.shortDescription || (() => {
                  const raw = p.description ?? "";
                  const stripped = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                  return stripped.slice(0, 200) + (stripped.length > 200 ? "..." : "");
                })()}
              </p>
            )}

            {/* Quantity */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-muted-foreground text-sm font-medium shrink-0">Quantity:</span>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  <Minus className="h-4 w-4"/>
                </button>
                <span className="text-foreground font-semibold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(p.stockUnlimited ? 99 : p.stockQuantity, q + 1))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
              <span className="text-muted-foreground text-sm">
                Total: <span className="text-[#00C2FF] font-bold">${(qty * Number(p.customerPriceUSD)).toFixed(2)}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-5">
              <Button
                className="flex-1 h-12 bg-[#00C2FF] hover:bg-[#00aee6] text-[#0F3D5E] font-bold rounded-xl shadow-lg shadow-[#00C2FF]/20 hover:shadow-xl hover:shadow-[#00C2FF]/30 transition-all"
                onClick={handleAdd}
                disabled={!inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2"/> Add to Cart
              </Button>
              <Link href="/cart" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-12 border-border bg-card text-foreground hover:border-[#00C2FF]/50 hover:bg-[#00C2FF]/5 rounded-xl font-semibold transition-all"
                  onClick={handleAdd}
                  disabled={!inStock}
                >
                  Buy Now
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-xl border-border bg-card transition-all ${wishlisted ? "text-red-400 border-red-500/30" : "text-muted-foreground hover:text-red-400 hover:border-red-500/30"}`}
                onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist"); }}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? "fill-red-400" : ""}`} />
              </Button>
            </div>

            {/* Login prompt for guests */}
            {!isAuthenticated && (
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-4 flex items-center gap-3">
                <LogIn className="h-5 w-5 text-blue-400 shrink-0" />
                <p className="text-sm text-blue-300">
                  <a href={getLoginUrl()} className="font-semibold underline">Sign in</a> or{" "}
                  <Link href="/signup" className="font-semibold underline">create an account</Link> to purchase this product.
                </p>
              </div>
            )}

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Zap, text: "Instant Delivery" },
                { icon: Shield, text: "Secure Payment" },
                { icon: Package, text: "Digital Product" },
                { icon: CheckCircle, text: "24/7 Support" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-lg px-3 py-2 border border-border">
                  <f.icon className="h-4 w-4 text-[#00C2FF] shrink-0"/>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[#00C2FF] text-[#00C2FF] bg-[#00C2FF]/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">

            {/* DESCRIPTION TAB */}
            {activeTab === "description" && (() => {
              const productInfo = getProductInfo(p.title);
              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">About This Product</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      <strong className="text-foreground">{p.title}</strong> is a premium digital product available for instant delivery after purchase.
                      This is a verified, high-quality account or service that has been tested and confirmed to work.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      All products on Bulnix are sourced from trusted suppliers and delivered automatically to your account dashboard within minutes of payment confirmation.
                    </p>
                  </div>

                  {/* Feature list */}
                  {p.description ? (
                    (() => {
                      const raw = p.description!;
                      const isHtml = /<[a-z][\s\S]*>/i.test(raw);
                      if (isHtml) {
                        const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['p','br','b','strong','em','i','ul','ol','li','h1','h2','h3','h4','span','div'], ALLOWED_ATTR: [] });
                        return <div className="text-foreground leading-relaxed text-sm prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1" dangerouslySetInnerHTML={{ __html: clean }} />;
                      }
                      return <p className="text-foreground leading-relaxed whitespace-pre-line text-sm">{raw}</p>;
                    })()
                  ) : (
                    <ul className="space-y-2">
                      {productInfo.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-[#00C2FF] mt-0.5 shrink-0" />
                          <span dangerouslySetInnerHTML={{ __html: f.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Delivery format */}
                  <div className="p-4 bg-[#0050D0]/5 rounded-xl border border-[#0050D0]/20">
                    <p className="text-xs font-semibold text-[#0050D0] uppercase tracking-wide mb-1">Delivery Format</p>
                    <p className="text-sm font-mono text-foreground font-semibold break-all">{(p as any).deliveryFormat || productInfo.deliveryFormat}</p>
                    <p className="text-xs text-muted-foreground mt-1">Credentials will be displayed in this format in your order details after purchase.</p>
                  </div>

                  {/* Important notes */}
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Important Notes (Please Read Before Purchase)
                    </p>
                    <ul className="space-y-1.5">
                      {productInfo.importantNotes.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300/80">
                          <span className="shrink-0 mt-0.5">{i === 1 ? '✓' : i === 2 ? '✗' : '•'}</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Delivery & Support summary */}
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-1.5">
                      <Zap className="h-4 w-4" /> Delivery & Support
                    </p>
                    <ul className="space-y-1 text-sm text-green-700 dark:text-green-300/80">
                      <li>• Instant delivery after successful payment</li>
                      <li>• All credentials are delivered automatically to your order dashboard</li>
                      <li>• Support available if you need help verifying or accessing the account</li>
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* HOW TO LOGIN TAB */}
            {activeTab === "how-to-login" && (
              <div>
                {loginInfo ? (
                  <>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        How to Access Your {loginInfo.platform} Account
                      </h3>
                      {loginInfo.loginUrl && (
                        <a
                          href={loginInfo.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-[#00C2FF] hover:underline font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open {loginInfo.platform} Login
                        </a>
                      )}
                    </div>

                    {/* Step-by-step */}
                    <div className="space-y-4 mb-6">
                      {loginInfo.steps.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === loginInfo.steps.length - 1 ? "bg-[#00C2FF] text-[#0F3D5E]" : "bg-[#0050D0] text-white"}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="font-semibold text-foreground mb-1">{step.title}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {loginInfo.tips.length > 0 && (
                      <div className="mb-4 p-4 bg-[#00C2FF]/5 rounded-xl border border-[#00C2FF]/20">
                        <p className="text-sm font-semibold text-[#00C2FF] mb-2 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" /> Pro Tips
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                          {loginInfo.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {loginInfo.warnings.length > 0 && (
                      <div className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <p className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" /> Important Notes
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside">
                          {loginInfo.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback generic steps
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">How to Access Your Product</h3>
                    {[
                      { n: 1, title: "Purchase & Pay", detail: "Add the product to your cart and complete checkout." },
                      { n: 2, title: "Check Your Dashboard", detail: "After payment confirmation, go to My Orders → Order Details to find your credentials." },
                      { n: 3, title: "Use Your Credentials", detail: "Visit the service's official website and log in using the provided email and password." },
                      { n: 4, title: "Change Password (Recommended)", detail: "For security, change the account password immediately after first login." },
                    ].map(s => (
                      <div key={s.n} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#0050D0] text-white flex items-center justify-center text-sm font-bold shrink-0">{s.n}</div>
                        <div>
                          <p className="font-semibold text-foreground mb-1">{s.title}</p>
                          <p className="text-sm text-muted-foreground">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                    <p className="text-sm text-blue-600 mb-3">You need an account to purchase and access products.</p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/signup">
                        <Button size="sm" className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-5">Create Account</Button>
                      </Link>
                      <Link href="/login">
                        <Button size="sm" variant="outline" className="border-[#00C2FF]/40 text-[#00C2FF] rounded-full px-5">Sign In</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DELIVERY TAB */}
            {activeTab === "delivery" && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Delivery Information</h3>
                {p.deliveryNote ? (
                  <div className="p-4 bg-[#00C2FF]/5 rounded-xl border-l-4 border-[#00C2FF] border border-[#00C2FF]/20 mb-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{p.deliveryNote}</p>
                  </div>
                ) : null}
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Zap className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700">Instant Digital Delivery</p>
                      <p className="text-green-800">Your product credentials are delivered automatically to your order dashboard within minutes of payment confirmation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                    <Package className="h-4 w-4 text-[#00C2FF] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">No Physical Shipping</p>
                      <p>This is a digital product. No physical items are shipped. All credentials are delivered electronically.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                    <CheckCircle className="h-4 w-4 text-[#00C2FF] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Order Confirmation</p>
                      <p>You will receive an email confirmation once your order is placed. Check your spam folder if you don't see it.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REFUND TAB */}
            {activeTab === "refund" && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Refund Policy</h3>
                {p.refundPolicy ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-4">{p.refundPolicy}</p>
                ) : null}
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="p-4 bg-card rounded-xl border border-border">
                    <p className="font-semibold text-foreground mb-2">Our Refund Guarantee</p>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Full refund if credentials are invalid or don't work on delivery</li>
                      <li>Replacement provided if account becomes inaccessible within 24 hours</li>
                      <li>No refunds for accounts that worked at delivery but were later suspended due to misuse</li>
                      <li>Refund requests must be submitted within 24 hours of purchase</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-amber-700 font-semibold mb-1">How to Request a Refund</p>
                    <p className="text-amber-800">Open a support ticket from your dashboard with your order ID and a description of the issue. Our team usually responds within 2 to 4 hours.</p>
                  </div>
                  <p>
                    For full details, see our <Link href="/refund" className="text-[#00C2FF] underline">Refund Policy page</Link>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
