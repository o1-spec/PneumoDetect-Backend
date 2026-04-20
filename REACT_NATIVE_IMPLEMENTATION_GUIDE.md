# React Native Implementation Checklist

Give this to your React Native team to verify they've implemented everything correctly!

---

## 🎯 IMPLEMENTATION REQUIREMENTS

Your React Native app should implement the following **44 API endpoints**.

Use this checklist to verify:
- ✅ Endpoint exists in your code
- ✅ Correct HTTP method (GET, POST, PUT, DELETE, PATCH)
- ✅ Correct URL path
- ✅ Correct request body (if applicable)
- ✅ Correct request headers (Authorization)
- ✅ Proper error handling
- ✅ Loading states
- ✅ Response parsing

---

## 🔐 AUTHENTICATION (7 endpoints)

### Register
- [ ] **POST** `/auth/register`
- [ ] Body: email, password, name, specialization, phone
- [ ] Response: user object + accessToken
- [ ] Error handling: 400 email exists, validation errors
- [ ] UI: Registration form with all fields
- [ ] After success: Auto-login or navigate to OTP verification

### Login
- [ ] **POST** `/auth/login`
- [ ] Body: email, password
- [ ] Response: user object + accessToken
- [ ] Save accessToken to AsyncStorage/secure storage
- [ ] Error handling: 401 invalid credentials, 401 not verified
- [ ] After success: Navigate to dashboard, show loading
- [ ] Login history is automatically tracked (IP, user agent)

### Verify OTP
- [ ] **POST** `/auth/verify-otp`
- [ ] Body: email, otp
- [ ] Response: user object + accessToken
- [ ] Error handling: 400 invalid OTP, 400 OTP expired
- [ ] UI: OTP input screen
- [ ] Timer: Show OTP expiry countdown

### Resend OTP
- [ ] **POST** `/auth/resend-otp`
- [ ] Body: email
- [ ] Response: message
- [ ] UI: "Resend OTP" button (disabled until countdown expires)
- [ ] Error handling: 400 already verified

### Logout
- [ ] **POST** `/auth/logout`
- [ ] Headers: Authorization Bearer token
- [ ] Response: message
- [ ] Action: Clear token from storage, navigate to login
- [ ] Logout time is tracked automatically

### Change Password
- [ ] **POST** `/auth/change-password`
- [ ] Headers: Authorization Bearer token
- [ ] Body: currentPassword, newPassword, confirmPassword
- [ ] Response: message
- [ ] Error handling: 400 password mismatch, 400 current incorrect
- [ ] Validation: Check passwords match before sending

### Get Profile (Me)
- [ ] **GET** `/auth/me`
- [ ] Headers: Authorization Bearer token
- [ ] Response: user object + accessToken (refreshed)
- [ ] Use this to verify token is still valid on app startup

---

## 👥 USERS (5 endpoints)

### Get Profile
- [ ] **GET** `/users/profile`
- [ ] Headers: Authorization Bearer token
- [ ] Response: full user object with timestamps
- [ ] UI: Display in "My Profile" screen

### Update Profile
- [ ] **PUT** `/users/profile`
- [ ] Headers: Authorization Bearer token
- [ ] Body: name, specialization, phone, avatarUrl
- [ ] Response: updated user object
- [ ] UI: Profile edit form
- [ ] Avatar upload: Should upload to Cloudinary first, then save URL

### Get Recent Activity
- [ ] **GET** `/users/activity`
- [ ] Headers: Authorization Bearer token
- [ ] Response: recentScans, recentNotifications, loginHistory, profileUpdatedAt
- [ ] UI: Show in "Activity" or "Recent" tab
- [ ] Show: Last 10 scans, last 20 notifications, last 10 logins
- [ ] Date formatting: Show relative time (e.g., "2 hours ago")

### Delete Account
- [ ] **DELETE** `/users/account`
- [ ] Headers: Authorization Bearer token
- [ ] Body: password
- [ ] Response: message
- [ ] Confirmation: Show warning dialog before deleting
- [ ] Action: Clear all data, navigate to login

### Download My Data
- [ ] **GET** `/users/my-data`
- [ ] Headers: Authorization Bearer token
- [ ] Response: JSON file (blob)
- [ ] Action: Download or share user's data
- [ ] UI: "Export my data" button in settings

---

## 🏥 PATIENTS (5 endpoints)

### Create Patient
- [ ] **POST** `/patients`
- [ ] Headers: Authorization Bearer token
- [ ] Body: idNumber, name, age, gender
- [ ] Response: patient object
- [ ] Role check: Only CLINICIAN, ADMIN
- [ ] UI: Patient creation form
- [ ] Validation: ID must be unique
- [ ] After success: Add to patients list or navigate to patient detail

### Get All Patients
- [ ] **GET** `/patients`
- [ ] Headers: Authorization Bearer token
- [ ] Query params: skip=0, take=10, search (optional)
- [ ] Response: total count + patients array
- [ ] UI: Patients list screen
- [ ] Pagination: Implement infinite scroll or pagination buttons
- [ ] Search: Filter by name/ID (optional)
- [ ] Loading: Show skeleton or spinner while fetching

### Get Patient by ID
- [ ] **GET** `/patients/:patientId`
- [ ] Headers: Authorization Bearer token
- [ ] Response: single patient object
- [ ] UI: Patient detail screen
- [ ] Error: 404 patient not found

### Update Patient
- [ ] **PUT** `/patients/:patientId`
- [ ] Headers: Authorization Bearer token
- [ ] Body: name, age, gender
- [ ] Response: updated patient object
- [ ] UI: Patient edit form
- [ ] After success: Refresh patient detail or list

### Delete Patient
- [ ] **DELETE** `/patients/:patientId`
- [ ] Headers: Authorization Bearer token
- [ ] Role check: ADMIN only (show error if not admin)
- [ ] Response: message
- [ ] Confirmation: Show warning before deleting
- [ ] After success: Remove from list or navigate back

---

## 📸 SCANS (6 endpoints)

### Upload Scan
- [ ] **POST** `/scans/upload`
- [ ] Headers: Authorization Bearer token, Content-Type: multipart/form-data
- [ ] Body: patientId, file (image), notes (optional)
- [ ] Response: scan object (status: PROCESSING)
- [ ] UI: Image picker + camera option
- [ ] File validation: Only images, max size limit
- [ ] Compression: Consider compressing image before upload
- [ ] After success: Show scan in processing state, show ID
- [ ] Error handling: File upload errors, network errors

### Get All Scans
- [ ] **GET** `/scans`
- [ ] Headers: Authorization Bearer token
- [ ] Query params: skip=0, take=10, status (optional), result (optional)
- [ ] Response: total count + scans array
- [ ] UI: Scans list screen
- [ ] Pagination: Implement pagination/infinite scroll
- [ ] Filtering: Allow filter by status and result
- [ ] CLINICIAN sees: Only their scans
- [ ] ADMIN sees: All scans

### Get Scan by ID
- [ ] **GET** `/scans/:scanId`
- [ ] Headers: Authorization Bearer token
- [ ] Response: scan object with all details
- [ ] UI: Scan detail screen
- [ ] Show: Image, heatmap (if available), result, confidence
- [ ] Status display: Show current status (UPLOADED, PROCESSING, COMPLETED, FAILED)
- [ ] Polling: Poll for updates if status is PROCESSING

### Get Scans by Patient
- [ ] **GET** `/scans/patient/:patientId`
- [ ] Headers: Authorization Bearer token
- [ ] Response: count + scans array (all scans for patient)
- [ ] UI: Patient's scans tab/view
- [ ] Access control: CLINICIAN can only see scans they created
- [ ] Show: All scans for the patient, sorted by date

### Update Scan
- [ ] **PATCH** `/scans/:scanId`
- [ ] Headers: Authorization Bearer token
- [ ] Body: status, result, confidence, modelVersion, heatmapUrl
- [ ] Response: updated scan object
- [ ] Role check: CLINICIAN (own scans) or ADMIN
- [ ] Typical use: When AI processing is done, update with results
- [ ] Notification: Notify user when status updates

### Delete Scan
- [ ] **DELETE** `/scans/:scanId`
- [ ] Headers: Authorization Bearer token
- [ ] Role check: CLINICIAN (own scans) or ADMIN
- [ ] Confirmation: Show warning before deleting
- [ ] Response: message
- [ ] After success: Remove from list or navigate back

---

## 📊 DASHBOARD (4 endpoints)

### Get Dashboard Overview
- [ ] **GET** `/dashboard/overview`
- [ ] Headers: Authorization Bearer token
- [ ] Response: summary + weeklyActivity + recentScans + systemStatus
- [ ] UI: Main dashboard screen
- [ ] Show: Total scans, pneumonia count, normal count, avg confidence
- [ ] Chart: Weekly activity with trend
- [ ] Recent scans: Last 10 scans
- [ ] System status: AI Model, Database, Storage health

### Get Weekly Activity
- [ ] **GET** `/dashboard/weekly-activity`
- [ ] Headers: Authorization Bearer token
- [ ] Response: data array + trend + trendDirection
- [ ] UI: Chart component (e.g., LineChart or AreaChart)
- [ ] Data: 7 days with scan count for each day
- [ ] Trend: Show percentage change and direction (up/down)
- [ ] Refresh: Can be called separately to update chart

### Get Recent Scans
- [ ] **GET** `/dashboard/recent-scans`
- [ ] Headers: Authorization Bearer token
- [ ] Response: array of recent scans (last 10)
- [ ] UI: Recent scans list widget
- [ ] Show: Patient name, result, confidence, date, image thumbnail
- [ ] Tap action: Navigate to scan detail

### Get System Status
- [ ] **GET** `/dashboard/system-status`
- [ ] Headers: Authorization Bearer token
- [ ] Response: aiModel, database, storage status
- [ ] UI: System status cards/indicators
- [ ] Show: Status indicator (green/yellow/red), details
- [ ] Database: Connected status + record count
- [ ] Storage: Percentage used + color coding
- [ ] AI Model: Operational status

---

## 📈 ANALYTICS (6 endpoints)

### Get Analytics Dashboard
- [ ] **GET** `/analytics/dashboard`
- [ ] Headers: Authorization Bearer token
- [ ] Response: summary + todayMetrics + thisWeekMetrics + thisMonthMetrics + topPatients + recentScans
- [ ] UI: Analytics screen
- [ ] Show: All metrics broken down by time period
- [ ] Compare: Today vs week vs month
- [ ] Top patients: Show most active patients
- [ ] CLINICIAN: See only their analytics
- [ ] ADMIN: See all analytics

### Get Scan Results Statistics
- [ ] **GET** `/analytics/scans/results`
- [ ] Headers: Authorization Bearer token
- [ ] Query params: dateFrom (optional), dateTo (optional), groupBy (optional: day/week/month)
- [ ] Response: statistics + timeline + confidenceDistribution
- [ ] UI: Statistics screen with filters
- [ ] Filters: Allow picking date range and group by
- [ ] Show: Pneumonia vs normal breakdown
- [ ] Confidence distribution: Excellent/good/fair buckets
- [ ] Timeline: Trend over time

### Get Patient Analytics
- [ ] **GET** `/analytics/patients`
- [ ] Headers: Authorization Bearer token
- [ ] Response: summary + topPatients + newPatients
- [ ] UI: Patient analytics screen
- [ ] Show: Total patients, new this month, with pneumonia
- [ ] Top patients: Most scanned patients
- [ ] New patients: Recently added patients
- [ ] Patient detail: Tap to view patient info

### Get Doctor Analytics
- [ ] **GET** `/analytics/doctors`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only (show 403 error if not admin)
- [ ] Response: summary + doctorStats + activityTrend
- [ ] UI: Doctor/Staff analytics screen (admin only)
- [ ] Show: Doctor performance metrics
- [ ] Stats: Scans count, pneumonia detected, accuracy, confidence
- [ ] Last active: Show when doctor last logged in

### Get Model Performance
- [ ] **GET** `/analytics/model-performance`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only
- [ ] Response: overall + byModelVersion + confidenceThresholds
- [ ] UI: Model performance screen (admin only)
- [ ] Show: Accuracy, precision, recall, F1 score
- [ ] By version: Show performance for each model version
- [ ] Confidence: Show accuracy by confidence threshold

### Get Activity Timeline
- [ ] **GET** `/analytics/activity-timeline`
- [ ] Headers: Authorization Bearer token
- [ ] Query params: userId (optional for ADMIN), dateFrom (optional), dateTo (optional), limit (optional, default 50)
- [ ] Response: timeline array + total count
- [ ] UI: Activity timeline/feed screen
- [ ] Types: SCAN_UPLOADED, USER_LOGIN, NOTIFICATION_SENT
- [ ] Show: Who did what, when, with details
- [ ] ADMIN: Can filter by user
- [ ] CLINICIAN: See only their activity
- [ ] Pagination: Implement scroll to load more

---

## 🔔 NOTIFICATIONS (6 endpoints)

### Get All Notifications
- [ ] **GET** `/notifications`
- [ ] Headers: Authorization Bearer token
- [ ] Query params: skip=0, take=20, read (optional)
- [ ] Response: total count + notifications array
- [ ] UI: Notifications list screen
- [ ] Sorting: Most recent first
- [ ] Filter: Show unread first or option to filter read/unread
- [ ] Badge: Show unread count in app/tab icon

### Get Notification by ID
- [ ] **GET** `/notifications/:notificationId`
- [ ] Headers: Authorization Bearer token
- [ ] Response: single notification object
- [ ] UI: Notification detail screen
- [ ] Show: Title, message, type, date
- [ ] Mark read: If not already read

### Mark Notification as Read
- [ ] **PATCH** `/notifications/:notificationId`
- [ ] Headers: Authorization Bearer token
- [ ] Body: read (true/false)
- [ ] Response: updated notification
- [ ] UI: When user opens notification, auto-mark as read
- [ ] Or provide "Mark as read" button

### Mark All Notifications as Read
- [ ] **POST** `/notifications/read-all`
- [ ] Headers: Authorization Bearer token
- [ ] Response: message + updatedCount
- [ ] UI: "Mark all as read" button
- [ ] Action: Clear badge number after this

### Delete Notification
- [ ] **DELETE** `/notifications/:notificationId`
- [ ] Headers: Authorization Bearer token
- [ ] Response: message
- [ ] UI: Swipe to delete or menu option
- [ ] Confirmation: Optional confirmation dialog

### Delete All Notifications
- [ ] **DELETE** `/notifications`
- [ ] Headers: Authorization Bearer token
- [ ] Response: message + deletedCount
- [ ] UI: "Clear all" button in notifications screen
- [ ] Confirmation: Show warning before clearing all

---

## 💬 MESSAGES (5 endpoints)

### Send Message
- [ ] **POST** `/messages/send`
- [ ] Headers: NOT required (no auth)
- [ ] Body: name, email, subject, message, contactEmail (optional)
- [ ] Response: message object
- [ ] UI: Contact form screen (public)
- [ ] Validation: Name, email, subject, message required
- [ ] After success: Show success message, clear form
- [ ] Error handling: Network errors, validation errors

### Get All Messages
- [ ] **GET** `/messages`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only
- [ ] Query params: skip=0, take=20, responded (optional)
- [ ] Response: total count + messages array
- [ ] UI: Messages/Support screen (admin only)
- [ ] Show: From name, subject, date, responded status
- [ ] Filter: Show unanswered first

### Get Message by ID
- [ ] **GET** `/messages/:messageId`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only
- [ ] Response: full message object
- [ ] UI: Message detail screen
- [ ] Show: Full message content, contact email
- [ ] Actions: Mark as responded, delete

### Mark Message as Responded
- [ ] **PATCH** `/messages/:messageId`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only
- [ ] Body: responded (true/false)
- [ ] Response: updated message
- [ ] UI: "Mark as responded" button
- [ ] Visual: Update status in list

### Delete Message
- [ ] **DELETE** `/messages/:messageId`
- [ ] Headers: Authorization Bearer token
- [ ] Role: ADMIN only
- [ ] Response: message
- [ ] Confirmation: Show warning
- [ ] After success: Remove from list

---

## 🛠️ COMMON IMPLEMENTATION REQUIREMENTS

### API Service/Client
- [ ] Create API service with base URL from environment
- [ ] Implement axios or fetch wrapper
- [ ] Add request interceptor to include Authorization header
- [ ] Add response interceptor to handle token refresh
- [ ] Add error handling for all status codes (400, 401, 403, 404, 500, etc.)
- [ ] Add retry logic for failed requests
- [ ] Add request/response logging (dev mode)

### Authentication State Management
- [ ] Store accessToken securely (AsyncStorage or SecureStore)
- [ ] Store user data (Redux, Context API, Zustand, etc.)
- [ ] Implement token refresh on app startup
- [ ] Implement auto-logout on 401 errors
- [ ] Check token validity before making requests

### UI/UX Requirements
- [ ] Loading spinners on all async operations
- [ ] Error messages for all failed requests
- [ ] Empty states when no data
- [ ] Refresh/pull-to-refresh on lists
- [ ] Proper navigation between screens
- [ ] Form validation before submitting
- [ ] Confirmation dialogs for destructive actions
- [ ] Toast notifications for success/error messages

### Error Handling
- [ ] 400: Validation errors - show field errors
- [ ] 401: Unauthorized - auto-logout, navigate to login
- [ ] 403: Forbidden - show "access denied" message
- [ ] 404: Not found - show "not found" message
- [ ] 500: Server error - show "something went wrong"
- [ ] Network errors: Show "check your connection"
- [ ] Timeout errors: Show "request timeout"

### Performance
- [ ] Implement caching for GET requests where appropriate
- [ ] Pagination: Load 10-20 items at a time
- [ ] Lazy loading: Load more on scroll
- [ ] Image optimization: Compress before upload
- [ ] Debounce: On search inputs
- [ ] Throttle: On scroll/resize events

---

## ✅ VERIFICATION TESTS

Run these tests to verify implementation:

### Authentication Flow
```
1. Register new user → Verify gets OTP screen
2. Verify OTP → Verify login succeeds
3. Login with correct credentials → Verify token stored
4. Login with wrong password → Verify 401 error
5. Logout → Verify token cleared and redirected to login
6. Try accessing protected endpoint after logout → Verify 401 error
```

### Patient/Scan Flow
```
1. Create patient → Verify appears in list
2. Upload scan for patient → Verify status is PROCESSING
3. Poll scan → Verify status updates when complete
4. Get all scans → Verify pagination works
5. Get scans by patient → Verify only that patient's scans shown
6. Update scan with results → Verify results saved
```

### Dashboard
```
1. Load dashboard → Verify all widgets present
2. Check weekly chart → Verify data matches expected
3. Check system status → Verify all systems show status
4. Check recent scans → Verify list updated
```

### Analytics
```
1. Load analytics → Verify metrics calculated
2. Filter by date range → Verify results filtered
3. Check doctor stats (ADMIN) → Verify can see all doctors
4. Check model performance (ADMIN) → Verify accuracy stats shown
5. Try accessing ADMIN endpoint as CLINICIAN → Verify 403 error
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying, verify:

- [ ] All 44 endpoints implemented
- [ ] All endpoints have proper error handling
- [ ] All protected endpoints require token
- [ ] Role-based access control working (CLINICIAN vs ADMIN)
- [ ] No hardcoded URLs (use environment variables)
- [ ] API base URL can be changed per environment (dev/staging/prod)
- [ ] All TypeScript types defined
- [ ] No console.logs in production code
- [ ] Test on actual device (not just simulator)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test with expired token (verify auto-logout)
- [ ] Test with invalid token (verify 401 handling)
- [ ] Privacy: Check no sensitive data in logs
- [ ] Permissions: Request camera/photo library where needed

---

## 📞 SUPPORT

If any endpoint:
- Returns unexpected response format
- Has different payload than documented
- Doesn't exist or returns 404
- Returns unexpected error

**Contact:** Backend team for updates to API

---

**Total Endpoints to Implement:** 44  
**Created:** April 20, 2026  
**Status:** Ready for implementation
