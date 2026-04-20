# 📋 PneumoDetect React Native Implementation Checklist

**Use this checklist to verify all backend endpoints are properly implemented in your React Native app.**

---

## 🔐 Authentication (7 endpoints)

### Login
- [ ] Endpoint exists: `POST /auth/login`
- [ ] Sends: `{ email, password }`
- [ ] Receives: User object + `accessToken`
- [ ] Stores token in secure storage (AsyncStorage/Keychain)
- [ ] Sets Authorization header for future requests
- [ ] Handles error: 401 Invalid credentials
- [ ] Shows loading state during request

### Register
- [ ] Endpoint exists: `POST /auth/register`
- [ ] Sends: `{ email, password, name, role, specialization, phone }`
- [ ] Receives: User object + `accessToken`
- [ ] Validates email format before sending
- [ ] Validates password strength
- [ ] Handles error: 409 Email already exists
- [ ] Auto-navigates to OTP verification screen

### Verify OTP
- [ ] Endpoint exists: `POST /auth/verify-otp`
- [ ] Sends: `{ email, code }`
- [ ] Receives: `{ accessToken }`
- [ ] Has 6-digit OTP input field
- [ ] Has resend button
- [ ] Shows countdown timer for resend
- [ ] Handles error: 400 Invalid OTP
- [ ] Handles error: 400 OTP expired

### Resend OTP
- [ ] Endpoint exists: `POST /auth/resend-otp`
- [ ] Sends: `{ email }`
- [ ] Receives: `{ message }`
- [ ] Only enables after 30-60 seconds
- [ ] Shows "Resent successfully" toast
- [ ] Handles error: 429 Too many attempts
- [ ] Resets countdown timer

### Change Password
- [ ] Endpoint exists: `POST /auth/change-password`
- [ ] Sends: `{ currentPassword, newPassword }`
- [ ] Requires token in header
- [ ] Validates current password matches before sending
- [ ] Validates new password strength
- [ ] Shows confirmation dialog
- [ ] Logs user out after success
- [ ] Handles error: 400 Invalid current password

### Delete Account
- [ ] Endpoint exists: `DELETE /users/account`
- [ ] Sends: `{ password }`
- [ ] Requires token in header
- [ ] Shows warning dialog ("Are you sure?")
- [ ] Asks for password confirmation
- [ ] Clears all local data after success
- [ ] Navigates to login screen
- [ ] Handles error: 400 Invalid password

### Logout
- [ ] Endpoint exists: `POST /auth/logout`
- [ ] Requires token in header
- [ ] Clears token from storage
- [ ] Clears user data from Redux/Context
- [ ] Clears notifications
- [ ] Navigates to login screen
- [ ] Handles timeout gracefully

---

## 👤 User Management (2 endpoints)

### Get Current User (Profile)
- [ ] Endpoint exists: `GET /users/me`
- [ ] Requires token in header
- [ ] Called on app launch
- [ ] Displays all user info
- [ ] Updates Redux/Context store
- [ ] Shows skeleton loader while loading
- [ ] Handles error: 401 Unauthorized (logout)
- [ ] Caches result for offline access

### Update Profile
- [ ] Endpoint exists: `PUT /users/profile`
- [ ] Sends: `{ name, phone, specialization, avatarUrl }`
- [ ] Requires token in header
- [ ] Has image picker for avatar
- [ ] Shows loading state during upload
- [ ] Updates local state immediately (optimistic update)
- [ ] Shows success notification
- [ ] Rolls back on error
- [ ] Validates required fields

---

## 🏥 Patient Management (6 endpoints)

### Get All Patients
- [ ] Endpoint exists: `GET /patients`
- [ ] Requires token in header
- [ ] Supports pagination: `skip`, `take`
- [ ] Supports search: `search` param
- [ ] Shows patients in list/table
- [ ] Shows loading skeleton
- [ ] Implements infinite scroll or pagination UI
- [ ] Handles empty state
- [ ] Caches results locally

### Get Patient By ID
- [ ] Endpoint exists: `GET /patients/:patientId`
- [ ] Requires token in header
- [ ] Shows all patient details
- [ ] Shows scan history for patient
- [ ] Shows medical history
- [ ] Shows scan count and stats
- [ ] Has back button
- [ ] Handles error: 404 Not found

### Create Patient
- [ ] Endpoint exists: `POST /patients`
- [ ] Sends: `{ idNumber, name, age, gender, email, phone, address, medicalHistory }`
- [ ] Requires token in header
- [ ] Has form validation
- [ ] Validates ID number uniqueness
- [ ] Shows loading state
- [ ] Shows success notification
- [ ] Returns to patient list after creation
- [ ] Handles error: 409 Duplicate ID

### Update Patient
- [ ] Endpoint exists: `PUT /patients/:patientId`
- [ ] Sends: Updated patient fields
- [ ] Requires token in header
- [ ] Pre-fills form with current data
- [ ] Has save/cancel buttons
- [ ] Shows loading state
- [ ] Shows success notification
- [ ] Refreshes patient details
- [ ] Handles validation errors

### Delete Patient
- [ ] Endpoint exists: `DELETE /patients/:patientId`
- [ ] Requires token in header
- [ ] Shows confirmation dialog
- [ ] Warns about cascading deletions
- [ ] Shows loading state
- [ ] Removes from list after deletion
- [ ] Shows success notification
- [ ] Handles error gracefully

### Search Patients
- [ ] Uses: `GET /patients?search=query`
- [ ] Debounces search input (300-500ms)
- [ ] Shows results in real-time
- [ ] Shows "No results" message
- [ ] Clears previous results when clearing search
- [ ] Highlights search term in results
- [ ] Shows recent searches

---

## 📸 Scan Management (7 endpoints)

### Get All Scans
- [ ] Endpoint exists: `GET /scans`
- [ ] Requires token in header
- [ ] Shows scans in list
- [ ] Supports pagination
- [ ] Shows loading skeleton
- [ ] Sorts by date (newest first)
- [ ] Shows patient name, result, confidence, date
- [ ] Implements infinite scroll
- [ ] Handles empty state

### Get Scan By ID
- [ ] Endpoint exists: `GET /scans/:scanId`
- [ ] Requires token in header
- [ ] Shows full scan details
- [ ] Displays X-ray image (responsive)
- [ ] Displays heatmap (if available)
- [ ] Shows result and confidence score
- [ ] Shows patient info
- [ ] Shows timestamps
- [ ] Has download option

### Get Scans By Patient ID
- [ ] Endpoint exists: `GET /scans/patient/:patientId`
- [ ] Requires token in header
- [ ] Shows all scans for patient
- [ ] Shows summary: total, pneumonia, normal
- [ ] Sorts chronologically
- [ ] Shows confidence distribution
- [ ] Quick access to scan details
- [ ] Handles empty state

### Upload Scan
- [ ] Endpoint exists: `POST /scans/upload`
- [ ] Requires token in header
- [ ] Content-Type: `multipart/form-data`
- [ ] Has image picker (camera/gallery)
- [ ] Shows image preview before upload
- [ ] Validates file size (max ~10MB)
- [ ] Validates file type (JPEG/PNG)
- [ ] Shows upload progress bar
- [ ] Can cancel upload in progress
- [ ] Validates patient ID selected
- [ ] Optional notes field
- [ ] Shows success notification
- [ ] Navigates to scan detail after upload
- [ ] Handles error: 400 Invalid file

### Process Scan
- [ ] Endpoint exists: `POST /scans/:scanId/process`
- [ ] Requires token in header
- [ ] Shows "Processing" status
- [ ] Updates status to "COMPLETED" after analysis
- [ ] Shows processing animation/spinner
- [ ] Shows estimated time
- [ ] Polls for updates (or uses WebSocket)
- [ ] Shows final result (PNEUMONIA/NORMAL)
- [ ] Shows confidence score
- [ ] Handles timeout gracefully
- [ ] Notification when complete

### Update Scan
- [ ] Endpoint exists: `PATCH /scans/:scanId`
- [ ] Sends: `{ result, notes }`
- [ ] Requires token in header
- [ ] Allows editing notes
- [ ] Shows loading state
- [ ] Handles validation errors
- [ ] Updates scan list after edit
- [ ] Shows success notification

### Delete Scan
- [ ] Endpoint exists: `DELETE /scans/:scanId`
- [ ] Requires token in header
- [ ] Shows confirmation dialog
- [ ] Shows loading state
- [ ] Removes from scan list
- [ ] Updates patient statistics
- [ ] Shows success notification

---

## 📊 Analytics & Dashboard (8 endpoints)

### Get Analytics Stats
- [ ] Endpoint exists: `GET /analytics/stats`
- [ ] Requires token in header
- [ ] Shows: `totalScans, totalPatients, pneumoniaDetected, accuracyRate`
- [ ] Updates on dashboard load
- [ ] Shows loading skeleton
- [ ] Formats large numbers (1.2K, 94.5%)

### Get Dashboard Metrics
- [ ] Endpoint exists: `GET /analytics/dashboard`
- [ ] Requires token in header
- [ ] Shows comprehensive dashboard
- [ ] Displays all metrics
- [ ] Shows summary cards
- [ ] Updates monthly stats
- [ ] Shows active users
- [ ] Shows system health
- [ ] Refreshes on pull-to-refresh

### Get Scan Results Timeline
- [ ] Endpoint exists: `GET /analytics/scans/results`
- [ ] Requires token in header
- [ ] Supports date range: `dateFrom`, `dateTo`
- [ ] Supports grouping: `groupBy` (day/week/month)
- [ ] Shows chart with timeline data
- [ ] Displays result breakdown
- [ ] Shows confidence distribution
- [ ] Filters by date range
- [ ] Has date picker UI
- [ ] Shows trend percentage

### Get Patient Analytics
- [ ] Endpoint exists: `GET /analytics/patients`
- [ ] Requires token in header
- [ ] Shows: `totalPatients, newPatientsThisMonth, patientsWithPneumonia`
- [ ] Displays top patients list
- [ ] Shows patient scan counts
- [ ] Shows last scan dates
- [ ] Shows pneumonia detection percentage
- [ ] Ranks by activity

### Get Doctor Analytics (Admin only)
- [ ] Endpoint exists: `GET /analytics/doctors`
- [ ] Requires token in header + Admin role
- [ ] Shows all doctors
- [ ] Displays performance metrics
- [ ] Shows accuracy rate per doctor
- [ ] Shows last active timestamp
- [ ] Compares doctor performance
- [ ] Shows hidden by role check

### Get Model Performance (Admin only)
- [ ] Endpoint exists: `GET /analytics/model-performance`
- [ ] Requires token in header + Admin role
- [ ] Shows accuracy, precision, recall, F1 score
- [ ] Grouped by model version
- [ ] Shows confidence threshold analysis
- [ ] Shows hidden by role check
- [ ] Displays trending info

### Get Activity Timeline
- [ ] Endpoint exists: `GET /analytics/activity-timeline`
- [ ] Requires token in header
- [ ] Supports filters: `userId`, `dateFrom`, `dateTo`, `type`
- [ ] Shows activity events
- [ ] Shows event type icons
- [ ] Shows timestamps
- [ ] Sortable/filterable
- [ ] Shows event details on tap

### Get System Status
- [ ] Endpoint exists: `GET /dashboard/system-status`
- [ ] Requires token in header
- [ ] Shows: `aiModel, database, storage` status
- [ ] Color-coded status indicators
- [ ] Shows storage percentage
- [ ] Updates periodically
- [ ] Shows in dashboard

---

## 🔔 Notifications (5 endpoints)

### Get All Notifications
- [ ] Endpoint exists: `GET /notifications`
- [ ] Requires token in header
- [ ] Shows notifications list
- [ ] Shows unread count badge
- [ ] Shows notification icon
- [ ] Shows timestamp
- [ ] Shows read/unread state
- [ ] Sorts newest first
- [ ] Handles empty state

### Get Notification By ID
- [ ] Endpoint exists: `GET /notifications/:notificationId`
- [ ] Requires token in header
- [ ] Shows full notification content
- [ ] Shows action button/link if available
- [ ] Marks as read automatically
- [ ] Shows timestamp

### Update Notification (Mark as Read)
- [ ] Endpoint exists: `PATCH /notifications/:notificationId`
- [ ] Sends: `{ read: true }`
- [ ] Requires token in header
- [ ] Updates read state UI
- [ ] Removes from unread count
- [ ] Updates badge
- [ ] Shows loading state

### Mark All Notifications as Read
- [ ] Endpoint exists: `POST /notifications/mark-all-read`
- [ ] Requires token in header
- [ ] Clears all unread notifications
- [ ] Updates badge to 0
- [ ] Shows success toast
- [ ] One-tap action

### Delete Notification
- [ ] Endpoint exists: `DELETE /notifications/:notificationId`
- [ ] Requires token in header
- [ ] Shows confirmation
- [ ] Removes from list
- [ ] Updates count
- [ ] Shows success notification

---

## 📈 User Activity (2 endpoints)

### Get User Activity History
- [ ] Endpoint exists: `GET /users/activity`
- [ ] Requires token in header
- [ ] Shows activity summary
- [ ] Shows total scans/patients
- [ ] Shows last activity timestamp
- [ ] Shows activity timeline
- [ ] Shows actions taken (SCAN_UPLOADED, etc.)
- [ ] Groups by date

### Get Login History
- [ ] Endpoint exists: `GET /users/activity/login`
- [ ] Requires token in header
- [ ] Shows all login records
- [ ] Shows IP address
- [ ] Shows device/browser info
- [ ] Shows login/logout times
- [ ] Shows session duration
- [ ] Shows location (if available)
- [ ] Security feature UI

---

## 👨‍💼 Admin Management (4 endpoints)

### Get All Users
- [ ] Endpoint exists: `GET /admin/users`
- [ ] Requires token in header + Admin role
- [ ] Shows all users list
- [ ] Filters by role
- [ ] Pagination support
- [ ] Shows user details
- [ ] Shows user status
- [ ] Shows hidden by role check

### Get User By ID
- [ ] Endpoint exists: `GET /admin/users/:userId`
- [ ] Requires token in header + Admin role
- [ ] Shows user profile
- [ ] Shows user statistics
- [ ] Shows activity history
- [ ] Shows hidden by role check

### Toggle User Status
- [ ] Endpoint exists: `PATCH /admin/users/:userId/status`
- [ ] Sends: `{ isActive: boolean }`
- [ ] Requires token in header + Admin role
- [ ] Shows toggle switch
- [ ] Confirmation before deactivating
- [ ] Shows loading state
- [ ] Updates user list
- [ ] Shows success notification

### Delete User
- [ ] Endpoint exists: `DELETE /admin/users/:userId`
- [ ] Requires token in header + Admin role
- [ ] Shows confirmation dialog
- [ ] Shows loading state
- [ ] Removes from user list
- [ ] Shows success notification
- [ ] Shows hidden by role check

---

## 💬 Support Messages (3 endpoints)

### Send Support Message
- [ ] Endpoint exists: `POST /messages/send`
- [ ] Requires token in header
- [ ] Has form: subject, message
- [ ] Validates required fields
- [ ] Shows loading state
- [ ] Shows success notification
- [ ] Clears form after sending
- [ ] Handles error gracefully

### Get All Messages (Admin only)
- [ ] Endpoint exists: `GET /messages`
- [ ] Requires token in header + Admin role
- [ ] Shows all support messages
- [ ] Filters by responded status
- [ ] Pagination support
- [ ] Shows message details
- [ ] Shows sender info
- [ ] Shows hidden by role check

### Mark Message as Responded (Admin only)
- [ ] Endpoint exists: `PATCH /messages/:messageId`
- [ ] Sends: `{ responded: true }`
- [ ] Requires token in header + Admin role
- [ ] Updates message status
- [ ] Shows timestamp
- [ ] Shows success notification
- [ ] Updates message list

---

## 🔒 Global Requirements

### Authentication
- [ ] JWT token stored securely (Keychain/Secure Storage)
- [ ] Token included in all authenticated requests
- [ ] Token refresh on expiry
- [ ] Auto-logout on 401 response
- [ ] Silent refresh implementation
- [ ] Token cleared on logout

### Error Handling
- [ ] 400 errors show field-specific messages
- [ ] 401 errors trigger logout
- [ ] 403 errors show "Unauthorized" message
- [ ] 404 errors show "Not found" message
- [ ] 500 errors show "Server error" with retry
- [ ] Network errors show offline message
- [ ] Timeout handled (>30s)
- [ ] Retry logic for failed requests

### State Management
- [ ] Redux/Context properly configured
- [ ] Auth state persisted
- [ ] User data cached
- [ ] Loading states managed
- [ ] Error states handled
- [ ] Optimistic updates implemented

### UI/UX
- [ ] All endpoints show loading states
- [ ] All lists show empty states
- [ ] Pull-to-refresh implemented
- [ ] Error messages user-friendly
- [ ] Success notifications shown
- [ ] Loading spinners/skeletons used
- [ ] Back buttons work correctly
- [ ] Navigation flow makes sense

### Data Handling
- [ ] Date formatting consistent (ISO 8601)
- [ ] Numbers formatted properly (decimals)
- [ ] Confidence scores as decimals (0-1) or percentages (0-100)
- [ ] Image URLs handled correctly
- [ ] Large lists paginated
- [ ] No N+1 queries on client
- [ ] Data validation before sending

### Performance
- [ ] Requests debounced/throttled where needed
- [ ] Images lazy-loaded
- [ ] Lists virtualized (FlatList)
- [ ] No memory leaks on cleanup
- [ ] Fast navigation (<300ms)
- [ ] Caching implemented for repeated requests

### Testing Checklist
- [ ] Test all endpoints with valid data
- [ ] Test all endpoints with invalid data
- [ ] Test error responses
- [ ] Test network timeout
- [ ] Test offline mode
- [ ] Test token expiry
- [ ] Test permission errors (401, 403)
- [ ] Test file uploads
- [ ] Test pagination
- [ ] Test search/filtering

---

## 📱 Integration Testing

### Complete User Journey - Doctor
- [ ] Login successfully
- [ ] View dashboard with stats
- [ ] View patient list
- [ ] Create new patient
- [ ] Upload scan for patient
- [ ] Process scan and get results
- [ ] View scan history for patient
- [ ] View analytics
- [ ] View activity history
- [ ] Update profile
- [ ] Logout

### Complete User Journey - Admin
- [ ] All doctor features +
- [ ] View all users
- [ ] View doctor analytics
- [ ] View model performance
- [ ] Toggle user status
- [ ] View support messages
- [ ] Mark messages as responded
- [ ] View system status

---

## ✅ Final Validation Checklist

- [ ] All 44 endpoints implemented
- [ ] All payloads match specification
- [ ] All responses match specification
- [ ] All error handling implemented
- [ ] All role-based access working
- [ ] All loading states working
- [ ] All success/error notifications working
- [ ] Token management working
- [ ] Offline caching implemented
- [ ] Performance optimized
- [ ] No console errors/warnings
- [ ] No memory leaks
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Ready for production

---

## 🚀 Deployment Checklist

Before releasing to production:

- [ ] Environment variables set correctly
- [ ] API base URL correct
- [ ] Analytics tracking integrated
- [ ] Error reporting configured
- [ ] Logging configured
- [ ] Performance monitoring active
- [ ] Security headers verified
- [ ] SSL/TLS enabled
- [ ] Rate limiting tested
- [ ] Load testing done
- [ ] Backup/recovery plan ready
- [ ] Rollback plan ready

---

**Print or share this checklist with your React Native team!**

**Status:** ✅ Ready to implement  
**Last Updated:** April 20, 2026  
**Total Items:** 400+
