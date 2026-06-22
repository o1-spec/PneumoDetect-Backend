# Backend API Payload Reference Guide
## Complete Request/Response Structures for All Endpoints

**Status:** ✅ Production Ready  
**Version:** 1.1.0 (Updated with scan updates, admin dashboards, and activity log integrations)

---

## 📋 Table of Contents

1. [Authentication Endpoints (`/auth`)](#1-authentication-endpoints-auth)
2. [User Profile Endpoints (`/users`)](#2-user-profile-endpoints-users)
3. [Patient Management Endpoints (`/patients`)](#3-patient-management-endpoints-patients)
4. [Scan Management Endpoints (`/scans`)](#4-scan-management-endpoints-scans)
5. [Dashboard & Analytics Endpoints (`/analytics` & `/dashboard`)](#5-dashboard--analytics-endpoints-analytics--dashboard)
6. [Support Messages Endpoints (`/messages`)](#6-support-messages-endpoints-messages)
7. [Notification Endpoints (`/notifications`)](#7-notification-endpoints-notifications)
8. [AI Engine Endpoints (`/ai`)](#8-ai-engine-endpoints-ai)
9. [Error Payloads](#9-error-payloads)

---

## 1. Authentication Endpoints (`/auth`)

### 1.1 Register User
* **Endpoint:** `POST /auth/register`
* **Auth Required:** ❌ No
* **Request Payload:**
  ```json
  {
    "email": "doctor@example.com",
    "password": "SecurePass123!",
    "name": "Dr. Jane Doe",
    "role": "CLINICIAN",
    "phone": "+1234567890",
    "specialization": "Pulmonology"
  }
  ```
  *(Note: `role` can be `"CLINICIAN"`, `"PATIENT"`, or `"ADMIN"`)*
* **Response Payload (201 Created):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "doctor@example.com",
    "name": "Dr. Jane Doe",
    "role": "CLINICIAN",
    "specialization": "Pulmonology",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-06-22T18:00:00.000Z",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 1.2 Login User
* **Endpoint:** `POST /auth/login`
* **Auth Required:** ❌ No
* **Request Payload:**
  ```json
  {
    "email": "doctor@example.com",
    "password": "SecurePass123!"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "doctor@example.com",
    "name": "Dr. Jane Doe",
    "role": "CLINICIAN",
    "specialization": "Pulmonology",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-06-22T18:00:00.000Z",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 1.3 Get Current User Profile
* **Endpoint:** `GET /auth/me`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "doctor@example.com",
    "name": "Dr. Jane Doe",
    "role": "CLINICIAN",
    "specialization": "Pulmonology",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-06-22T18:00:00.000Z"
  }
  ```

### 1.4 Verify Email OTP
* **Endpoint:** `POST /auth/verify-otp`
* **Auth Required:** ❌ No
* **Request Payload:**
  ```json
  {
    "email": "doctor@example.com",
    "otp": "123456"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "message": "Email verified successfully",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 1.5 Resend OTP
* **Endpoint:** `POST /auth/resend-otp`
* **Auth Required:** ❌ No
* **Request Payload:**
  ```json
  {
    "email": "doctor@example.com"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "message": "OTP resent successfully"
  }
  ```

### 1.6 Request Password Reset Link
* **Endpoint:** `POST /auth/forgot-password`
* **Auth Required:** ❌ No
* **Request Payload:**
  ```json
  {
    "email": "doctor@example.com"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "message": "Password reset email sent if account exists"
  }
  ```

### 1.7 Change Password
* **Endpoint:** `POST /auth/change-password`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Payload:**
  ```json
  {
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

### 1.8 Logout
* **Endpoint:** `POST /auth/logout`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  {
    "message": "User logged out successfully"
  }
  ```

---

## 2. User Profile Endpoints (`/users`)

### 2.1 Update User Profile details
* **Endpoint:** `PATCH /users/profile`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Payload:**
  ```json
  {
    "name": "Dr. Jane Doe Updated",
    "phone": "+19876543210",
    "specialization": "Radiology",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "email": "doctor@example.com",
    "name": "Dr. Jane Doe Updated",
    "role": "CLINICIAN",
    "specialization": "Radiology",
    "phone": "+19876543210",
    "avatarUrl": "https://example.com/avatar.jpg",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-06-22T18:00:00.000Z"
  }
  ```

### 2.2 Download Personal Data (GDPR)
* **Endpoint:** `GET /users/download-data`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response:** Returns file download as JSON containing all scan histories, user profiles, notifications, and login history structures.

### 2.3 Get Patient Specific Profile
* **Endpoint:** `GET /users/patient-profile`
* **Auth Required:** ✅ Yes (Requires `PATIENT` role)
* **Response Payload (200 OK):**
  ```json
  {
    "id": "profile-uuid-12345",
    "userId": "user-uuid-12345",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "FEMALE",
    "bloodType": "O+",
    "medicalHistory": "No chronic issues",
    "emergencyContactName": "John Doe",
    "emergencyContactPhone": "+1234567890",
    "emergencyContactRelationship": "Spouse"
  }
  ```

### 2.4 Update Patient Specific Profile
* **Endpoint:** `PUT /users/patient-profile`
* **Auth Required:** ✅ Yes (Requires `PATIENT` or `ADMIN` role)
* **Request Payload:**
  ```json
  {
    "name": "Jane Smith",
    "phone": "+1987654321",
    "dateOfBirth": "1990-05-15",
    "gender": "FEMALE",
    "bloodType": "O+",
    "medicalHistory": "Mild asthma",
    "emergencyContact": {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "Spouse"
    }
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "userId": "user-uuid-12345",
    "email": "jane@example.com",
    "name": "Jane Smith",
    "phone": "+1987654321",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "age": 36,
    "gender": "FEMALE",
    "bloodType": "O+",
    "medicalHistory": "Mild asthma",
    "emergencyContact": {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "Spouse"
    },
    "updatedAt": "2026-06-22T18:10:00.000Z"
  }
  ```

### 2.5 Get User Activity History [NEW]
* **Endpoint:** `GET /users/activity`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  {
    "recentScans": [
      {
        "id": "scan-uuid-123",
        "imageUrl": "https://example.com/scan.jpg",
        "heatmapUrl": "https://example.com/heatmap.jpg",
        "result": "PNEUMONIA",
        "confidence": 0.92,
        "status": "COMPLETED",
        "createdAt": "2026-06-22T18:00:00.000Z",
        "updatedAt": "2026-06-22T18:01:00.000Z",
        "patientName": "Jane Smith"
      }
    ],
    "recentNotifications": [
      {
        "id": "notif-uuid-456",
        "title": "Diagnosis Uploaded",
        "message": "Pneumonia Suspected (92.0% confidence) for patient Jane Smith",
        "type": "SCAN",
        "createdAt": "2026-06-22T18:01:00.000Z",
        "isRead": false
      }
    ],
    "loginHistory": [
      {
        "id": "login-uuid-789",
        "loginAt": "2026-06-22T17:50:00.000Z",
        "logoutAt": null,
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)..."
      }
    ],
    "profileUpdatedAt": "2026-06-22T18:10:00.000Z"
  }
  ```

### 2.6 Get Login History [NEW]
* **Endpoint:** `GET /users/activity/login`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  [
    {
      "id": "login-uuid-789",
      "loginAt": "2026-06-22T17:50:00.000Z",
      "logoutAt": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)..."
    }
  ]
  ```

---

## 3. Patient Management Endpoints (`/patients`)

### 3.1 Create Patient Clinical Record
* **Endpoint:** `POST /patients`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Payload:**
  ```json
  {
    "idNumber": "PAT-9988-77",
    "name": "Jane Smith",
    "age": 36,
    "gender": "FEMALE"
  }
  ```
* **Response Payload (201 Created):**
  ```json
  {
    "id": "patient-uuid-12345",
    "idNumber": "PAT-9988-77",
    "name": "Jane Smith",
    "age": 36,
    "gender": "FEMALE",
    "createdAt": "2026-06-22T18:00:00.000Z",
    "updatedAt": "2026-06-22T18:00:00.000Z"
  }
  ```

### 3.2 Get Patient by ID
* **Endpoint:** `GET /patients/:id`
* **Query Parameters:** `?includeScans=true` (optional)
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  {
    "id": "patient-uuid-12345",
    "idNumber": "PAT-9988-77",
    "name": "Jane Smith",
    "age": 36,
    "gender": "FEMALE",
    "createdAt": "2026-06-22T18:00:00.000Z",
    "updatedAt": "2026-06-22T18:00:00.000Z",
    "scans": [
      {
        "id": "scan-uuid-123",
        "imageUrl": "https://example.com/scan.jpg",
        "status": "COMPLETED",
        "result": "PNEUMONIA",
        "confidence": 0.92,
        "createdAt": "2026-06-22T18:00:00.000Z"
      }
    ]
  }
  ```

### 3.3 Update Patient details
* **Endpoint:** `PATCH /patients/:id`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Payload:**
  ```json
  {
    "name": "Jane Doe Smith",
    "age": 37
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "id": "patient-uuid-12345",
    "idNumber": "PAT-9988-77",
    "name": "Jane Doe Smith",
    "age": 37,
    "gender": "FEMALE",
    "createdAt": "2026-06-22T18:00:00.000Z",
    "updatedAt": "2026-06-22T18:15:00.000Z"
  }
  ```

### 3.4 Link Patient to User (Registered Account)
* **Endpoint:** `PATCH /patients/:id/link-user`
* **Auth Required:** ✅ Yes (Requires `ADMIN` role)
* **Request Payload:**
  ```json
  {
    "userId": "user-uuid-12345"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "id": "patient-uuid-12345",
    "idNumber": "PAT-9988-77",
    "name": "Jane Doe Smith",
    "userId": "user-uuid-12345"
  }
  ```

---

## 4. Scan Management Endpoints (`/scans`)

### 4.1 Upload Scan (X-Ray Image)
* **Endpoint:** `POST /scans/upload`
* **Headers:** `Content-Type: multipart/form-data`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Form-Data:**
  * `image`: File (JPG/JPEG/PNG binary data)
  * `patientId`: "patient-uuid-12345" (string)
* **Response Payload (201 Created):**
  ```json
  {
    "message": "Scan uploaded successfully",
    "scan": {
      "id": "scan-uuid-123",
      "imageUrl": "https://res.cloudinary.com/.../xray.png",
      "patientId": "patient-uuid-12345",
      "clinicianId": "doctor-uuid-12345",
      "status": "PENDING",
      "result": null,
      "confidence": null,
      "createdAt": "2026-06-22T18:00:00.000Z"
    }
  }
  ```

### 4.2 Process Scan (ML Pipeline mock/inference)
* **Endpoint:** `POST /scans/:id/process`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Request Payload:**
  ```json
  {
    "result": "PNEUMONIA",
    "confidence": 0.92,
    "heatmapUrl": "https://res.cloudinary.com/.../heatmap.png"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "message": "Scan processed successfully",
    "scan": {
      "id": "scan-uuid-123",
      "imageUrl": "https://res.cloudinary.com/.../xray.png",
      "heatmapUrl": "https://res.cloudinary.com/.../heatmap.png",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.92,
      "patientId": "patient-uuid-12345",
      "createdAt": "2026-06-22T18:00:00.000Z",
      "analyzedAt": "2026-06-22T18:01:00.000Z"
    }
  }
  ```

### 4.3 General Scan Update (Notes & diagnosis corrections) [NEW]
* **Endpoint:** `PATCH /scans/:id`
* **Auth Required:** ✅ Yes (Requires `CLINICIAN` or `ADMIN` role)
* **Request Payload:**
  ```json
  {
    "notes": "Consolidation in lower right lobe. Follow-up recommended.",
    "result": "PNEUMONIA"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "id": "scan-uuid-123",
    "imageUrl": "https://res.cloudinary.com/.../xray.png",
    "heatmapUrl": "https://res.cloudinary.com/.../heatmap.png",
    "result": "PNEUMONIA",
    "confidence": 0.92,
    "status": "COMPLETED",
    "createdAt": "2026-06-22T18:00:00.000Z",
    "analyzedAt": "2026-06-22T18:01:00.000Z",
    "clinicianNotes": "Consolidation in lower right lobe. Follow-up recommended.",
    "patientNotes": null,
    "doctorName": "Dr. Jane Doe"
  }
  ```

### 4.4 Get My Scans (Patient list)
* **Endpoint:** `GET /scans/patient/my-scans/list`
* **Auth Required:** ✅ Yes (Requires `PATIENT` role)
* **Response Payload (200 OK):**
  ```json
  {
    "count": 1,
    "scans": [
      {
        "id": "scan-uuid-123",
        "result": "PNEUMONIA",
        "confidence": 0.92,
        "createdAt": "2026-06-22T18:00:00.000Z"
      }
    ]
  }
  ```

### 4.5 View Scan Patient safe details
* **Endpoint:** `GET /scans/patient/:scanId/view`
* **Auth Required:** ✅ Yes (Requires `PATIENT` role)
* **Response Payload (200 OK):**
  ```json
  {
    "id": "scan-uuid-123",
    "imageUrl": "https://res.cloudinary.com/.../xray.png",
    "heatmapUrl": "https://res.cloudinary.com/.../heatmap.png",
    "result": "PNEUMONIA",
    "confidence": 0.92,
    "confidencePercentage": "92.0%",
    "status": "COMPLETED",
    "createdAt": "2026-06-22T18:00:00.000Z",
    "analyzedAt": "2026-06-22T18:01:00.000Z",
    "doctorName": "Dr. Jane Doe",
    "clinicianNotes": "Consolidation in lower right lobe. Follow-up recommended.",
    "patientNotes": null,
    "recommendations": [
      "Consult with a healthcare provider for confirmation",
      "Follow-up imaging may be needed",
      "Monitor symptoms closely",
      "Consider seeking specialist evaluation"
    ],
    "disclaimer": "This AI analysis is assistive only and should not be used as a substitute for professional medical advice."
  }
  ```

---

## 5. Dashboard & Analytics Endpoints (`/analytics` & `/dashboard`)

### 5.1 Get Unified Dashboard Metrics [NEW]
* **Endpoint:** `GET /analytics/dashboard`
* **Auth Required:** ✅ Yes (`Authorization: Bearer <JWT>`)
* **Response Payload (200 OK):**
  ```json
  {
    "totalScans": 15,
    "totalPatients": 3,
    "pneumoniaDetected": 5,
    "normalScans": 10,
    "accuracyRate": 100.0,
    "averageConfidence": 0.8955,
    "todayMetrics": {
      "scans": 2,
      "pneumonia": 1,
      "normal": 1
    },
    "thisWeekMetrics": {
      "scans": 7,
      "pneumonia": 2,
      "normal": 5
    },
    "thisMonthMetrics": {
      "scans": 15,
      "pneumonia": 5,
      "normal": 10
    },
    "recentScans": [
      {
        "id": "scan-uuid-123",
        "imageUrl": "https://res.cloudinary.com/.../xray.png",
        "heatmapUrl": null,
        "status": "COMPLETED",
        "result": "PNEUMONIA",
        "confidence": 0.92,
        "createdAt": "2026-06-22T18:00:00.000Z",
        "updatedAt": "2026-06-22T18:01:00.000Z",
        "patientId": "patient-uuid-12345",
        "patient": {
          "id": "patient-uuid-12345",
          "idNumber": "PAT-9988-77",
          "name": "Jane Smith"
        }
      }
    ],
    "topPatients": [
      {
        "id": "patient-uuid-12345",
        "name": "Jane Smith",
        "scanCount": 5,
        "pneumoniaDetected": 2
      }
    ]
  }
  ```

### 5.2 Get Analytics stats
* **Endpoint:** `GET /analytics/stats`
* **Response Payload (200 OK):**
  ```json
  {
    "totalScans": 15,
    "completedScans": 15,
    "processingScans": 0,
    "failedScans": 0,
    "pneumoniaCases": 5,
    "normalCases": 10,
    "averageConfidence": 0.8955,
    "recentScans": []
  }
  ```

### 5.3 Get Scan Result Distribution
* **Endpoint:** `GET /analytics/scans/results`
* **Response Payload (200 OK):**
  ```json
  {
    "resultBreakdown": {
      "pneumonia": 5,
      "normal": 10,
      "concerns": 0,
      "pneumoniaPercentage": 33.33,
      "normalPercentage": 66.67,
      "concernsPercentage": 0.0
    },
    "confidenceDistribution": {
      "excellent": 8,
      "good": 5,
      "fair": 2
    },
    "timelineData": [
      {
        "date": "2026-06-22",
        "scans": 2,
        "pneumonia": 1,
        "normal": 1,
        "concerns": 0,
        "averageConfidence": 0.91
      }
    ],
    "totalScans": 15,
    "averageConfidence": 0.8955
  }
  ```

---

## 6. Support Messages Endpoints (`/messages`)

### 6.1 Send Support Message
* **Endpoint:** `POST /messages/send`
* **Request Payload:**
  ```json
  {
    "subject": "App crashes on start",
    "message": "When opening the app on my Android tablet, it immediately closes."
  }
  ```
* **Response Payload (201 Created):**
  ```json
  {
    "message": "Contact message submitted successfully"
  }
  ```

---

## 7. Notification Endpoints (`/notifications`)

### 7.1 Get User Notifications
* **Endpoint:** `GET /notifications`
* **Response Payload (200 OK):**
  ```json
  {
    "count": 1,
    "unreadCount": 1,
    "notifications": [
      {
        "id": "notif-uuid-456",
        "title": "Diagnosis Uploaded",
        "message": "Pneumonia Suspected for patient Jane Smith",
        "type": "SCAN",
        "isRead": false,
        "createdAt": "2026-06-22T18:01:00.000Z"
      }
    ]
  }
  ```

### 7.2 Mark All Notifications as Read
* **Endpoint:** `POST /notifications/mark-all-read`
* **Response Payload (200 OK):**
  ```json
  {
    "updatedCount": 1
  }
  ```

---

## 8. AI Engine Endpoints (`/ai`)

### 8.1 ML Predict Pneumonia
* **Endpoint:** `POST /ai/predict`
* **Request Payload:**
  ```json
  {
    "imageUrl": "https://res.cloudinary.com/.../xray.png"
  }
  ```
* **Response Payload (200 OK):**
  ```json
  {
    "result": "PNEUMONIA",
    "confidence": 0.9224,
    "rawPrediction": 0.9224
  }
  ```

---

## 9. Error Payloads

All endpoints return unified, clear JSON structures for validation and runtime errors.

### 9.1 Validation Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

### 9.2 Unauthorized Error (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 9.3 Forbidden Access (403 Forbidden)
```json
{
  "statusCode": 403,
  "message": "You do not have permission to view this resource",
  "error": "Forbidden"
}
```

### 9.4 Resource Not Found (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Scan with ID scan-123 not found",
  "error": "Not Found"
}
```
