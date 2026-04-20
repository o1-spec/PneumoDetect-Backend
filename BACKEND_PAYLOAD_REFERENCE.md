# Backend API Payload Reference Guide
## Complete Request/Response Structures for All Endpoints

**Date:** April 20, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Authentication Payloads](#authentication-payloads)
2. [Dashboard & Analytics Payloads](#dashboard--analytics-payloads)
3. [Scan Management Payloads](#scan-management-payloads)
4. [Patient Management Payloads](#patient-management-payloads)
5. [User Profile Payloads](#user-profile-payloads)
6. [Admin Payloads](#admin-payloads)
7. [Notification Payloads](#notification-payloads)
8. [Error Response Payloads](#error-response-payloads)
9. [Enum Values Reference](#enum-values-reference)

---

# AUTHENTICATION PAYLOADS

## 1. Register Request

**Endpoint:** `POST /auth/register`  
**Status Code:** 201 Created  
**Auth Required:** ❌ No

### Request Payload

```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123!",
  "name": "Dr. John Doe",
  "role": "CLINICIAN",
  "phone": "+1234567890",
  "specialization": "Radiology",
  "yearsOfExperience": 10,
  "licenseNumber": "LIC123456"
}
```

**Field Validation Rules:**
```typescript
{
  email: string (required, valid email format),
  password: string (required, min 8 characters, strong password),
  name: string (required, 1-100 characters),
  role: enum (required, "CLINICIAN" | "PATIENT" | "ADMIN"),
  phone: string (optional, valid phone format),
  
  // CLINICIAN only:
  specialization: string (optional, max 100 chars),
  yearsOfExperience: number (optional, 0-80),
  licenseNumber: string (optional, max 50 chars),
  
  // PATIENT only:
  dateOfBirth: string (optional, ISO date format "YYYY-MM-DD"),
  gender: enum (optional, "MALE" | "FEMALE" | "OTHER"),
  bloodType: string (optional, "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"),
  medicalHistory: string (optional, text max 1000 chars)
}
```

### Response Payload

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "isVerified": false,
  "createdAt": "2026-04-20T10:30:00.000Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Login Request

**Endpoint:** `POST /auth/login`  
**Status Code:** 200 OK  
**Auth Required:** ❌ No

### Request Payload

```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123!"
}
```

**Field Validation:**
```typescript
{
  email: string (required, valid email),
  password: string (required, non-empty)
}
```

### Response Payload

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-04-20T10:30:00.000Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Verify OTP Request

**Endpoint:** `POST /auth/verify-otp`  
**Status Code:** 200 OK  
**Auth Required:** ❌ No

### Request Payload

```json
{
  "email": "doctor@example.com",
  "otp": "123456"
}
```

**Field Validation:**
```typescript
{
  email: string (required, valid email),
  otp: string (required, exactly 6 digits)
}
```

### Response Payload

```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@example.com",
    "name": "Dr. John Doe",
    "role": "CLINICIAN",
    "isVerified": true,
    "isActive": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. Resend OTP Request

**Endpoint:** `POST /auth/resend-otp`  
**Status Code:** 200 OK  
**Auth Required:** ❌ No

### Request Payload

```json
{
  "email": "doctor@example.com"
}
```

**Field Validation:**
```typescript
{
  email: string (required, valid email format)
}
```

### Response Payload

```json
{
  "message": "OTP sent to your email address"
}
```

---

## 5. Forgot Password Request

**Endpoint:** `POST /auth/forgot-password`  
**Status Code:** 200 OK  
**Auth Required:** ❌ No

### Request Payload

```json
{
  "email": "doctor@example.com"
}
```

**Field Validation:**
```typescript
{
  email: string (required, valid email)
}
```

### Response Payload

```json
{
  "message": "If an account exists with this email, you will receive password reset instructions."
}
```

**Security Note:** Generic message for both existing and non-existing emails

---

## 6. Change Password Request

**Endpoint:** `POST /auth/change-password`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Headers:** `Authorization: Bearer {token}`

### Request Payload

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Field Validation:**
```typescript
{
  currentPassword: string (required, non-empty),
  newPassword: string (required, min 8 chars, strong),
  confirmPassword: string (required, must match newPassword)
}
```

### Response Payload

```json
{
  "message": "Password changed successfully"
}
```

---

## 7. Logout Request

**Endpoint:** `POST /auth/logout`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Headers:** `Authorization: Bearer {token}`

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "message": "Logged out successfully"
}
```

---

## 8. Get Current User Profile

**Endpoint:** `GET /auth/me`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Headers:** `Authorization: Bearer {token}`

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-04-20T10:30:00.000Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

# DASHBOARD & ANALYTICS PAYLOADS

## 1. Get Dashboard Statistics

**Endpoint:** `GET /analytics/stats`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Headers:** `Authorization: Bearer {token}`

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "totalScans": 1250,
  "completedScans": 1200,
  "processingScans": 3,
  "failedScans": 47,
  "pneumoniaCases": 350,
  "normalCases": 850,
  "averageConfidence": 0.8754,
  "weekGrowthPercentage": 12.5,
  "previousWeekScans": 980,
  "recentScans": [
    {
      "id": "scan-001",
      "imageUrl": "https://cloudinary.../xray.jpg",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T14:30:00Z",
      "patient": {
        "id": "patient-001",
        "name": "John Smith",
        "idNumber": "P001"
      }
    }
  ]
}
```

---

## 2. Get Scan Results Breakdown

**Endpoint:** `GET /analytics/scans/results`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "resultBreakdown": {
    "pneumonia": 350,
    "normal": 850,
    "concerns": 50,
    "pneumoniaPercentage": 29.17,
    "normalPercentage": 70.83,
    "concernsPercentage": 4.17
  },
  "confidenceDistribution": {
    "excellent": 900,
    "good": 280,
    "fair": 70
  },
  "timelineData": [
    {
      "date": "2026-04-14",
      "scans": 120,
      "pneumonia": 35,
      "normal": 75,
      "concerns": 10,
      "averageConfidence": 0.862
    }
  ],
  "totalScans": 1250,
  "averageConfidence": 0.8754
}
```

---

## 3. Get Patient Analytics

**Endpoint:** `GET /analytics/patients`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "totalPatients": 450,
  "newPatientsThisMonth": 45,
  "patientsWithPneumonia": 120,
  "averageScansPerPatient": 2.78,
  "topPatients": [
    {
      "id": "patient-001",
      "idNumber": "P001",
      "name": "John Doe",
      "age": 45,
      "gender": "MALE",
      "scanCount": 12
    }
  ]
}
```

---

## 4. Get Dashboard Overview

**Endpoint:** `GET /dashboard/overview`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "summary": {
    "totalScans": 1250,
    "completedScans": 1200,
    "pneumoniaCases": 350,
    "normalCases": 850,
    "averageConfidence": 0.8754
  },
  "recentScans": [
    {
      "id": "scan-001",
      "patientName": "John Smith",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T14:30:00Z"
    }
  ],
  "systemStatus": {
    "aiModel": "Operational",
    "database": "Connected",
    "storage": "78%"
  }
}
```

---

## 5. Get System Status

**Endpoint:** `GET /dashboard/system-status`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "aiModel": "Operational",
  "database": "Connected",
  "storage": "78% Used"
}
```

---

# SCAN MANAGEMENT PAYLOADS

## 1. Upload Scan

**Endpoint:** `POST /scans/upload`  
**Status Code:** 201 Created  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Headers:** 
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Request Payload (FormData)

```
image: File (JPG/PNG, max 10MB)
patientId: string (UUID)
clinicianNotes: string (optional, max 1000 chars)
```

### Response Payload

```json
{
  "message": "Scan uploaded successfully",
  "scan": {
    "id": "scan-001",
    "imageUrl": "https://cloudinary.../xray.jpg",
    "patientId": "patient-001",
    "clinicianId": "user-001",
    "status": "PENDING",
    "result": null,
    "confidence": null,
    "createdAt": "2026-04-20T15:00:00.000Z"
  }
}
```

---

## 2. Process Scan (AI Analysis)

**Endpoint:** `POST /scans/{scanId}/process`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "confidence": 0.95,
  "result": "PNEUMONIA",
  "heatmapUrl": "https://cloudinary.../heatmap.jpg"
}
```

**Field Validation:**
```typescript
{
  confidence: number (0-1, optional),
  result: enum (optional, "PNEUMONIA" | "NORMAL" | "CONCERNS"),
  heatmapUrl: string (optional, valid URL)
}
```

### Response Payload

```json
{
  "message": "Scan processed successfully",
  "scan": {
    "id": "scan-001",
    "imageUrl": "https://cloudinary.../xray.jpg",
    "heatmapUrl": "https://cloudinary.../heatmap.jpg",
    "status": "COMPLETED",
    "result": "PNEUMONIA",
    "confidence": 0.95,
    "patientId": "patient-001",
    "clinicianId": "user-001",
    "createdAt": "2026-04-20T15:00:00.000Z",
    "analyzedAt": "2026-04-20T15:05:00.000Z"
  }
}
```

---

## 3. Get Scan Details

**Endpoint:** `GET /scans/{scanId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "scan-001",
  "imageUrl": "https://cloudinary.../xray.jpg",
  "heatmapUrl": "https://cloudinary.../heatmap.jpg",
  "status": "COMPLETED",
  "result": "PNEUMONIA",
  "confidence": 0.95,
  "modelVersion": "1.0.0",
  "clinicianNotes": "Follow-up recommended",
  "patientNotes": null,
  "analyzedAt": "2026-04-20T15:05:00.000Z",
  "patientViewedAt": null,
  "isSharedWithPatient": true,
  "createdAt": "2026-04-20T15:00:00.000Z",
  "patient": {
    "id": "patient-001",
    "idNumber": "P001",
    "name": "John Smith",
    "age": 45,
    "gender": "MALE"
  },
  "clinician": {
    "id": "user-001",
    "name": "Dr. John Doe",
    "specialization": "Radiology"
  }
}
```

---

## 4. Get Scan History

**Endpoint:** `GET /scans`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "count": 25,
  "scans": [
    {
      "id": "scan-001",
      "imageUrl": "https://cloudinary.../xray.jpg",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T15:00:00.000Z",
      "patient": {
        "id": "patient-001",
        "name": "John Smith",
        "idNumber": "P001"
      }
    }
  ]
}
```

---

## 5. Get Patient Scans

**Endpoint:** `GET /scans/patient/{patientId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "count": 5,
  "patientId": "patient-001",
  "scans": [
    {
      "id": "scan-001",
      "imageUrl": "https://cloudinary.../xray.jpg",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T15:00:00.000Z"
    }
  ]
}
```

---

## 6. Get My Scans (Patient)

**Endpoint:** `GET /scans/patient/my-scans/list`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** PATIENT

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "count": 5,
  "scans": [
    {
      "id": "scan-001",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T15:00:00.000Z"
    }
  ]
}
```

---

## 7. View Scan (Patient Safe View)

**Endpoint:** `GET /scans/patient/{scanId}/view`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** PATIENT

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "scan-001",
  "result": "PNEUMONIA",
  "confidence": 0.95,
  "createdAt": "2026-04-20T15:00:00.000Z",
  "patientNotes": "Symptoms improving"
}
```

---

## 8. Add Patient Notes

**Endpoint:** `PATCH /scans/patient/{scanId}/notes`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** PATIENT

### Request Payload

```json
{
  "patientNotes": "My symptoms have improved significantly"
}
```

### Response Payload

```json
{
  "message": "Notes updated successfully",
  "scan": {
    "id": "scan-001",
    "patientNotes": "My symptoms have improved significantly",
    "updatedAt": "2026-04-20T16:00:00.000Z"
  }
}
```

---

# PATIENT MANAGEMENT PAYLOADS

## 1. Create Patient

**Endpoint:** `POST /patients`  
**Status Code:** 201 Created  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "idNumber": "P12345",
  "name": "Jane Smith",
  "age": 52,
  "gender": "FEMALE"
}
```

**Field Validation:**
```typescript
{
  idNumber: string (required, unique, 1-50 chars),
  name: string (required, 1-100 chars),
  age: number (required, 0-150),
  gender: enum (required, "MALE" | "FEMALE" | "OTHER")
}
```

### Response Payload

```json
{
  "id": "patient-002",
  "idNumber": "P12345",
  "name": "Jane Smith",
  "age": 52,
  "gender": "FEMALE",
  "createdAt": "2026-04-20T10:30:00.000Z"
}
```

---

## 2. Get All Patients

**Endpoint:** `GET /patients`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Query Parameters (Optional)

```
?search=name&skip=0&take=20&includeScans=true
```

### Response Payload

```json
{
  "count": 150,
  "patients": [
    {
      "id": "patient-001",
      "idNumber": "P001",
      "name": "John Smith",
      "age": 45,
      "gender": "MALE",
      "createdAt": "2026-04-01T00:00:00.000Z",
      "scans": [
        {
          "id": "scan-001",
          "result": "PNEUMONIA",
          "confidence": 0.95
        }
      ]
    }
  ]
}
```

---

## 3. Get Patient Details

**Endpoint:** `GET /patients/{patientId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Query Parameters (Optional)

```
?includeScans=true
```

### Response Payload

```json
{
  "id": "patient-001",
  "idNumber": "P001",
  "name": "John Smith",
  "age": 45,
  "gender": "MALE",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "scans": [
    {
      "id": "scan-001",
      "result": "PNEUMONIA",
      "confidence": 0.95,
      "createdAt": "2026-04-20T15:00:00.000Z"
    }
  ]
}
```

---

## 4. Update Patient

**Endpoint:** `PUT /patients/{patientId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "idNumber": "P001",
  "name": "John Smith Updated",
  "age": 46,
  "gender": "MALE"
}
```

### Response Payload

```json
{
  "id": "patient-001",
  "idNumber": "P001",
  "name": "John Smith Updated",
  "age": 46,
  "gender": "MALE",
  "updatedAt": "2026-04-20T16:00:00.000Z"
}
```

---

## 5. Delete Patient

**Endpoint:** `DELETE /patients/{patientId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "message": "Patient deleted successfully"
}
```

---

# USER PROFILE PAYLOADS

## 1. Get Current User

**Endpoint:** `GET /users/me`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "user-001",
  "email": "doctor@example.com",
  "name": "Dr. John Doe",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "phone": "+1234567890",
  "avatarUrl": null,
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

---

## 2. Update Profile

**Endpoint:** `PATCH /users/profile`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "name": "Dr. John Doe Updated",
  "phone": "+1987654321",
  "specialization": "Pulmonology",
  "avatarUrl": "https://..."
}
```

**Field Validation:**
```typescript
{
  name: string (optional, 1-100 chars),
  phone: string (optional, valid phone format),
  specialization: string (optional, 1-100 chars),
  avatarUrl: string (optional, valid URL)
}
```

### Response Payload

```json
{
  "id": "user-001",
  "email": "doctor@example.com",
  "name": "Dr. John Doe Updated",
  "role": "CLINICIAN",
  "phone": "+1987654321",
  "specialization": "Pulmonology",
  "avatarUrl": "https://...",
  "updatedAt": "2026-04-20T16:00:00.000Z"
}
```

---

## 3. Get Patient Profile

**Endpoint:** `GET /users/patient-profile`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** PATIENT

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "patient-profile-001",
  "userId": "user-001",
  "email": "patient@example.com",
  "name": "Jane Patient",
  "dateOfBirth": "1980-05-15",
  "gender": "FEMALE",
  "bloodType": "O+",
  "medicalHistory": "Asthma, Allergies",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

---

## 4. Update Patient Profile

**Endpoint:** `PUT /users/patient-profile`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** PATIENT

### Request Payload

```json
{
  "dateOfBirth": "1980-05-15",
  "gender": "FEMALE",
  "bloodType": "AB+",
  "medicalHistory": "Asthma, Allergies, Updated"
}
```

### Response Payload

```json
{
  "id": "patient-profile-001",
  "userId": "user-001",
  "dateOfBirth": "1980-05-15",
  "gender": "FEMALE",
  "bloodType": "AB+",
  "medicalHistory": "Asthma, Allergies, Updated",
  "updatedAt": "2026-04-20T16:00:00.000Z"
}
```

---

## 5. Get Recent Activity

**Endpoint:** `GET /users/recent-activity`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Query Parameters (Optional)

```
?limit=20
```

### Response Payload

```json
[
  {
    "id": "activity-001",
    "type": "SCAN_UPLOADED",
    "description": "Uploaded scan for patient John Smith",
    "timestamp": "2026-04-20T15:00:00.000Z",
    "metadata": {
      "scanId": "scan-001",
      "patientId": "patient-001"
    }
  }
]
```

---

## 6. Download Personal Data

**Endpoint:** `GET /users/download-data`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response

File: `user-data-{userId}-{timestamp}.json`

```json
{
  "user": { /* user object */ },
  "scans": [ /* all user scans */ ],
  "patients": [ /* all patients */ ],
  "loginHistory": [ /* login history */ ]
}
```

---

## 7. Delete Account

**Endpoint:** `POST /users/delete-account`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "password": "UserPassword123!"
}
```

### Response Payload

```json
{
  "message": "Account permanently deleted"
}
```

---

# ADMIN PAYLOADS

## 1. Get All Users

**Endpoint:** `GET /admin/users`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** ADMIN

### Request Payload

```json
{}
```

### Response Payload

```json
[
  {
    "id": "user-001",
    "email": "doctor@example.com",
    "name": "Dr. John Smith",
    "role": "CLINICIAN",
    "phone": "+1234567890",
    "specialization": "Radiology",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

## 2. Get User Details

**Endpoint:** `GET /admin/users/{userId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** ADMIN

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "user-001",
  "email": "doctor@example.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "phone": "+1234567890",
  "specialization": "Radiology",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2026-03-01T00:00:00.000Z",
  "scans": {
    "total": 45,
    "completed": 43,
    "processing": 2
  }
}
```

---

## 3. Update User Status

**Endpoint:** `PATCH /admin/users/{userId}/status`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** ADMIN

### Request Payload

```json
{
  "isActive": false
}
```

### Response Payload

```json
{
  "id": "user-001",
  "email": "doctor@example.com",
  "name": "Dr. John Smith",
  "isActive": false,
  "message": "User status updated successfully"
}
```

---

## 4. Delete User

**Endpoint:** `DELETE /admin/users/{userId}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)  
**Role Required:** ADMIN

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "message": "User deleted successfully"
}
```

---

# NOTIFICATION PAYLOADS

## 1. Get All Notifications

**Endpoint:** `GET /notifications`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "notifications": [
    {
      "id": "notif-001",
      "title": "Scan Complete",
      "message": "Your scan has been analyzed",
      "type": "SCAN",
      "read": false,
      "createdAt": "2026-04-20T14:30:00Z"
    }
  ]
}
```

---

## 2. Get Single Notification

**Endpoint:** `GET /notifications/{id}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "id": "notif-001",
  "title": "Scan Complete",
  "message": "Your scan has been analyzed",
  "type": "SCAN",
  "read": false,
  "createdAt": "2026-04-20T14:30:00Z"
}
```

---

## 3. Mark Notification as Read

**Endpoint:** `PATCH /notifications/{id}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{
  "read": true
}
```

### Response Payload

```json
{
  "id": "notif-001",
  "title": "Scan Complete",
  "message": "Your scan has been analyzed",
  "type": "SCAN",
  "read": true,
  "updatedAt": "2026-04-20T16:00:00Z"
}
```

---

## 4. Mark All Notifications as Read

**Endpoint:** `POST /notifications/mark-all-read`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "message": "All notifications marked as read"
}
```

---

## 5. Delete Notification

**Endpoint:** `DELETE /notifications/{id}`  
**Status Code:** 200 OK  
**Auth Required:** ✅ Yes (JwtAuthGuard)

### Request Payload

```json
{}
```

### Response Payload

```json
{
  "message": "Notification deleted successfully"
}
```

---

# ERROR RESPONSE PAYLOADS

## Standard Error Response Format

All error responses follow this structure:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

---

## 1. Validation Error (400)

```json
{
  "statusCode": 400,
  "message": "Email must be a valid email",
  "error": "Bad Request"
}
```

---

## 2. Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized - invalid or missing JWT token",
  "error": "Unauthorized"
}
```

---

## 3. Forbidden (403)

```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this resource",
  "error": "Forbidden"
}
```

---

## 4. Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Scan not found",
  "error": "Not Found"
}
```

---

## 5. Conflict (409)

```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

---

## 6. Server Error (500)

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

# ENUM VALUES REFERENCE

## 1. User Roles

```
ADMIN      - Full system access
CLINICIAN  - Can upload scans, manage patients
PATIENT    - Can view own scans and profile
```

---

## 2. Scan Results

```
PNEUMONIA  - Pneumonia detected
NORMAL     - Normal scan
CONCERNS   - Other concerns detected
```

---

## 3. Scan Status

```
PENDING    - Awaiting processing
PROCESSING - AI model analyzing
COMPLETED  - Analysis complete
FAILED     - Processing failed
```

---

## 4. Notification Types

```
SCAN    - Scan-related notification
SYSTEM  - System notification
USER    - User action notification
```

---

## 5. Gender

```
MALE   - Male
FEMALE - Female
OTHER  - Other
```

---

## 6. Blood Types

```
A+  A-
B+  B-
O+  O-
AB+ AB-
```

---

# SUMMARY TABLE

| Category | Count | Status |
|----------|-------|--------|
| Authentication Endpoints | 8 | ✅ |
| Analytics Endpoints | 3 | ✅ |
| Dashboard Endpoints | 2 | ✅ |
| Scan Endpoints | 8 | ✅ |
| Patient Endpoints | 5 | ✅ |
| User Endpoints | 7 | ✅ |
| Admin Endpoints | 4 | ✅ |
| Notification Endpoints | 5 | ✅ |
| **TOTAL** | **44** | **✅** |

---

**Document Version:** 1.0.0  
**Last Updated:** April 20, 2026  
**Status:** ✅ Production Ready

