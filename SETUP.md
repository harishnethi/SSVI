# SSVI — Business App Setup

A mobile app (Android, iPhone and web) for SSVI to manage **customers, inventory, sales orders and invoices**.
All staff share the same data through a free Supabase cloud database.

## What the app does

| Area | Features |
|---|---|
| **Home** | Today's and this month's sales, money still to collect, low-stock count, open orders |
| **Customers** | Add/edit customers with GSTIN and state, view their invoices, orders and balance due, tap to call |
| **Inventory** | Products with SKU, HSN, unit, price and GST %; stock in (purchased/produced) and stock out; full stock history; low-stock alerts |
| **Orders** | Sales orders (SO-0001…) with delivery dates and status: pending → confirmed → dispatched → delivered; turn an order into an invoice with one tap |
| **Invoices** | **GST tax invoices** (INV-0001…) with automatic CGST+SGST, or IGST for other-state customers; **plain bills without tax** (BILL-0001…); separate numbering for each; round-off; amount in words; record cash/UPI/bank/cheque payments; share as PDF on WhatsApp/email; cancel an invoice (stock goes back) |
| **Settings** | Business name, address, GSTIN, state, bank details and terms printed on every invoice |

Saving an invoice reduces stock automatically.

---

## Step 1: Create the Supabase database (one time, about 5 minutes)

1. Go to <https://supabase.com>, sign up for free, and click **New project**. Pick the **Mumbai (ap-south-1)** region.
2. When it's ready, open **SQL Editor → New query**, paste the whole content of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   You should see "Success. No rows returned".
3. Open **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up".
   Now only people you add can use the app.
4. Open **Authentication → Users → Add user → Create new user** and add an email and password for yourself and for each staff member.
   Tick **Auto Confirm User**.
5. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

## Step 2: Connect the app

In this folder, copy `.env.example` to `.env` and paste in your two values:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Step 3: Run it

```bash
npm start
```

- **On your phone:** install **Expo Go** from the Play Store or App Store, then scan the QR code shown in the terminal. Your phone and computer must be on the same Wi-Fi.
- **In a browser:** press `w` in the terminal.

Sign in, open **Home → ⚙ settings**, and fill in your business details and **state**. The state is used to decide between CGST+SGST and IGST.

## Step 4: Install it on staff phones (when you're ready)

Build a real Android app (APK) in the cloud with Expo's free EAS service:

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest build -p android --profile preview
```

The first time, it asks to create `eas.json`. Answer yes, and set `"buildType": "apk"` under the `preview` profile so you get an installable APK file.
When the build finishes you get a download link to share with your staff.
Put your Supabase values in EAS environment variables (`npx eas-cli@latest env:create`) so the build includes them.

---

## Project layout

```
supabase/schema.sql      Database tables, security rules, and invoice/order/stock logic
src/app/                 Screens (Expo Router: each file is a screen)
  (tabs)/                Home, Orders, Invoices, Inventory, Customers tabs
  customer/ product/ order/ invoice/   Detail and form screens
  settings.tsx, login.tsx
src/components/          Shared UI (buttons, fields, pickers, item editor)
src/lib/                 Supabase client, auth, formatting, GST calculation, invoice PDF template
```

## Notes

- Invoice and order numbers are generated in the database, so two staff can never get the same number.
- Dates are typed as `YYYY-MM-DD`. Today's date is filled in for you.
- Stock is allowed to go below zero. The invoice form warns when there isn't enough.
- Any signed-in staff member can see and change all data. Ask if you need roles (for example, staff can't delete).
