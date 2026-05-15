# UDHAARI App - End-to-End Testing Guide

## ✅ Completed in This Session

### Core Fixes Applied:

1. **AssetDetailPage** - Fixed loading issue (removed problematic ReviewsPage import)
2. **ChatPage** - Added URL parameter support for direct conversation opening
3. **Calendar** - Integrated across AssetDetailPage, PostRequestPage, EditRequestPage
4. **WalletDashboard** - Redesigned with top-up requests and loan requests (replaces payment by booking)
5. **AdminMessagesPage** - Created view for all conversations across platform
6. **AdminDisputesPage** - Created view for all disputes with resolution status tracking

### Build Status:

✓ **2317 modules compiled successfully**
✓ **1,275.37 kB final size (333.79 kB gzipped)**
✓ **0 errors, 708ms build time**

---

## 🧪 End-to-End Test Scenarios

### **Scenario 1: Lender Journey (Post Asset & Accept Booking)**

**Path:** Asset Listing → Browse My Assets → Add Asset → Receive Booking → Accept & Chat → Get Paid

**Steps:**

1. Login as Lender (email: lender@example.com)
2. Go to `/my-assets` → Click "Add Asset"
3. Fill in: Title, Description, Category, Daily Rate (Rs. 500), Location
4. Use Calendar picker to select available dates (NOT native date input)
5. Upload image and submit
6. Asset appears in `/browse`
7. Switch to Borrower account or open another browser
8. Browse assets and click on your new asset
9. Click "Request Booking" with Calendar date selection
10. ✅ **VERIFY**: Date picker works smoothly, no broken page load
11. Go back to Lender, check `/bookings`
12. Click "Messages" button on pending booking
13. ✅ **VERIFY**: Chat opens DIRECTLY to that conversation (not general messages)
14. Send test message "Hello, ready to lend this item"
15. Switch to Borrower, verify message received in real-time
16. Accept booking, verify status updates

---

### **Scenario 2: Borrower Journey (Post Request & Receive Offers)**

**Path:** Post Request → Browse Offers → Accept Best Offer → Pay

**Steps:**

1. Login as Borrower
2. Click "Post Request"
3. Fill in: Item needed, Description, Budget, Location
4. Use Calendar for start/end dates
5. ✅ **VERIFY**: Calendar appears, can select date range
6. Submit request
7. View at `/my-requests`
8. Wait for lenders to make offers (or have pre-made test offers)
9. Click "View Offers" → Browse offer stack (Tinder-style)
10. Swipe/tap to accept best offer
11. ✅ **VERIFY**: Offer stack UI works, accept/reject animations smooth
12. Check `/wallet` to verify current balance
13. ✅ **VERIFY**: Wallet shows balance, "Top-up Wallet" button visible
14. (Optional) Click "Top-up Wallet" → enter amount → submit
15. ✅ **VERIFY**: Modal appears, submission works without errors

---

### **Scenario 3: Messaging Flow (Direct Conversation Opening)**

**Path:** Browse Offers → Messages Button → Direct Conversation

**Prerequisites:**

- Lender has pending booking offer
- Borrower has matching request

**Steps:**

1. Login as Borrower
2. Navigate to `/my-offers` (shows offers received)
3. Click "Messages" button on an offer
4. ✅ **VERIFY**: Chat page opens directly with that conversation selected
5. Verify conversation NOT filtered by all/open/close, but by specific booking
6. Type test message: "When can you deliver?"
7. Switch to Lender tab (or use Incognito for different user)
8. Check `/messages` → verify conversation appears
9. ✅ **VERIFY**: Real-time message delivery (Socket.io working)
10. Both users can type back-and-forth without page refresh

---

### **Scenario 4: Dispute Reporting**

**Path:** MyBookings → Report Dispute → AdminDisputesPage

**Steps:**

1. Login as Borrower with active/past booking
2. Go to `/bookings`
3. Click "Report Dispute" button on booking
4. Fill in:
   - Category: "Damage" / "Dispute" / "Other"
   - Subject: "Item returned damaged"
   - Description: "Scratches on screen"
5. Submit dispute
6. ✅ **VERIFY**: Success message appears
7. Logout, login as Admin
8. Go to `/admin/disputes`
9. ✅ **VERIFY**: Dispute appears in list
10. Click to view details
11. Update status: "In Review" → "Resolved"
12. Add admin notes: "Approved Rs. 200 compensation"
13. Save
14. ✅ **VERIFY**: Dispute status updates, notes saved

---

### **Scenario 5: Wallet & Loan Requests**

**Path:** Wallet → Request Loan/Top-up → Admin Review

**Steps:**

1. Login as Borrower
2. Go to `/wallet`
3. Check current balance
4. Click "Request Loan"
5. Fill: Amount (Rs. 2000), Reason ("Need funds for inventory")
6. Submit
7. ✅ **VERIFY**: Modal closes, success message appears
8. Refresh page, verify loan request shows in pending loans list
9. Logout, login as Admin
10. Go to `/admin` dashboard
11. Look for wallet/loan management section
12. ✅ **VERIFY**: Can view pending loan requests, approve/reject
13. (If backend ready) Approve loan, verify funds added to borrower wallet
14. Borrower receives notification of approval

---

### **Scenario 6: Payment & Booking Completion**

**Path:** Accept Booking → Pay → Receive Confirmation → Review

**Steps:**

1. Login as Borrower
2. Go to `/bookings` → "Active Bookings"
3. Click on accepted booking
4. ✅ **VERIFY**: Booking details load correctly with dates from Calendar
5. Click "Pay Now" or "Mark as Complete"
6. If payment required:
   - (Original design) Enter payment method
   - (New design) Top-up wallet first if needed
7. Complete payment
8. ✅ **VERIFY**: Payment receipt page works
9. After return, click "Leave Review"
10. Fill rating (1-5) and review comment
11. Submit
12. Go to profile → verify review appears under borrower's profile
13. Lender can also leave counter-review

---

### **Scenario 7: Admin Panel Access**

**Path:** Admin Login → Dashboard → Views

**Steps:**

1. Login with admin credentials
2. Go to `/admin`
3. ✅ **VERIFY**: Dashboard loads with summary stats
4. Browse tabs: Users, Assets, Requests, Bookings, Categories, Reviews, Transactions
5. Test filtering/searching on Users table
6. Click on "Messages" link (if added)
7. ✅ **VERIFY**: AdminMessagesPage loads, shows conversation list
8. Select a conversation, view message history
9. Go back to Admin
10. Click on "Disputes" link
11. ✅ **VERIFY**: AdminDisputesPage loads, shows all disputes
12. Select dispute, verify can update status and add notes

---

## 🔍 Critical Verification Points

### **Build & Deployment**

- [ ] Frontend builds without errors: `npm run build`
- [ ] No console errors in dev tools (F12)
- [ ] No "failed to fetch" errors for API calls
- [ ] Socket.io shows "CONNECTED" in console

### **Calendar Integration**

- [ ] Calendar picker appears on: PostRequestPage, EditRequestPage, AssetDetailPage
- [ ] Can select date range
- [ ] Selected dates persist when form submitted
- [ ] Date format consistent (YYYY-MM-DD)

### **Chat & Messaging**

- [ ] ChatPage loads without errors
- [ ] URL param `?booking={id}` auto-selects conversation
- [ ] Messages send and receive in real-time
- [ ] Timestamps display correctly
- [ ] User avatars show
- [ ] "ONLINE" status shows correctly

### **Wallet System**

- [ ] Wallet page loads with current balance
- [ ] "Top-up Wallet" modal works
- [ ] "Request Loan" modal works with description field
- [ ] Minimum/maximum validation works (Rs. 100-10,000 for loan)
- [ ] Modal closes after submit
- [ ] Success message appears

### **Admin Views**

- [ ] AdminDashboard accessible only by admins
- [ ] AdminMessagesPage loads (placeholder ok if backend not ready)
- [ ] AdminDisputesPage loads, can update status
- [ ] All pages use consistent burgundy/saffron color scheme

### **Error Handling**

- [ ] Logout and try to access protected routes → redirects to `/auth`
- [ ] Try to access admin pages as regular user → redirects to `/`
- [ ] Fill form with invalid data → error message shows
- [ ] Network error → error message shows (not blank page)

---

## 🚀 Performance Checklist

- [ ] Initial page load: < 3 seconds
- [ ] Asset detail page: < 2 seconds
- [ ] Chat message send: < 1 second
- [ ] No layout shifts (CLS)
- [ ] Responsive on mobile (test in DevTools device emulation)

---

## 📋 Known Limitations & Future Work

### **Currently Placeholder:**

- Admin messages view (backend endpoints needed)
- Admin disputes view (backend endpoints partially ready)
- Maps integration (MapView component exists but not fully connected)
- Loan approval workflow (needs backend implementation)

### **Backend Endpoints Needed:**

- `POST /wallet/top-up` - Submit top-up request
- `POST /wallet/request-loan` - Submit loan request
- `GET /wallet/loan-requests` - Get pending loan requests
- `PUT /admin/disputes/{id}` - Update dispute status
- `GET /admin/messages/conversations` - All conversations
- `GET /admin/messages/bookings/{id}` - Messages for booking

---

## 📝 Test Results Template

**Tester Name:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Build Version:** 2317 modules

### Scenario Results:

- [ ] Scenario 1: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 2: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 3: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 4: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 5: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 6: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******
- [ ] Scenario 7: ✓ Pass / ✗ Fail - Notes: ******\_\_\_******

### Critical Issues Found:

1. ***
2. ***
3. ***

### Recommendations:

- ***
- ***
- ***

---

## 🎯 Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Implement missing backend endpoints** as discovered
3. **Verify database** contains test data for scenarios
4. **Stress test** with multiple concurrent users
5. **Security audit** for authentication/authorization
6. **Deploy to staging** environment
7. **User acceptance testing** with real users
