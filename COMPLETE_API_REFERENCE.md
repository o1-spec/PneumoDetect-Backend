# PneumoDetect Backend - Complete API Documentation

## 🚀 ALL ENDPOINTS & PAYLOADS

Use this to verify your React Native implementation is complete and correct!

---

## 📋 TABLE OF CONTENTS
1. [Authentication](#authentication)
2. [Users](#users)
3. [Patients](#patients)
4. [Scans](#scans)
5. [Dashboard](#dashboard)
6. [Analytics](#analytics)
7. [Notifications](#notifications)
8. [Messages](#messages)

---

## 🔐 AUTHENTICATION

### 1️⃣ Register User
**Endpoint:** `POST /auth/register`  
**Authentication:** ❌ Not required  
**Role:** N/A

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123!",
  "name": "Dr. John Smith",
  "specialization": "Radiology",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation:**
- Email must be unique
- Password must be at least 8 chars, contain uppercase, lowercase, number, special char
- Name required
- Phone optional

---

### 2️⃣ Login
**Endpoint:** `POST /auth/login`  
**Authentication:** ❌ Not required  
**Role:** N/A

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 401: Invalid email/password
- 401: Email not verified
- 401: Account inactive

**Tracking:**
- Creates LoginHistory record with IP address and user agent

---

### 3️⃣ Verify OTP
**Endpoint:** `POST /auth/verify-otp`  
**Authentication:** ❌ Not required  
**Role:** N/A

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid-string",
    "email": "doctor@hospital.com",
    "name": "Dr. John Smith",
    "role": "CLINICIAN",
    "specialization": "Radiology",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2026-04-20T10:00:00Z",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 400: Invalid OTP
- 400: OTP expired
- 401: User not found

---

### 4️⃣ Resend OTP
**Endpoint:** `POST /auth/resend-otp`  
**Authentication:** ❌ Not required  
**Role:** N/A

**Request Body:**
```json
{
  "email": "doctor@hospital.com"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent to email"
}
```

**Errors:**
- 401: User not found
- 400: User already verified

---

### 5️⃣ Logout
**Endpoint:** `POST /auth/logout`  
**Authentication:** ✅ Required (Bearer token)  
**Role:** Any authenticated user

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Tracking:**
- Updates LoginHistory record with logout timestamp

---

### 6️⃣ Change Password
**Endpoint:** `POST /auth/change-password`  
**Authentication:** ✅ Required (Bearer token)  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- 400: Passwords don't match
- 400: Current password incorrect
- 401: User not found

---

### 7️⃣ Get Profile
**Endpoint:** `GET /auth/me`  
**Authentication:** ✅ Required (Bearer token)  
**Role:** Any authenticated user

**Request Body:** ❌ None (no body)

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": "https://...",
  "isActive": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 USERS

### 1️⃣ Get Current User Profile
**Endpoint:** `GET /users/profile`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": "https://...",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 2️⃣ Update User Profile
**Endpoint:** `PUT /users/profile`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "name": "Dr. John Smith",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": "https://..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": "https://...",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 3️⃣ Get Recent Activity
**Endpoint:** `GET /users/activity`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "recentScans": [
    {
      "id": "scan-uuid",
      "imageUrl": "https://...",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T10:00:00Z",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid"
    }
  ],
  "recentNotifications": [
    {
      "id": "notif-uuid",
      "title": "Scan Processed",
      "message": "Your scan has been processed",
      "type": "SCAN",
      "read": false,
      "createdAt": "2026-04-20T10:00:00Z"
    }
  ],
  "loginHistory": [
    {
      "id": "login-uuid",
      "loginAt": "2026-04-20T08:30:00Z",
      "logoutAt": "2026-04-20T09:45:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "profileUpdatedAt": "2026-04-15T14:20:00Z"
}
```

---

### 4️⃣ Delete Account
**Endpoint:** `DELETE /users/account`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

**Errors:**
- 400: Password incorrect
- 401: User not found

---

### 5️⃣ Download My Data
**Endpoint:** `GET /users/my-data`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK - JSON file download):**
```json
{
  "user": { ... },
  "scans": [ ... ],
  "patients": [ ... ],
  "notifications": [ ... ]
}
```

---

## 🏥 PATIENTS

### 1️⃣ Create Patient
**Endpoint:** `POST /patients`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN, ADMIN

**Request Body:**
```json
{
  "idNumber": "ID123456",
  "name": "John Doe",
  "age": 55,
  "gender": "MALE"
}
```

**Response (201 Created):**
```json
{
  "id": "patient-uuid",
  "idNumber": "ID123456",
  "name": "John Doe",
  "age": 55,
  "gender": "MALE",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

**Errors:**
- 400: ID Number already exists
- 403: Insufficient permissions

---

### 2️⃣ Get All Patients
**Endpoint:** `GET /patients`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN, ADMIN

**Query Parameters:**
- `skip` (optional): Default 0
- `take` (optional): Default 10
- `search` (optional): Search by name/ID

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "total": 89,
  "patients": [
    {
      "id": "patient-uuid",
      "idNumber": "ID123456",
      "name": "John Doe",
      "age": 55,
      "gender": "MALE",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

---

### 3️⃣ Get Patient by ID
**Endpoint:** `GET /patients/:patientId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN, ADMIN

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "id": "patient-uuid",
  "idNumber": "ID123456",
  "name": "John Doe",
  "age": 55,
  "gender": "MALE",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 4️⃣ Update Patient
**Endpoint:** `PUT /patients/:patientId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN, ADMIN

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 56,
  "gender": "MALE"
}
```

**Response (200 OK):**
```json
{
  "id": "patient-uuid",
  "idNumber": "ID123456",
  "name": "John Doe",
  "age": 56,
  "gender": "MALE",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 5️⃣ Delete Patient
**Endpoint:** `DELETE /patients/:patientId`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "Patient deleted successfully"
}
```

---

## 📸 SCANS

### 1️⃣ Upload Scan
**Endpoint:** `POST /scans/upload`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN, ADMIN

**Request Body (multipart/form-data):**
```
patientId: "patient-uuid"
file: <image-file> (binary)
notes: "Optional notes about scan"
```

**Response (201 Created):**
```json
{
  "id": "scan-uuid",
  "imageUrl": "https://...",
  "heatmapUrl": null,
  "status": "PROCESSING",
  "result": null,
  "confidence": null,
  "modelVersion": null,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid"
}
```

---

### 2️⃣ Get All Scans
**Endpoint:** `GET /scans`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (sees own), ADMIN (sees all)

**Query Parameters:**
- `skip` (optional): Default 0
- `take` (optional): Default 10
- `status` (optional): UPLOADED, PROCESSING, COMPLETED, FAILED
- `result` (optional): PNEUMONIA, NORMAL

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "total": 245,
  "scans": [
    {
      "id": "scan-uuid",
      "imageUrl": "https://...",
      "heatmapUrl": "https://...",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "modelVersion": "v1.0.0",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid"
    }
  ]
}
```

---

### 3️⃣ Get Scan by ID
**Endpoint:** `GET /scans/:scanId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own scans), ADMIN

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "id": "scan-uuid",
  "imageUrl": "https://...",
  "heatmapUrl": "https://...",
  "status": "COMPLETED",
  "result": "PNEUMONIA",
  "confidence": 0.95,
  "modelVersion": "v1.0.0",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid"
}
```

---

### 4️⃣ Get Scans by Patient
**Endpoint:** `GET /scans/patient/:patientId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (if they created them), ADMIN

**Query Parameters:** None

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "count": 5,
  "scans": [
    {
      "id": "scan-uuid",
      "imageUrl": "https://...",
      "heatmapUrl": "https://...",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "modelVersion": "v1.0.0",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid"
    }
  ]
}
```

**Access Control:**
- CLINICIAN: Can only view scans they created
- ADMIN: Can view all scans

---

### 5️⃣ Update Scan Status
**Endpoint:** `PATCH /scans/:scanId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own scans), ADMIN

**Request Body:**
```json
{
  "status": "COMPLETED",
  "result": "PNEUMONIA",
  "confidence": 0.95,
  "modelVersion": "v1.0.0",
  "heatmapUrl": "https://..."
}
```

**Response (200 OK):**
```json
{
  "id": "scan-uuid",
  "imageUrl": "https://...",
  "heatmapUrl": "https://...",
  "status": "COMPLETED",
  "result": "PNEUMONIA",
  "confidence": 0.95,
  "modelVersion": "v1.0.0",
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid"
}
```

---

### 6️⃣ Delete Scan
**Endpoint:** `DELETE /scans/:scanId`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own scans), ADMIN

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "Scan deleted successfully"
}
```

---

## 📊 DASHBOARD

### 1️⃣ Get Dashboard Overview
**Endpoint:** `GET /dashboard/overview`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "summary": {
    "totalScans": 245,
    "pneumoniaDetected": 42,
    "normalScans": 198,
    "processingScans": 5,
    "averageConfidence": 0.916
  },
  "weeklyActivity": {
    "data": [
      {
        "day": "Mon",
        "scans": 12,
        "date": "2026-04-14"
      },
      {
        "day": "Tue",
        "scans": 15,
        "date": "2026-04-15"
      },
      {
        "day": "Wed",
        "scans": 18,
        "date": "2026-04-16"
      },
      {
        "day": "Thu",
        "scans": 14,
        "date": "2026-04-17"
      },
      {
        "day": "Fri",
        "scans": 20,
        "date": "2026-04-18"
      },
      {
        "day": "Sat",
        "scans": 16,
        "date": "2026-04-19"
      },
      {
        "day": "Sun",
        "scans": 8,
        "date": "2026-04-20"
      }
    ],
    "trend": "12.5",
    "trendDirection": "up"
  },
  "recentScans": [
    {
      "id": "scan-uuid",
      "patientName": "John Doe",
      "patientId": "patient-uuid",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "status": "COMPLETED",
      "createdAt": "2026-04-20T10:00:00Z",
      "imageUrl": "https://...",
      "doctorName": "Dr. Smith"
    }
  ],
  "systemStatus": {
    "aiModel": {
      "name": "AI Model",
      "status": "Operational",
      "statusCode": "operational"
    },
    "database": {
      "name": "Database",
      "status": "Connected",
      "statusCode": "connected",
      "recordCount": 8742
    },
    "storage": {
      "name": "Storage",
      "status": "78% Used",
      "statusCode": "operational",
      "usedGB": "7.8",
      "totalGB": 100,
      "percentage": "7.8"
    }
  }
}
```

---

### 2️⃣ Get Weekly Activity
**Endpoint:** `GET /dashboard/weekly-activity`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "data": [
    {
      "day": "Mon",
      "scans": 12,
      "date": "2026-04-14"
    },
    {
      "day": "Tue",
      "scans": 15,
      "date": "2026-04-15"
    },
    {
      "day": "Wed",
      "scans": 18,
      "date": "2026-04-16"
    },
    {
      "day": "Thu",
      "scans": 14,
      "date": "2026-04-17"
    },
    {
      "day": "Fri",
      "scans": 20,
      "date": "2026-04-18"
    },
    {
      "day": "Sat",
      "scans": 16,
      "date": "2026-04-19"
    },
    {
      "day": "Sun",
      "scans": 8,
      "date": "2026-04-20"
    }
  ],
  "trend": "12.5",
  "trendDirection": "up"
}
```

---

### 3️⃣ Get Recent Scans
**Endpoint:** `GET /dashboard/recent-scans`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
[
  {
    "id": "scan-uuid",
    "patientName": "John Doe",
    "patientId": "patient-uuid",
    "result": "PNEUMONIA",
    "confidence": 0.95,
    "status": "COMPLETED",
    "createdAt": "2026-04-20T10:00:00Z",
    "imageUrl": "https://...",
    "doctorName": "Dr. Smith"
  }
]
```

---

### 4️⃣ Get System Status
**Endpoint:** `GET /dashboard/system-status`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "aiModel": {
    "name": "AI Model",
    "status": "Operational",
    "statusCode": "operational"
  },
  "database": {
    "name": "Database",
    "status": "Connected",
    "statusCode": "connected",
    "recordCount": 8742
  },
  "storage": {
    "name": "Storage",
    "status": "78% Used",
    "statusCode": "operational",
    "usedGB": "7.8",
    "totalGB": 100,
    "percentage": "7.8"
  }
}
```

---

## 📈 ANALYTICS

### 1️⃣ Get Analytics Dashboard
**Endpoint:** `GET /analytics/dashboard`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own data), ADMIN (all data)

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "summary": {
    "totalScans": 245,
    "totalPatients": 89,
    "pneumoniaDetected": 42,
    "normalScans": 198,
    "processingScans": 5,
    "accuracyRate": 94.8,
    "averageConfidence": 0.916
  },
  "todayMetrics": {
    "scansCount": 12,
    "patientsCount": 8,
    "pneumoniaCount": 3,
    "normalCount": 9,
    "avgConfidence": 0.924
  },
  "thisWeekMetrics": {
    "scansCount": 67,
    "patientsCount": 32,
    "pneumoniaCount": 15,
    "normalCount": 52,
    "avgConfidence": 0.91
  },
  "thisMonthMetrics": {
    "scansCount": 189,
    "patientsCount": 78,
    "pneumoniaCount": 38,
    "normalCount": 145,
    "avgConfidence": 0.908
  },
  "topPatients": [
    {
      "id": "patient-uuid",
      "name": "John Doe",
      "scanCount": 12,
      "lastScanDate": "2026-04-20T10:00:00Z"
    }
  ],
  "recentScans": [
    {
      "id": "scan-uuid",
      "patientName": "Jane Smith",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T09:30:00Z"
    }
  ]
}
```

---

### 2️⃣ Get Scan Results Statistics
**Endpoint:** `GET /analytics/scans/results`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own data), ADMIN (all data)

**Query Parameters:**
- `dateFrom` (optional): ISO date string "2026-04-01"
- `dateTo` (optional): ISO date string "2026-04-30"
- `groupBy` (optional): "day", "week", "month" (default: "day")

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "statistics": {
    "total": 245,
    "pneumonia": {
      "count": 42,
      "percentage": 17.14,
      "avgConfidence": 0.925
    },
    "normal": {
      "count": 198,
      "percentage": 80.82,
      "avgConfidence": 0.912
    },
    "processing": {
      "count": 5,
      "percentage": 2.04
    }
  },
  "timeline": [
    {
      "date": "2026-04-20",
      "pneumonia": 3,
      "normal": 9,
      "processing": 0,
      "total": 12,
      "avgConfidence": 0.918
    }
  ],
  "confidenceDistribution": {
    "excellent": 145,
    "good": 78,
    "fair": 22
  }
}
```

---

### 3️⃣ Get Patient Analytics
**Endpoint:** `GET /analytics/patients`  
**Authentication:** ✅ Required  
**Role:** CLINICIAN (own data), ADMIN (all data)

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "summary": {
    "totalPatients": 89,
    "newPatientsThisMonth": 12,
    "patientsWithPneumonia": 34,
    "averageScansPerPatient": 2.75
  },
  "topPatients": [
    {
      "id": "patient-uuid",
      "idNumber": "ID123456",
      "name": "John Doe",
      "age": 55,
      "gender": "MALE",
      "totalScans": 8,
      "pneumoniaScans": 3,
      "normalScans": 5,
      "lastScanDate": "2026-04-20T10:00:00Z",
      "pneumoniaPercentage": 37.5
    }
  ],
  "newPatients": [
    {
      "id": "patient-uuid",
      "name": "Jane Smith",
      "createdAt": "2026-04-18T14:30:00Z"
    }
  ]
}
```

---

### 4️⃣ Get Doctor Analytics
**Endpoint:** `GET /analytics/doctors`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "summary": {
    "totalDoctors": 24,
    "activeDoctorsThisMonth": 18,
    "totalScansUploaded": 245,
    "averageScansPerDoctor": 10.2
  },
  "doctorStats": [
    {
      "id": "doctor-uuid",
      "name": "Dr. John Doe",
      "email": "john@hospital.com",
      "specialization": "Radiology",
      "totalScans": 45,
      "scansThisMonth": 12,
      "pneumoniaDetected": 8,
      "accuracyRate": 95.6,
      "averageConfidence": 0.928,
      "lastActiveAt": "2026-04-20T10:00:00Z"
    }
  ],
  "activityTrend": [
    {
      "date": "2026-04-20",
      "totalScans": 12,
      "activeDoctors": 8
    }
  ]
}
```

---

### 5️⃣ Get Model Performance
**Endpoint:** `GET /analytics/model-performance`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "overall": {
    "totalScans": 245,
    "accuracy": 94.8,
    "precision": 0.943,
    "recall": 0.952,
    "f1Score": 0.947,
    "averageConfidence": 0.916
  },
  "byModelVersion": [
    {
      "version": "v1.0.0",
      "scansProcessed": 189,
      "accuracy": 94.2,
      "precision": 0.938,
      "recall": 0.948,
      "f1Score": 0.943,
      "avgConfidence": 0.912
    }
  ],
  "confidenceThresholds": {
    "aboveNinety": {
      "count": 145,
      "accuracy": 98.6,
      "percentage": 59.2
    },
    "eightyToNinety": {
      "count": 78,
      "accuracy": 92.3,
      "percentage": 31.8
    },
    "belowEighty": {
      "count": 22,
      "accuracy": 81.8,
      "percentage": 9.0
    }
  }
}
```

---

### 6️⃣ Get Activity Timeline
**Endpoint:** `GET /analytics/activity-timeline`  
**Authentication:** ✅ Required  
**Role:** ADMIN (can filter by userId), CLINICIAN (sees own only)

**Query Parameters:**
- `userId` (optional): ADMIN can filter by user
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `limit` (optional): Default 50

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "timeline": [
    {
      "id": "activity-1",
      "type": "SCAN_UPLOADED",
      "userId": "doctor-uuid",
      "userName": "Dr. John Doe",
      "patientId": "patient-uuid",
      "patientName": "Jane Smith",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "timestamp": "2026-04-20T10:30:00Z",
      "details": "X-ray scan uploaded and processed"
    },
    {
      "id": "activity-2",
      "type": "USER_LOGIN",
      "userId": "doctor-uuid",
      "userName": "Dr. John Doe",
      "ipAddress": "192.168.1.100",
      "timestamp": "2026-04-20T08:30:00Z",
      "details": "User logged in"
    }
  ],
  "total": 245
}
```

---

## 🔔 NOTIFICATIONS

### 1️⃣ Get All Notifications
**Endpoint:** `GET /notifications`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Query Parameters:**
- `skip` (optional): Default 0
- `take` (optional): Default 20
- `read` (optional): true/false

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "total": 45,
  "notifications": [
    {
      "id": "notif-uuid",
      "title": "Scan Processed",
      "message": "Your scan for patient John Doe has been processed",
      "type": "SCAN",
      "read": false,
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

---

### 2️⃣ Get Notification by ID
**Endpoint:** `GET /notifications/:notificationId`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "id": "notif-uuid",
  "title": "Scan Processed",
  "message": "Your scan for patient John Doe has been processed",
  "type": "SCAN",
  "read": false,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 3️⃣ Mark Notification as Read
**Endpoint:** `PATCH /notifications/:notificationId`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:**
```json
{
  "read": true
}
```

**Response (200 OK):**
```json
{
  "id": "notif-uuid",
  "title": "Scan Processed",
  "message": "Your scan for patient John Doe has been processed",
  "type": "SCAN",
  "read": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 4️⃣ Mark All Notifications as Read
**Endpoint:** `POST /notifications/read-all`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 12
}
```

---

### 5️⃣ Delete Notification
**Endpoint:** `DELETE /notifications/:notificationId`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

### 6️⃣ Delete All Notifications
**Endpoint:** `DELETE /notifications`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "All notifications deleted successfully",
  "deletedCount": 45
}
```

---

## 💬 MESSAGES

### 1️⃣ Send Message
**Endpoint:** `POST /messages/send`  
**Authentication:** ❌ Not required (guest message support)  
**Role:** N/A

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about PneumoDetect",
  "message": "I have a question about how to use the platform",
  "contactEmail": "john@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": "message-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about PneumoDetect",
  "message": "I have a question about how to use the platform",
  "contactEmail": "john@example.com",
  "responded": false,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 2️⃣ Get All Messages
**Endpoint:** `GET /messages`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Query Parameters:**
- `skip` (optional): Default 0
- `take` (optional): Default 20
- `responded` (optional): true/false

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "total": 34,
  "messages": [
    {
      "id": "message-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Question about PneumoDetect",
      "message": "I have a question about how to use the platform",
      "contactEmail": "john@example.com",
      "responded": false,
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

---

### 3️⃣ Get Message by ID
**Endpoint:** `GET /messages/:messageId`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "id": "message-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about PneumoDetect",
  "message": "I have a question about how to use the platform",
  "contactEmail": "john@example.com",
  "responded": false,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 4️⃣ Mark Message as Responded
**Endpoint:** `PATCH /messages/:messageId`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:**
```json
{
  "responded": true
}
```

**Response (200 OK):**
```json
{
  "id": "message-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about PneumoDetect",
  "message": "I have a question about how to use the platform",
  "contactEmail": "john@example.com",
  "responded": true,
  "createdAt": "2026-04-20T10:00:00Z",
  "updatedAt": "2026-04-20T10:00:00Z"
}
```

---

### 5️⃣ Delete Message
**Endpoint:** `DELETE /messages/:messageId`  
**Authentication:** ✅ Required  
**Role:** ADMIN only

**Request Body:** ❌ None

**Response (200 OK):**
```json
{
  "message": "Message deleted successfully"
}
```

---

## 🔒 AUTHENTICATION HEADERS

All endpoints marked with ✅ **Required** need:

```
Authorization: Bearer {accessToken}
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/users/profile
```

---

## 🎯 QUICK REFERENCE

### By Feature

**Authentication Flow:**
1. POST /auth/register
2. POST /auth/verify-otp
3. POST /auth/login
4. GET /auth/me (verify token works)
5. POST /auth/logout

**Patient & Scan Flow:**
1. POST /patients (create patient)
2. POST /scans/upload (upload scan)
3. GET /scans/patient/:patientId (view all scans)
4. PATCH /scans/:scanId (update results)

**Dashboard Flow:**
1. GET /dashboard/overview
2. GET /dashboard/weekly-activity
3. GET /dashboard/recent-scans
4. GET /dashboard/system-status

**Analytics Flow:**
1. GET /analytics/dashboard
2. GET /analytics/scans/results
3. GET /analytics/patients
4. GET /analytics/doctors (ADMIN)

---

## ✅ VERIFICATION CHECKLIST

Use this to verify your React Native implementation:

- [ ] All 7 auth endpoints working
- [ ] All 5 user endpoints working
- [ ] All 5 patient endpoints working
- [ ] All 6 scan endpoints working
- [ ] All 4 dashboard endpoints working
- [ ] All 6 analytics endpoints working
- [ ] All 6 notification endpoints working
- [ ] All 5 message endpoints working
- [ ] Bearer token passed in Authorization header
- [ ] Proper error handling for all endpoints
- [ ] Access control enforced (role-based)
- [ ] Pagination working (skip/take)
- [ ] Filters working (status, result, etc.)

---

**Total Endpoints:** 44  
**Last Updated:** April 20, 2026  
**Status:** ✅ Production Ready
