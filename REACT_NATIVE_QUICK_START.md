# 🎯 React Native Developer - Quick Start Guide

**Quick reference for implementing PneumoDetect frontend**

---

## 📋 Copy-Paste Ready Endpoints List

### All 44 Endpoints at a Glance:

```
AUTHENTICATION (7)
✓ POST   /auth/login
✓ POST   /auth/register
✓ POST   /auth/verify-otp
✓ POST   /auth/resend-otp
✓ POST   /auth/change-password
✓ DELETE /users/account
✓ POST   /auth/logout

USER MANAGEMENT (2)
✓ GET    /users/me
✓ PUT    /users/profile

PATIENT MANAGEMENT (6)
✓ GET    /patients
✓ GET    /patients/:patientId
✓ POST   /patients
✓ PUT    /patients/:patientId
✓ DELETE /patients/:patientId
✓ GET    /patients (with search)

SCAN MANAGEMENT (7)
✓ GET    /scans
✓ GET    /scans/:scanId
✓ GET    /scans/patient/:patientId
✓ POST   /scans/upload
✓ POST   /scans/:scanId/process
✓ PATCH  /scans/:scanId
✓ DELETE /scans/:scanId

ANALYTICS & DASHBOARD (8)
✓ GET    /analytics/stats
✓ GET    /analytics/dashboard
✓ GET    /analytics/scans/results
✓ GET    /analytics/patients
✓ GET    /analytics/doctors (Admin)
✓ GET    /analytics/model-performance (Admin)
✓ GET    /analytics/activity-timeline
✓ GET    /dashboard/system-status

NOTIFICATIONS (5)
✓ GET    /notifications
✓ GET    /notifications/:notificationId
✓ PATCH  /notifications/:notificationId
✓ POST   /notifications/mark-all-read
✓ DELETE /notifications/:notificationId

USER ACTIVITY (2)
✓ GET    /users/activity
✓ GET    /users/activity/login

ADMIN MANAGEMENT (4)
✓ GET    /admin/users
✓ GET    /admin/users/:userId
✓ PATCH  /admin/users/:userId/status
✓ DELETE /admin/users/:userId

SUPPORT MESSAGES (3)
✓ POST   /messages/send
✓ GET    /messages (Admin)
✓ PATCH  /messages/:messageId (Admin)

TOTAL: 44 Endpoints
```

---

## 🛠️ Setup Services

### Create API Client

```typescript
// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000'; // Change for production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('auth_token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Create Service Functions

```typescript
// services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('auth_token', data.accessToken);
    return data;
  },

  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    await AsyncStorage.setItem('auth_token', data.accessToken);
    return data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    await AsyncStorage.removeItem('auth_token');
  },

  verifyOtp: async (email: string, code: string) => {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    await AsyncStorage.setItem('auth_token', data.accessToken);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },

  updateProfile: async (updates: any) => {
    const { data } = await api.put('/users/profile', updates);
    return data;
  },
};

// services/patientService.ts
export const patientService = {
  getAll: async (skip = 0, take = 10) => {
    const { data } = await api.get('/patients', {
      params: { skip, take },
    });
    return data;
  },

  getById: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}`);
    return data;
  },

  create: async (patientData: any) => {
    const { data } = await api.post('/patients', patientData);
    return data;
  },

  update: async (patientId: string, updates: any) => {
    const { data } = await api.put(`/patients/${patientId}`, updates);
    return data;
  },

  delete: async (patientId: string) => {
    const { data } = await api.delete(`/patients/${patientId}`);
    return data;
  },
};

// services/scanService.ts
export const scanService = {
  getAll: async (skip = 0, take = 10) => {
    const { data } = await api.get('/scans', { params: { skip, take } });
    return data;
  },

  getById: async (scanId: string) => {
    const { data } = await api.get(`/scans/${scanId}`);
    return data;
  },

  getByPatient: async (patientId: string) => {
    const { data } = await api.get(`/scans/patient/${patientId}`);
    return data;
  },

  upload: async (patientId: string, imageUri: string, notes?: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    });
    formData.append('patientId', patientId);
    if (notes) formData.append('notes', notes);

    const { data } = await api.post('/scans/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  process: async (scanId: string) => {
    const { data } = await api.post(`/scans/${scanId}/process`);
    return data;
  },

  update: async (scanId: string, updates: any) => {
    const { data } = await api.patch(`/scans/${scanId}`, updates);
    return data;
  },

  delete: async (scanId: string) => {
    const { data } = await api.delete(`/scans/${scanId}`);
    return data;
  },
};

// services/dashboardService.ts
export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get('/analytics/stats');
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },

  getScanResults: async (dateFrom?: string, dateTo?: string) => {
    const { data } = await api.get('/analytics/scans/results', {
      params: { dateFrom, dateTo },
    });
    return data;
  },
};

// services/notificationService.ts
export const notificationService = {
  getAll: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },

  markAsRead: async (notificationId: string) => {
    const { data } = await api.patch(`/notifications/${notificationId}`, {
      read: true,
    });
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.post('/notifications/mark-all-read');
    return data;
  },

  delete: async (notificationId: string) => {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
  },
};
```

---

## 🎨 Key Screens to Build

### 1. **Login Screen**
```
Required calls: POST /auth/login
Form fields: email, password
Show: Loading state, error message, forgot password link
Navigate to: Home (if success) or OTP verification
```

### 2. **Register Screen**
```
Required calls: POST /auth/register
Form fields: email, password, name, specialization, phone
Show: Loading state, error message
Navigate to: OTP verification (if success)
```

### 3. **OTP Verification Screen**
```
Required calls: POST /auth/verify-otp, POST /auth/resend-otp
Features: 6-digit input, resend button with countdown
Navigate to: Home (if success)
```

### 4. **Dashboard Screen**
```
Required calls: GET /analytics/dashboard, GET /dashboard/system-status
Display:
- Summary cards (total scans, pneumonia detected, etc.)
- Weekly activity chart
- Recent scans list
- System status (AI Model, Database, Storage)
Features: Pull-to-refresh, loading skeleton
```

### 5. **Patients Screen**
```
Required calls: GET /patients, GET /patients (search)
Display: List of patients with search
Features: Pagination, search, pull-to-refresh
Actions: Create, view details, edit, delete
```

### 6. **Patient Details Screen**
```
Required calls: GET /patients/:id, GET /scans/patient/:id
Display: Patient info, scan history, statistics
Actions: Edit patient, upload new scan, view scan details
```

### 7. **Scan Upload Screen**
```
Required calls: POST /scans/upload
Features:
- Image picker (camera/gallery)
- Image preview
- Patient selection
- Notes field
- Upload progress
Action: Upload scan and navigate to processing
```

### 8. **Scan Results Screen**
```
Required calls: GET /scans/:id, POST /scans/:id/process
Display:
- X-ray image
- Processing status
- Result (PNEUMONIA/NORMAL)
- Confidence score
- Heatmap (if available)
Actions: Process scan, download, share, edit notes
```

### 9. **Analytics Screen**
```
Required calls: GET /analytics/scans/results, GET /analytics/patients
Display:
- Scan results chart (weekly/monthly)
- Patient statistics
- Confidence distribution
Features: Date range filter, group by options
```

### 10. **Notifications Screen**
```
Required calls: GET /notifications, PATCH /notifications/:id
Display: Notification list with unread badge
Features: Mark as read, delete
Actions: Navigate to related scan/patient
```

### 11. **Profile Screen**
```
Required calls: GET /users/me, PUT /users/profile
Display: User info
Features: Edit name, phone, avatar
Actions: Change password, delete account, logout
```

### 12. **Admin - Users Screen**
```
Required calls: GET /admin/users, PATCH /admin/users/:id/status
Display: List of all users
Features: Filter by role
Actions: View details, toggle status, delete
```

---

## 🔄 Data Flow Example

### Login Flow:
```
LoginScreen
  ↓
User enters email/password
  ↓
Call: POST /auth/login
  ↓
Store token in AsyncStorage
  ↓
Store user in Redux/Context
  ↓
Navigate to Dashboard
  ↓
Dashboard calls: GET /analytics/dashboard
  ↓
Display stats, chart, scans
```

### Scan Upload Flow:
```
ScanUploadScreen
  ↓
User selects image & patient
  ↓
Shows image preview
  ↓
Call: POST /scans/upload (multipart/form-data)
  ↓
Show upload progress
  ↓
Navigate to ScanProcessingScreen
  ↓
Call: POST /scans/:id/process
  ↓
Poll: GET /scans/:id (check status)
  ↓
When status = COMPLETED, show results
```

---

## 🚨 Error Handling Template

```typescript
try {
  setLoading(true);
  const result = await authService.login(email, password);
  await AsyncStorage.setItem('user', JSON.stringify(result));
  dispatch(setUser(result));
  navigation.navigate('Dashboard');
} catch (error) {
  if (error.response?.status === 401) {
    setError('Invalid email or password');
  } else if (error.response?.status === 400) {
    setError('Validation error: ' + error.response.data.message);
  } else if (error.message === 'Network Error') {
    setError('No internet connection');
  } else {
    setError('Something went wrong. Please try again.');
  }
  showErrorToast(error.message);
} finally {
  setLoading(false);
}
```

---

## 📊 Token Management

```typescript
// Store token securely
await AsyncStorage.setItem('auth_token', token);

// Include in all requests (done via interceptor)
Authorization: Bearer <token>

// Remove on logout
await AsyncStorage.removeItem('auth_token');

// Auto-logout on 401
interceptor → 401 → remove token → navigate to Login
```

---

## ✅ Implementation Priority

### Phase 1 (MVP)
1. Auth (Login, Register, OTP)
2. Dashboard
3. Patients (List, View, Create)
4. Scans (Upload, View, Process)

### Phase 2
5. Notifications
6. Analytics
7. User Profile
8. Support Messages

### Phase 3
9. Admin Features
10. Advanced Analytics
11. User Activity

---

## 📱 Screen Navigation Map

```
App
├── AuthStack
│   ├── Login
│   ├── Register
│   └── OtpVerification
└── MainStack
    ├── Dashboard
    │   └── SystemStatus
    ├── PatientsTab
    │   ├── PatientList
    │   ├── PatientDetails
    │   │   └── ScanHistory
    │   └── PatientCreate
    ├── ScansTab
    │   ├── ScanList
    │   ├── ScanUpload
    │   ├── ScanProcessing
    │   └── ScanResults
    ├── AnalyticsTab
    │   ├── Overview
    │   ├── ResultsChart
    │   └── PatientStats
    ├── NotificationsTab
    │   ├── NotificationList
    │   └── NotificationDetail
    └── ProfileTab
        ├── Profile
        ├── EditProfile
        ├── ChangePassword
        ├── LoginHistory
        └── Logout
```

---

## 🐛 Common Issues & Fixes

### Token Not Sending
```typescript
// ❌ Wrong
const response = await fetch('/auth/login');

// ✅ Correct
const token = await AsyncStorage.getItem('auth_token');
const response = await fetch('/auth/login', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Image Upload Failing
```typescript
// ❌ Wrong
const formData = new FormData();
formData.append('file', imageUri); // Just URI

// ✅ Correct
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'scan.jpg'
});
```

### Requests Timing Out
```typescript
// Set appropriate timeout
const api = axios.create({
  timeout: 30000, // 30 seconds
});
```

### State Not Updating
```typescript
// ❌ Wrong
setUsers(users.push(newUser)); // Returns length

// ✅ Correct
setUsers([...users, newUser]); // Returns new array
```

---

## 🧪 Testing Checklist Per Endpoint

For each endpoint, verify:
- [ ] Successful request with valid data
- [ ] Failed request with invalid data
- [ ] Network error handling
- [ ] Token expiry handling
- [ ] Loading state showing
- [ ] Error message displaying
- [ ] Success notification showing
- [ ] UI updating correctly

---

## 📚 Resources

- **Full Endpoint Spec:** See `BACKEND_ENDPOINTS.md`
- **Implementation Checklist:** See `REACT_NATIVE_IMPLEMENTATION_CHECKLIST.md`
- **API Documentation:** `http://localhost:3000/api`
- **Postman Collection:** Available in repo

---

**Ready to start? Copy the service templates above and start building! 🚀**

**Contact:** Backend team for API issues
**Last Updated:** April 20, 2026
