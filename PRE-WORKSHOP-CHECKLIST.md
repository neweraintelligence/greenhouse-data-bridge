# Pre-Workshop Test Checklist

**Run this checklist 1 hour before the workshop starts.**

Last Updated: January 2026
Estimated Time: 15-20 minutes

---

## 1. Production Site Health ✅

### Site Availability
- [ ] Navigate to https://greenhouse-data-bridge.onrender.com
- [ ] Confirm landing page loads within 3 seconds
- [ ] Check browser console for errors (F12 → Console tab)
  - ✅ Expected: No red errors
  - ⚠️ If errors appear: Check deployment logs on Render

### Performance
- [ ] Test from both laptop and phone
- [ ] Confirm no infinite loading spinners
- [ ] Images load properly (check /slide-images/)

---

## 2. Session Creation & Login Flow ✅

### Create Demo Session
- [ ] Click **"Start New Session"** on landing page
- [ ] Verify session code appears (format: ABC123 - 6 characters)
- [ ] **Write down session code:** ___________
- [ ] Navigate to `/flowchart` page
- [ ] Confirm flowchart renders with 12 nodes visible

### Identity System
- [ ] Open `/identity?redirect=/flowchart` in new tab
- [ ] Enter test name: **"Demo Facilitator"**
- [ ] Enter role: **"Workshop Host"**
- [ ] Click Continue
- [ ] Verify redirect to flowchart page
- [ ] Check sessionStorage has `user_identity` key

---

## 3. Shipping Use Case - Full Workflow ✅

### Step 1: Select Use Case
- [ ] Click **"Shipping & Receiving"** use case selector
- [ ] Verify 5 source nodes appear in column 1
- [ ] Sources should be: Expected Shipments, BOL Email, Invoice, Barcode Scans, Delivery Receipt

### Step 2: View Source Data (Live Preview)
- [ ] Click **"Live Preview"** on **Expected Shipments** node
- [ ] Verify Excel spreadsheet displays (4-8 rows of data)
- [ ] Check columns: Shipment ID, SKU, Qty, Vendor, Ship Date
- [ ] Click cell and edit quantity → Type new number → Click outside cell
- [ ] ✅ Expected: Cell updates, no errors

### Step 3: BOL Email Node
- [ ] Click **"Live Preview"** on **"BOL Notification Email"** node
- [ ] Verify Outlook-style email list appears (2-3 emails)
- [ ] Click an email to open
- [ ] Confirm email displays sender, subject, body
- [ ] Click **"Reply" button → should show reply textarea
- [ ] Close email modal

### Step 4: Presentation Mode
- [ ] Click **"Present"** button (top-right)
- [ ] Verify full-screen info overlay appears
- [ ] Use arrow keys to navigate: → (next), ← (previous)
- [ ] Hold SPACEBAR → should reveal flowchart behind (peek mode)
- [ ] Release SPACEBAR → overlay returns
- [ ] Navigate through 5-6 slides, check:
  - [ ] Text is readable (no scrolling required)
  - [ ] Images display correctly
  - [ ] No layout issues
- [ ] Press ESC to exit presentation mode

### Step 5: Fetch & Process Data
- [ ] Click **"Fetch Data"** button on **Expected Shipments** node
- [ ] Verify node badge shows item count (e.g., "4 items")
- [ ] Click **"Process"** on **Data Engine - Reconciliation** node
- [ ] Confirm processing animation plays (~3 seconds)
- [ ] After processing:
  - [ ] **Review Queue** node shows count (e.g., "2 discrepancies")
  - [ ] **Escalation Router** may show count (0-1 critical items)
  - [ ] **Reports & Exports** node becomes active

### Step 6: Review Discrepancies
- [ ] Click **"Live Preview"** on **Review Queue** node
- [ ] Verify discrepancy list modal opens
- [ ] Check discrepancy details:
  - [ ] Shipment ID, Expected vs Actual quantities
  - [ ] Confidence score (%)
  - [ ] Recommended action
- [ ] Click **"Approve Adjusted Invoice"** on one discrepancy
- [ ] Verify discrepancy disappears from list
- [ ] Check count decreases by 1

### Step 7: View Communications
- [ ] Click **"Live Preview"** on **Communications Layer** node
- [ ] Verify communications log shows:
  - [ ] Email sent (subject, recipient, timestamp)
  - [ ] Notifications
- [ ] Close modal

---

## 4. Collaborative Features (Mobile) ✅

### QR Code Scanning (Requires Phone)
- [ ] On laptop: Navigate to **Barcode Log** node
- [ ] Click **"Live Preview"** → displays QR code
- [ ] On phone: Scan QR code with camera app
- [ ] Verify phone opens scanner page: `/scan/{sessionCode}`
- [ ] Allow camera permissions if prompted
- [ ] Point phone at printed barcode label (or another QR code)
- [ ] ✅ Expected: Scan registered, toast notification on laptop
- [ ] Check laptop flowchart: **Barcode Log** count increases

### Receipt Signing (Requires Phone)
- [ ] On laptop: Get shipment ID from **Expected Shipments** preview (e.g., "OUT-2025-0001")
- [ ] On phone: Navigate to: `/sign-receipt/{sessionCode}/{shipmentId}`
  - Example: `/sign-receipt/ABC123/OUT-2025-0001`
- [ ] Verify receipt form loads with shipment details
- [ ] Fill in:
  - [ ] Quantity: 48
  - [ ] Condition: "Good condition"
  - [ ] Signature: Draw signature or type name
- [ ] Click **"Submit Receipt"**
- [ ] ✅ Expected: "Receipt Signed!" success message
- [ ] Check laptop: Toast notification appears

---

## 5. Dashboard View ✅

### Navigate to Dashboard
- [ ] Open `/dashboard` in new tab
- [ ] Verify session picker shows your session code
- [ ] Select your session from dropdown

### KPI Cards
- [ ] Confirm 4 KPI cards display:
  - Expected Shipments (count)
  - Received Shipments (count)
  - Discrepancies (count)
  - Escalations (count)
- [ ] Verify counts are **NOT all zeros** (real Supabase data)

### Recent Activity
- [ ] Check "Recent Activity" section shows:
  - [ ] Barcode scans (if you scanned)
  - [ ] Receipt signatures (if you signed)
  - [ ] Communications sent
- [ ] Verify timestamps are recent

---

## 6. Error Handling & Edge Cases ✅

### Missing Session
- [ ] Navigate to `/flowchart` without creating session
- [ ] ✅ Expected: Should redirect to landing OR show error

### Invalid Session Code
- [ ] Try accessing: `/scan/INVALID123`
- [ ] ✅ Expected: Shows error message, not white screen

### Offline Handling
- [ ] Open DevTools → Network tab → Set to "Offline"
- [ ] Try fetching data
- [ ] ✅ Expected: Shows error message, not infinite spinner
- [ ] Set network back to "Online"

### Error Boundary Test
- [ ] In DevTools console, trigger error: `throw new Error('Test error boundary')`
- [ ] ✅ Expected: Friendly error page with "Refresh Page" button
- [ ] Click "Refresh Page" → should reload successfully

---

## 7. Workshop-Specific Prep ✅

### Print Materials
- [ ] Navigate to `/print-labels/{sessionCode}`
- [ ] Verify labels page displays with QR codes
- [ ] Print page (or save as PDF for backup)
- [ ] ✅ Expected: 5-8 product labels with QR codes

### Pre-Create Demo Sessions
- [ ] Create 3 sessions with memorable codes:
  - [ ] WORKSHOP1
  - [ ] WORKSHOP2
  - [ ] WORKSHOP3
- [ ] Write down codes for attendees

### Google Cloud API Limits
- [ ] Log into Google Cloud Console
- [ ] Navigate to Gemini API settings
- [ ] Verify spending limit is set (e.g., $50/day max)
- [ ] Check current usage: Should be < 10% of quota

---

## 8. Final Checks ✅

### Browser Compatibility
- [ ] Test on Chrome (primary)
- [ ] Test on Safari (backup)
- [ ] Test on mobile (iOS or Android)

### Backup Plan
- [ ] Confirm localhost:5173 works (run `npm run dev`)
- [ ] Have USB cable ready for phone tethering (if WiFi fails)
- [ ] Download offline copy: `npm run build` → save dist/ folder

### Accessibility
- [ ] Test with keyboard navigation (Tab, Enter, Arrow keys)
- [ ] Zoom to 150% → verify text readable
- [ ] Turn on screen reader → basic navigation works

---

## Emergency Contacts & Resources

**If Production Fails:**
1. Switch to localhost presentation
2. Use saved PDF of flowchart as static slide deck
3. Demonstrate mobile features using screenshots

**Common Issues:**
- **Infinite loading**: Check Supabase status (status.supabase.com)
- **QR scan not working**: Use manual entry fallback
- **Slow loading**: Clear browser cache (Ctrl+Shift+Del)

**Deployment Check:**
- Render Dashboard: https://dashboard.render.com/static/srv-d5mf9vv5r7bs73d44igg
- Supabase Dashboard: https://supabase.com/dashboard/project/qfwdvhfiogxazvcimetn

---

## Checklist Summary

**Total Items:** 80+
**Estimated Time:** 15-20 minutes
**Required Tools:**
- Laptop with Chrome
- Smartphone with camera
- Printed QR labels
- Workshop attendee count

**Status Key:**
- ✅ Pass
- ⚠️ Warning (note but continue)
- ❌ Fail (must fix before workshop)

---

## Post-Checklist Actions

After completing checklist:
- [ ] Delete test sessions created during testing
- [ ] Clear browser cache on presentation laptop
- [ ] Charge laptop to 100%
- [ ] Charge phone to 100%
- [ ] Bookmark production URL in browser
- [ ] Have backup internet connection ready (phone hotspot)

**You're ready for the workshop! 🎉**
