# 📊 Scans Module - Visual Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Frontend)                      │
│  • React/Vue app                                            │
│  • Upload form for X-ray images                             │
│  • Process scan button                                      │
│  • View results dashboard                                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              NestJS BACKEND - Scans Module                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ScansController                                     │   │
│  │  ├─ POST /scans/upload        (JWT + Multer)       │   │
│  │  ├─ POST /scans/:id/process   (JWT required)       │   │
│  │  ├─ GET /scans                (JWT required)       │   │
│  │  └─ GET /scans/:id            (JWT + ownership)    │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │ delegates to                                 │
│  ┌────────────▼─────────────────────────────────────────┐   │
│  │  ScansService                                        │   │
│  │  ├─ createScan()              (validates patient)   │   │
│  │  ├─ processScan()             (mock AI results)     │   │
│  │  ├─ getScansByDoctor()        (role-aware filter)   │   │
│  │  ├─ getScanById()             (ownership check)     │   │
│  │  └─ generateMockAIResults()   (random 0.85-0.99)    │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│      ┌────────┴──────────┐                                   │
│      │                   │                                   │
│      ↓                   ↓                                   │
│  ┌─────────┐        ┌──────────────────┐                   │
│  │ Prisma  │        │ File System      │                   │
│  │ Service │        │ (Multer/Disk)    │                   │
│  └────┬────┘        └────────┬─────────┘                   │
│       │                      │                              │
│       ↓                      ↓                              │
│  ┌────────────────────────────────────────┐                │
│  │      PostgreSQL Database               │                │
│  │  ┌──────────────────────────────────┐  │                │
│  │  │  Scan Table                      │  │                │
│  │  │  ├─ id (UUID)                    │  │                │
│  │  │  ├─ imageUrl (→ /uploads)        │  │                │
│  │  │  ├─ status (UPLOADED/COMPLETED)  │  │                │
│  │  │  ├─ result (PNEUMONIA/NORMAL)    │  │                │
│  │  │  ├─ confidence (0.85-0.99)       │  │                │
│  │  │  ├─ patientId (FK → Patient)     │  │                │
│  │  │  └─ doctorId (FK → User)         │  │                │
│  │  └──────────────────────────────────┘  │                │
│  │  ┌──────────────────────────────────┐  │                │
│  │  │  Patient Table (related)         │  │                │
│  │  │  ├─ id (UUID)                    │  │                │
│  │  │  ├─ idNumber (unique)            │  │                │
│  │  │  ├─ name, age, gender            │  │                │
│  │  │  └─ timestamps                   │  │                │
│  │  └──────────────────────────────────┘  │                │
│  │  ┌──────────────────────────────────┐  │                │
│  │  │  User Table (doctors/admins)     │  │                │
│  │  │  ├─ id (UUID)                    │  │                │
│  │  │  ├─ email, name, role            │  │                │
│  │  │  └─ timestamps                   │  │                │
│  │  └──────────────────────────────────┘  │                │
│  └────────────────────────────────────────┘                │
│       │                                                     │
│       └─────────────────────────────────────────┐           │
└─────────────────────────────────────────────────┼───────────┘
                                                 │
                         ┌───────────────────────┘
                         │
        ┌────────────────▼───────────────────┐
        │   Filesystem: /uploads/            │
        │   ├─ xray-1712000000000-123.jpg   │
        │   ├─ chest-1712000001000-456.png  │
        │   └─ lung-1712000002000-789.jpg   │
        └────────────────────────────────────┘
        
        (Future: S3/Cloudinary)
```

---

## Request/Response Flow

### 1. Upload Flow

```
REQUEST:
POST /scans/upload
Header: Authorization: Bearer <jwt_token>
Body: multipart/form-data
  ├─ image: <file> (binary X-ray image)
  └─ patientId: "patient-uuid"

                        ↓ [NestJS]

1. JwtAuthGuard validates token
   ✅ Token valid → Attach user
   ❌ Token invalid → 401 Unauthorized

                        ↓

2. FileInterceptor (Multer) intercepts
   ├─ Parse multipart body
   ├─ Extract file
   └─ Extract form fields

                        ↓

3. File Filter validates
   ✅ MIME type = image/jpeg or image/png → Allow
   ❌ MIME type = application/pdf → Reject 400

                        ↓

4. Storage writes to disk
   ├─ Generate unique name: xray-1712000000000-123.jpg
   ├─ Write to ./uploads/
   └─ Pass file object to handler

                        ↓

5. CreateScanDto validates
   ✅ patientId exists → Continue
   ❌ patientId missing → 400 Bad Request

                        ↓

6. ScansService.createScan()
   ├─ Query: SELECT * FROM Patient WHERE id = patientId
   ✅ Patient found → Continue
   ❌ Patient not found → 400 Bad Request
   
   ├─ Create database record:
   │  INSERT INTO Scan (imageUrl, patientId, doctorId, status)
   │  VALUES (
   │    '/uploads/xray-1712000000000-123.jpg',
   │    'patient-uuid',
   │    'doctor-uuid',
   │    'UPLOADED'
   │  )
   └─ Include patient & doctor info

                        ↓

RESPONSE:
HTTP 201 Created
{
  "message": "Scan uploaded successfully",
  "scan": {
    "id": "scan-uuid",
    "imageUrl": "/uploads/xray-1712000000000-123.jpg",
    "status": "UPLOADED",
    "result": null,
    "confidence": null,
    "patient": { ... },
    "doctor": { ... }
  }
}
```

---

### 2. Process Flow

```
REQUEST:
POST /scans/scan-uuid/process
Header: Authorization: Bearer <jwt_token>
Body: { "heatmapUrl": null }

                        ↓

1. JwtAuthGuard validates token
   ✅ User attached to request

                        ↓

2. ProcessScanDto validates
   ✅ heatmapUrl is string or optional

                        ↓

3. ScansService.processScan()
   
   a) Fetch scan from database:
      SELECT * FROM Scan WHERE id = 'scan-uuid'
      ✅ Scan found → Continue
      ❌ Scan not found → 404 Not Found
   
   b) Ownership check:
      IF user.role === 'ADMIN' ✅ ALLOW
      ELSE IF scan.doctorId === user.id ✅ ALLOW
      ELSE ❌ 403 Forbidden
   
   c) Generate mock results:
      ├─ Random PNEUMONIA/NORMAL (50/50)
      └─ Random confidence 0.85-0.99
      
      Example: { result: 'PNEUMONIA', confidence: 0.9287 }
   
   d) Update database:
      UPDATE Scan SET
        status = 'COMPLETED',
        result = 'PNEUMONIA',
        confidence = 0.9287,
        modelVersion = 'mock-v1',
        heatmapUrl = null,
        updatedAt = NOW()
      WHERE id = 'scan-uuid'
   
   e) Include relations:
      ├─ Fetch Patient
      └─ Fetch User (doctor)
      └─ Return full scan object

                        ↓

RESPONSE:
HTTP 200 OK
{
  "message": "Scan processed successfully",
  "scan": {
    "id": "scan-uuid",
    "imageUrl": "/uploads/xray-1712000000000-123.jpg",
    "status": "COMPLETED",
    "result": "PNEUMONIA",
    "confidence": 0.9287,
    "modelVersion": "mock-v1",
    "createdAt": "2026-04-16T10:30:00Z",
    "updatedAt": "2026-04-16T10:31:00Z",
    "patient": { ... },
    "doctor": { ... }
  }
}
```

---

### 3. Get Scans Flow

```
REQUEST:
GET /scans
Header: Authorization: Bearer <jwt_token>

                        ↓

1. JwtAuthGuard validates token
   ✅ User attached to request

                        ↓

2. ScansService.getScansByDoctor(user.id, user.role)
   
   a) Check user role:
      IF user.role === 'ADMIN'
        ├─ Query: SELECT * FROM Scan (ALL)
        └─ Include relations
      ELSE
        ├─ Query: SELECT * FROM Scan WHERE doctorId = user.id
        └─ Include relations
   
   b) Order by timestamp:
      ORDER BY createdAt DESC (newest first)
   
   c) For each scan:
      ├─ Include Patient info
      ├─ Include Doctor info
      └─ Transform to ScanResponseDto

                        ↓

RESPONSE:
HTTP 200 OK
{
  "count": 3,
  "scans": [
    { ... scan 1 ... },
    { ... scan 2 ... },
    { ... scan 3 ... }
  ]
}
```

---

## File Upload Sequence Diagram

```
Client                    Multer            Database           Filesystem
  │                         │                   │                   │
  │ POST /scans/upload      │                   │                   │
  │ (multipart/form-data)  │                   │                   │
  ├────────────────────────>│                   │                   │
  │                         │                   │                   │
  │                    [Parse Multipart]        │                   │
  │                    [Validate MIME Type]     │                   │
  │                    [Check File Size]        │                   │
  │                         │                   │                   │
  │                    [Generate Filename]      │                   │
  │                         │                   │                   │
  │                    [Write to Disk]          │                   │
  │                         │                   │                   │
  │                         │                   │                   ├─ xray-17120000...jpg
  │                         │                   │                   │
  │                    [Pass to Handler]        │                   │
  │                         │                   │                   │
  │                    [Validate DTO]           │                   │
  │                         │                   │                   │
  │                    [Validate Patient]       │                   │
  │                         │                   │                   │
  │                         │    CREATE SCAN    │                   │
  │                         │    (imageUrl,     │                   │
  │                         │     patientId,    │                   │
  │                         │     doctorId,     │                   │
  │                         │     status)       │                   │
  │                         ├──────────────────>│                   │
  │                         │                   │                   │
  │                         │              [Insert Row]            │
  │                         │                   │                   │
  │                         │                   ├─ Scan created!    │
  │                         │                   │                   │
  │   HTTP 201 Created      │                   │                   │
  │   + Scan Object        │                   │                   │
  │<────────────────────────┤                   │                   │
  │                         │                   │                   │
```

---

## Security Flow

```
REQUEST:
POST /scans/:id/process
Header: Authorization: Bearer <token>

             ↓
        
    ┌──────────────────────────┐
    │ JwtAuthGuard              │
    ├──────────────────────────┤
    │ 1. Extract token from    │
    │    Authorization header  │
    │                          │
    │ 2. Verify signature      │
    │    ✅ Valid → Continue   │
    │    ❌ Invalid → 401      │
    │                          │
    │ 3. Check expiration      │
    │    ✅ Valid → Continue   │
    │    ❌ Expired → 401      │
    │                          │
    │ 4. Decode payload        │
    │    {                     │
    │      "id": "user-uuid",  │
    │      "role": "DOCTOR"    │
    │    }                     │
    │                          │
    │ 5. Attach to request:    │
    │    user = { id, role }   │
    └────────────┬─────────────┘
                 │
                 ↓
        
    ┌──────────────────────────┐
    │ Ownership Check           │
    ├──────────────────────────┤
    │ 1. Fetch scan from DB    │
    │    scan.doctorId = 'X'   │
    │                          │
    │ 2. Check if admin:       │
    │    if role === 'ADMIN'   │
    │    ✅ ALLOW              │
    │                          │
    │ 3. Check if owner:       │
    │    if doctorId === id    │
    │    ✅ ALLOW              │
    │    ❌ FORBID             │
    └────────────┬─────────────┘
                 │
                 ↓
        
    ┌──────────────────────────┐
    │ Process Allowed           │
    │ Generate results          │
    │ Update database           │
    │ Return response           │
    └──────────────────────────┘
```

---

## Permission Matrix

```
                              Doctor A      Doctor B      Admin
                              ────────      ────────      ─────

Own Scans:
  View (GET /scans/:id)         ✅            ❌           ✅
  Process (POST /process)       ✅            ❌           ✅
  Delete (future)               ✅            ❌           ✅

Other's Scans:
  View (GET /scans/:id)         ❌            ❌           ✅
  Process (POST /process)       ❌            ❌           ✅
  Delete (future)               ❌            ❌           ✅

List Operations:
  GET /scans (own)              ✅            ✅           ✅
  GET /scans (all)              ❌            ❌           ✅

Upload:
  POST /upload                  ✅            ✅           ✅
```

---

## Data Flow: Create → Process → Display

```
┌─────────────────┐
│ Patient Created │
│   (From        │
│    Patients    │
│    Module)     │
└────────┬────────┘
         │
         ↓ patientId
┌─────────────────────────────────┐
│ Doctor uploads X-ray            │
│ POST /scans/upload              │
│ - file (multipart)              │
│ - patientId                     │
└────────┬────────────────────────┘
         │
         ├─ Validate file ✅
         ├─ Validate patient ✅
         ├─ Save file locally
         │
         ↓
    ┌─────────────────────────────────────┐
    │ Scan Record Created                 │
    │ - id: scan-uuid                     │
    │ - imageUrl: /uploads/...jpg         │
    │ - status: UPLOADED                  │
    │ - patientId: patient-uuid           │
    │ - doctorId: doctor-uuid             │
    │ - result: null                      │
    │ - confidence: null                  │
    └────────┬────────────────────────────┘
             │
             ↓
    ┌─────────────────────────────────────┐
    │ Doctor requests processing          │
    │ POST /scans/:id/process             │
    └────────┬────────────────────────────┘
             │
             ├─ Check authorization ✅
             ├─ Generate mock AI results
             │  ├─ Random: PNEUMONIA/NORMAL
             │  └─ Confidence: 0.85-0.99
             │
             ↓
    ┌─────────────────────────────────────┐
    │ Scan Record Updated                 │
    │ - status: COMPLETED                 │
    │ - result: PNEUMONIA                 │
    │ - confidence: 0.9287                │
    │ - modelVersion: mock-v1             │
    │ - updatedAt: NOW()                  │
    └────────┬────────────────────────────┘
             │
             ↓
    ┌─────────────────────────────────────┐
    │ Frontend displays results           │
    │ GET /scans/:id                      │
    │                                     │
    │ Shows:                              │
    │ - X-ray image (from imageUrl)       │
    │ - Result: PNEUMONIA                 │
    │ - Confidence: 92.87%                │
    │ - Patient info                      │
    │ - Timestamp                         │
    └─────────────────────────────────────┘
```

---

## Mock AI Results Distribution

```
Running generateMockAIResults() 1000 times:

Result Distribution:        Confidence Distribution:
┌──────────────────┐        ┌──────────────────────┐
│ PNEUMONIA: ~50%  │        │ 0.85-0.90: ~25%      │
│ NORMAL: ~50%     │        │ 0.90-0.95: ~50%      │
└──────────────────┘        │ 0.95-0.99: ~25%      │
                            └──────────────────────┘

Example Results:
Call 1:  PNEUMONIA @ 0.8763
Call 2:  NORMAL @ 0.9234
Call 3:  NORMAL @ 0.8897
Call 4:  PNEUMONIA @ 0.9876
Call 5:  PNEUMONIA @ 0.9123
...
```

---

## Error Handling Flow

```
Request arrives

         ↓
    ┌─────────────┐
    │ JWT Guard?  │
    └─────┬───────┘
          │
    ┌─────▼─────────────┐
    │ Token valid?      │
    ├───────────────────┤
    │ YES ✅ Continue   │
    │ NO ❌ 401 Auth    │
    └───────────────────┘
          │
         ↓
    ┌─────────────────────┐
    │ File operations?    │
    ├─────────────────────┤
    │ ✅ Valid MIME type  │
    │ ✅ Valid size       │
    │ ❌ Invalid format   │ → 400 Bad Request
    │ ❌ Too large        │
    └─────────────────────┘
          │
         ↓
    ┌─────────────────────┐
    │ DTO Validation?     │
    ├─────────────────────┤
    │ ✅ Required fields  │
    │ ✅ Type checks      │
    │ ❌ Missing data     │ → 400 Bad Request
    │ ❌ Wrong type       │
    └─────────────────────┘
          │
         ↓
    ┌─────────────────────┐
    │ Business Logic?     │
    ├─────────────────────┤
    │ ✅ Patient exists   │
    │ ✅ Scan exists      │
    │ ✅ Ownership OK     │
    │ ❌ Not found        │ → 404 Not Found
    │ ❌ Not authorized   │ → 403 Forbidden
    └─────────────────────┘
          │
         ↓
    ✅ Success Response
```

---

## Production Readiness Checklist

```
✅ Authentication (JWT)
✅ Authorization (Role-based)
✅ File validation (Type/Size)
✅ Database integration
✅ Error handling
✅ Type safety (TypeScript)
✅ Documentation
✅ Testing guide
⏳ Async job queue (Bull)
⏳ Flask integration
⏳ Cloud storage (S3)
⏳ Monitoring/Logging
⏳ Performance optimization
```

---

This visual guide should help you understand the complete architecture and data flow of the Scans module!
