# 🚀 PROMPT FOR REACT NATIVE TEAM

Copy and paste this into your chat with your React Native developers to give them all the information they need!

---

## COMPLETE BACKEND API DOCUMENTATION FOR PNEUMODETECT

Your backend has **44 fully functional endpoints** ready for integration. Here's everything your React Native app needs to implement.

### 📋 IMPLEMENTATION GUIDE

**There are 3 comprehensive documentation files in the backend repo:**

1. **COMPLETE_API_REFERENCE.md** - Full API documentation with all endpoints, payloads, and responses
2. **REACT_NATIVE_IMPLEMENTATION_GUIDE.md** - Detailed checklist of what to implement and how
3. **IMPLEMENTATION_SUMMARY.md** - Summary of key features (login history, scans, activity)
4. **DASHBOARD_ENDPOINTS.md** - Real-time dashboard data (no mocks!)
5. **ANALYTICS_API_GUIDE.md** - Complete analytics implementation

---

## ⚡ QUICK START - 5 MINUTE SETUP

### Environment Setup
```typescript
// config/api.ts
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.pneumodetect.com'
  : 'http://localhost:3000';

export const API_TIMEOUT = 10000; // 10 seconds
```

### API Service Template
```typescript
// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📱 ENDPOINTS BY SCREEN

### Authentication Screens
**Login Screen**
- POST /auth/login (email, password)
- Error: 401 invalid credentials, 401 not verified, 401 inactive

**Register Screen**
- POST /auth/register (email, password, name, specialization, phone)
- POST /auth/verify-otp (email, otp)
- POST /auth/resend-otp (email)

**Settings Screen**
- POST /auth/change-password (currentPassword, newPassword, confirmPassword)
- POST /auth/logout ()
- DELETE /users/account (password)

---

### Patient Management
**Patients List Screen**
- GET /patients (skip, take, search optional)
- Show: Loading, error, empty states
- Pagination: Implement infinite scroll or next/prev

**Create Patient Screen**
- POST /patients (idNumber, name, age, gender)
- Validation: ID number must be unique
- After success: Add to list

**Patient Detail Screen**
- GET /patients/:patientId
- PUT /patients/:patientId (name, age, gender)
- DELETE /patients/:patientId (ADMIN only)
- GET /scans/patient/:patientId (show all scans for this patient)

---

### Scan Management
**Scans List Screen**
- GET /scans (skip, take, status optional, result optional)
- Filters: By status (UPLOADED, PROCESSING, COMPLETED, FAILED)
- Filters: By result (PNEUMONIA, NORMAL)
- CLINICIAN sees: Only their scans
- ADMIN sees: All scans

**Upload Scan Screen**
- POST /scans/upload (patientId, file, notes optional)
- File type: Image (jpg, png, etc.)
- After upload: Show processing status
- Implementation: Use image picker + camera

**Scan Detail Screen**
- GET /scans/:scanId
- Show: Image, heatmap (if available), result, confidence, status
- If processing: Poll for updates every 5 seconds
- Actions: Update result (PATCH), delete, view patient

---

### Dashboard
**Main Dashboard Screen**
- GET /dashboard/overview (complete dashboard with all widgets)
- OR implement separately:
  - GET /dashboard/weekly-activity (for chart)
  - GET /dashboard/recent-scans (for list)
  - GET /dashboard/system-status (for health indicators)

**Widgets:**
1. Summary Cards: Total scans, pneumonia count, normal count, avg confidence
2. Weekly Activity Chart: Line or area chart with 7 days of data
3. Recent Scans List: Last 10 scans with image thumbnail
4. System Status: Database, storage, AI model health with indicators

---

### Analytics (Advanced Dashboard)
**Analytics Screen**
- GET /analytics/dashboard
- Show: Today vs Week vs Month metrics
- CLINICIAN: See only their analytics
- ADMIN: See all analytics

**Scan Results Analytics**
- GET /analytics/scans/results
- Query: dateFrom, dateTo, groupBy (day/week/month)
- Show: Pneumonia vs normal breakdown
- Show: Confidence distribution (excellent/good/fair)
- Show: Timeline trend

**Patient Analytics** (if needed)
- GET /analytics/patients
- Show: Top patients, new patients, average scans per patient

**Doctor Analytics** (ADMIN only)
- GET /analytics/doctors
- Show: Doctor performance, scans count, pneumonia detected, accuracy

**Model Performance** (ADMIN only)
- GET /analytics/model-performance
- Show: Accuracy, precision, recall, F1 score by model version

**Activity Timeline** (ADMIN only)
- GET /analytics/activity-timeline
- Show: Recent actions (scans uploaded, logins, notifications)

---

### User Profile & Activity
**Profile Screen**
- GET /users/profile
- PUT /users/profile (name, specialization, phone, avatarUrl)
- Avatar upload: Upload to Cloudinary first, save URL

**Activity Screen**
- GET /users/activity
- Show: Recent scans, notifications, login history
- Date formatting: "2 hours ago" format
- Show: IP address, user agent for login history

---

### Notifications
**Notifications Screen**
- GET /notifications (skip, take, read optional)
- Show: Unread count in badge
- Sorting: Unread first, then by date
- Actions: Mark as read, delete, clear all

**Notification Detail**
- GET /notifications/:notificationId
- Mark as read when viewing
- Show: Title, message, type, date

---

### Support/Messages (Optional)
**Contact Form Screen** (public, no auth needed)
- POST /messages/send (name, email, subject, message, contactEmail optional)
- Success message: "Thank you for contacting us!"

**Admin - Support Messages**
- GET /messages (skip, take, responded optional) - ADMIN only
- PATCH /messages/:messageId (mark responded) - ADMIN only

---

## 🔒 AUTHENTICATION REQUIREMENTS

### Headers Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Management
```typescript
// After login, save token
const { accessToken } = loginResponse;
await AsyncStorage.setItem('accessToken', accessToken);

// Before making requests, check if token exists
const token = await AsyncStorage.getItem('accessToken');
if (!token) {
  // Redirect to login
}

// On logout, clear token
await AsyncStorage.removeItem('accessToken');

// On 401, auto-logout
if (error.response?.status === 401) {
  await AsyncStorage.removeItem('accessToken');
  // Redirect to login
}
```

---

## ✅ ENDPOINT STRUCTURE

### All endpoints follow this pattern:

**Request:**
```
Method: GET/POST/PUT/DELETE/PATCH
URL: /resource or /resource/:id
Headers: Authorization: Bearer {token} (if required)
Body: { json object } (if applicable)
Query params: ?skip=0&take=10 (if applicable)
```

**Response Success (2xx):**
```json
{
  "id": "uuid",
  "name": "John",
  // ... more fields
}
// or array
[{ ... }, { ... }]
// or with pagination
{
  "total": 100,
  "items": [{ ... }]
}
```

**Response Error (4xx/5xx):**
```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

---

## 🎯 ROLE-BASED ACCESS

### CLINICIAN
- Can create patients
- Can upload scans
- Can only see their own scans
- Can see only their analytics
- Cannot delete patients
- Cannot see doctor analytics

### ADMIN
- Can create patients
- Can upload scans
- Can see all scans and patients
- Can see all analytics
- Can delete patients
- Can see doctor analytics and model performance
- Can manage support messages

---

## 📊 DATA TYPES

### Gender Enum
```
MALE | FEMALE
```

### Scan Status Enum
```
UPLOADED | PROCESSING | COMPLETED | FAILED
```

### Scan Result Enum
```
PNEUMONIA | NORMAL
```

### User Role Enum
```
CLINICIAN | ADMIN
```

### Notification Type Enum
```
SCAN | SYSTEM | USER
```

---

## 🔄 COMMON FLOWS

### Registration & Login Flow
```
1. POST /auth/register
   → Get OTP screen
2. POST /auth/verify-otp
   → Save token, navigate to dashboard
3. Dashboard automatically calls:
   → GET /dashboard/overview
   → GET /users/activity
```

### Scan Upload & Processing Flow
```
1. POST /scans/upload
   → Show scan in PROCESSING state
2. Poll GET /scans/:scanId every 5s
   → When status becomes COMPLETED, show results
   → Stop polling
3. User can view GET /scans/patient/:patientId
   → See all scans for that patient
```

### Patient Management Flow
```
1. GET /patients (list all)
2. POST /patients (create new)
3. GET /patients/:patientId (view detail)
4. PUT /patients/:patientId (edit)
5. DELETE /patients/:patientId (remove)
```

---

## ⚠️ IMPORTANT NOTES

1. **Login History**: Automatically tracked on backend
   - IP address captured
   - User agent captured
   - Logout time tracked
   - Access via GET /users/activity

2. **Dashboard Data**: All REAL (no mocks!)
   - Weekly activity calculated from database
   - System status checks database connection
   - Recent scans fetched from database
   - Storage calculated from scan count

3. **Pagination**: Always use skip/take
   ```
   GET /scans?skip=0&take=10
   GET /patients?skip=20&take=10
   ```

4. **Filtering**: Available on list endpoints
   ```
   GET /scans?status=COMPLETED
   GET /scans?result=PNEUMONIA
   GET /notifications?read=false
   GET /patients?search=John
   ```

5. **Error Handling**: Always handle these status codes
   - 400: Validation error (show field errors)
   - 401: Unauthorized (auto-logout)
   - 403: Forbidden (show "access denied")
   - 404: Not found
   - 500: Server error

---

## 📁 REFERENCE FILES

Read these files in the backend repository:

1. **COMPLETE_API_REFERENCE.md** - ESSENTIAL! All 44 endpoints with full payloads
2. **REACT_NATIVE_IMPLEMENTATION_GUIDE.md** - Detailed checklist per endpoint
3. **IMPLEMENTATION_SUMMARY.md** - Key features overview
4. **DASHBOARD_ENDPOINTS.md** - Dashboard specific (no mocks!)
5. **ANALYTICS_API_GUIDE.md** - Analytics endpoints details

---

## 🧪 TESTING

Test each endpoint with Postman/Insomnia:

1. **Get auth token first**
   ```
   POST /auth/login
   {
     "email": "doctor@hospital.com",
     "password": "SecurePass123!"
   }
   ```

2. **Use token in Authorization header**
   ```
   Authorization: Bearer {accessToken from response}
   ```

3. **Test each endpoint** with proper body and params

---

## 🚀 DEPLOYMENT READY

✅ All 44 endpoints implemented and tested  
✅ Real data (no mocks)  
✅ Error handling  
✅ Role-based access control  
✅ Pagination  
✅ Filtering  
✅ Production ready

---

**Total Endpoints:** 44  
**Documentation:** Comprehensive  
**Status:** Ready to implement  
**Support:** Check COMPLETE_API_REFERENCE.md for full details

Start implementing! 🎉
