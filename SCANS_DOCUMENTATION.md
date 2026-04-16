# 🔍 Scans Module - Complete Guide

## Overview

The **Scans module** manages medical scan records (X-ray images) for pneumonia detection. It handles:
- **Image uploads** via Multer to local disk
- **Mock AI processing** for testing (generates random results)
- **Result tracking** (PNEUMONIA vs NORMAL with confidence scores)
- **Access control** (only doctors/admins can view their own scans)
- **Future Flask integration** (placeholder for real AI inference)

---

## 📊 Architecture

```
User (Doctor) authenticates with JWT
    ↓
Uploads X-ray image (multipart/form-data)
    ↓
Image saved locally to ./uploads/
    ↓
Scan record created in DB (status=UPLOADED)
    ↓
Doctor can request processing
    ↓
Mock AI generates result (PNEUMONIA/NORMAL)
    ↓
Scan record updated (status=COMPLETED)
```

---

## 🗂️ File Structure

```
src/scans/
├── scans.module.ts              # Module definition
├── scans.service.ts             # Business logic
├── scans.controller.ts          # REST endpoints
└── dto/
    ├── create-scan.dto.ts       # Validation for upload
    ├── process-scan.dto.ts      # Validation for processing
    └── scan-response.dto.ts     # Response serialization
```

---

## 🔌 API Endpoints

### 1. POST /scans/upload
**Upload a chest X-ray image**

```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer <jwt_token>" \
  -F "image=@/path/to/xray.jpg" \
  -F "patientId=<patient-uuid>"
```

**Request:**
- `image` (multipart file): JPG/JPEG/PNG, max 10MB
- `patientId` (string, required): UUID of patient
- `Authorization` header: Valid JWT token

**Response (201 Created):**
```json
{
  "message": "Scan uploaded successfully",
  "scan": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "imageUrl": "/uploads/xray-1712000000000-123456789.jpg",
    "heatmapUrl": null,
    "status": "UPLOADED",
    "result": null,
    "confidence": null,
    "modelVersion": null,
    "createdAt": "2026-04-16T10:30:00Z",
    "updatedAt": "2026-04-16T10:30:00Z",
    "patientId": "<patient-uuid>",
    "patient": {
      "id": "<patient-uuid>",
      "idNumber": "PAT-001",
      "name": "John Doe",
      "age": 45,
      "gender": "MALE"
    },
    "doctorId": "<doctor-uuid>",
    "doctor": {
      "id": "<doctor-uuid>",
      "email": "doctor@hospital.com",
      "name": "Dr. Smith",
      "role": "DOCTOR"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file (not JPG/PNG/JPEG) or file too large
- `400 Bad Request`: Patient not found
- `401 Unauthorized`: No JWT token provided

---

### 2. POST /scans/:id/process
**Process a scan with mock AI**

```bash
curl -X POST http://localhost:3000/scans/550e8400-e29b-41d4-a716-446655440000/process \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "heatmapUrl": "/uploads/heatmap-123.png"
  }'
```

**Request:**
- `heatmapUrl` (optional string): URL to heatmap overlay image
- `Authorization` header: Valid JWT token

**Response (200 OK):**
```json
{
  "message": "Scan processed successfully",
  "scan": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "imageUrl": "/uploads/xray-1712000000000-123456789.jpg",
    "heatmapUrl": "/uploads/heatmap-123.png",
    "status": "COMPLETED",
    "result": "PNEUMONIA",
    "confidence": 0.9287,
    "modelVersion": "mock-v1",
    "createdAt": "2026-04-16T10:30:00Z",
    "updatedAt": "2026-04-16T10:31:00Z",
    "patientId": "<patient-uuid>",
    "patient": { ... },
    "doctorId": "<doctor-uuid>",
    "doctor": { ... }
  }
}
```

**Error Responses:**
- `404 Not Found`: Scan doesn't exist
- `403 Forbidden`: Only scan creator or admin can process
- `401 Unauthorized`: No JWT token

---

### 3. GET /scans
**Get scan history**

```bash
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer <jwt_token>"
```

**Response (200 OK):**
```json
{
  "count": 5,
  "scans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "imageUrl": "/uploads/xray-1712000000000-123456789.jpg",
      "heatmapUrl": "/uploads/heatmap-123.png",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.9287,
      "modelVersion": "mock-v1",
      "createdAt": "2026-04-16T10:31:00Z",
      "updatedAt": "2026-04-16T10:31:00Z",
      "patientId": "<patient-uuid>",
      "patient": { ... },
      "doctorId": "<doctor-uuid>",
      "doctor": { ... }
    }
  ]
}
```

**Authorization:**
- `DOCTOR` role: Returns only scans they created
- `ADMIN` role: Returns all scans in system
- Results ordered by newest first

**Error Responses:**
- `401 Unauthorized`: No JWT token

---

### 4. GET /scans/:id
**Get a single scan**

```bash
curl -X GET http://localhost:3000/scans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>"
```

**Response (200 OK):**
```json
{
  "scan": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "imageUrl": "/uploads/xray-1712000000000-123456789.jpg",
    "heatmapUrl": "/uploads/heatmap-123.png",
    "status": "COMPLETED",
    "result": "PNEUMONIA",
    "confidence": 0.9287,
    "modelVersion": "mock-v1",
    "createdAt": "2026-04-16T10:31:00Z",
    "updatedAt": "2026-04-16T10:31:00Z",
    "patientId": "<patient-uuid>",
    "patient": { ... },
    "doctorId": "<doctor-uuid>",
    "doctor": { ... }
  }
}
```

**Error Responses:**
- `404 Not Found`: Scan doesn't exist
- `403 Forbidden`: Only scan creator or admin can view
- `401 Unauthorized`: No JWT token

---

## 📁 Local File Upload Management

### How Multer Works in NestJS

**Configuration** (in `scans.controller.ts`):
```typescript
const storage = diskStorage({
  destination: './uploads',  // Save files here
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Decorator on controller method:
@UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits }))
async uploadScan(@UploadedFile() file: Express.Multer.File) { ... }
```

**File Storage:**
- Files stored in: `/Users/macbook/pneumodetect-backend/uploads/`
- Filename format: `xray-1712000000000-123456789.jpg`
- Timestamp ensures uniqueness
- Random component adds extra protection

### Uploaded File Details

```
{
  fieldname: 'image',              // Form field name
  originalname: 'xray.jpg',        // Original filename
  encoding: '7bit',                // Encoding
  mimetype: 'image/jpeg',          // Content type (validated)
  size: 2048576,                   // File size in bytes
  destination: './uploads',        // Save location
  filename: 'xray-1712000000000-123456789.jpg',  // Stored filename
  path: './uploads/xray-1712000000000-123456789.jpg'  // Full path
}
```

### Accessing Uploaded Files

**Option 1: Static Files (Production)**
```typescript
// In main.ts or app.module.ts:
app.useStaticAssets('uploads', { prefix: '/uploads' });
```

Then access via HTTP:
```
GET http://localhost:3000/uploads/xray-1712000000000-123456789.jpg
```

**Option 2: Direct File Serving (Advanced)**
```typescript
@Get('uploads/:filename')
@Header('Content-Type', 'image/jpeg')
serveUpload(@Param('filename') filename: string, @Res() res: Response) {
  return res.sendFile(filename, { root: './uploads' });
}
```

---

## 🔄 Mock AI Processing

### How Mock Results Work

**In `scans.service.ts`:**
```typescript
private generateMockAIResults(): { result: Result; confidence: number } {
  // Random PNEUMONIA or NORMAL
  const results: Result[] = ['PNEUMONIA', 'NORMAL'];
  const randomResult = results[Math.floor(Math.random() * results.length)];
  
  // Confidence between 0.85-0.99
  const confidence = parseFloat((Math.random() * 0.14 + 0.85).toFixed(4));

  return { result: randomResult as Result, confidence };
}
```

### Example Mock Results
```
Call 1: { result: 'PNEUMONIA', confidence: 0.9287 }
Call 2: { result: 'NORMAL', confidence: 0.8765 }
Call 3: { result: 'PNEUMONIA', confidence: 0.9523 }
```

---

## 🔐 Security & Access Control

### JWT Authentication
- All endpoints require valid JWT token
- Token extracted from `Authorization: Bearer <token>` header
- `@UseGuards(JwtAuthGuard)` on controller class

### Ownership Checks
```typescript
// Only allow scan creator or admin to process/view
if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
  throw new ForbiddenException('You can only view scans you created');
}
```

### File Validation
- **Allowed types:** JPG, JPEG, PNG only
- **Max file size:** 10MB
- **Mime type check:** Strict validation

---

## 📊 Database Schema

```sql
CREATE TABLE "Scan" (
  id              String      PRIMARY KEY DEFAULT uuid()
  imageUrl        String      NOT NULL        -- Path to uploaded X-ray
  heatmapUrl      String?                     -- Optional heatmap overlay
  status          ScanStatus  NOT NULL DEFAULT 'UPLOADED'
  result          Result?                     -- PNEUMONIA or NORMAL
  confidence      Float?                      -- 0.0-1.0 confidence score
  modelVersion    String?                     -- Version of AI model used
  createdAt       DateTime    NOT NULL DEFAULT now()
  updatedAt       DateTime    NOT NULL DEFAULT now()
  
  patientId       String      NOT NULL        -- Foreign key to Patient
  patient         Patient     @relation(...)  -- Reference to Patient
  
  doctorId        String      NOT NULL        -- Foreign key to User
  doctor          User        @relation(...)  -- Reference to User/Doctor
  
  @@index([patientId])
  @@index([doctorId])
}

enum ScanStatus {
  UPLOADED      -- File uploaded, awaiting processing
  PROCESSING    -- Currently being analyzed
  COMPLETED     -- Analysis done, results available
  FAILED        -- Analysis failed
}

enum Result {
  PNEUMONIA     -- AI detected pneumonia
  NORMAL        -- No pneumonia detected
}
```

---

## 🔗 Integration with Other Modules

### With Patients Module
- Scan has `patientId` foreign key
- Deleting patient cascades to delete scans
- Get scans by patient: `GET /patients/:id?includeScans=true`

### With Users/Auth Module
- Scan has `doctorId` foreign key (links to User)
- Doctor authenticated via JWT from Auth module
- Ownership check prevents cross-access

### With Admin Module
- Admins can view all scans
- Admins can process any scan
- Regular doctors see only their own

---

## 🚀 Integration with Flask (Future)

### Current State (Mock)
```typescript
async processScan(scanId: string, ...) {
  // Mock results
  const mockResults = this.generateMockAIResults();
  await this.prisma.scan.update({
    data: {
      result: mockResults.result,
      confidence: mockResults.confidence,
      modelVersion: 'mock-v1'
    }
  });
}
```

### Future: Real Flask Integration
```typescript
async processScan(scanId: string, ...) {
  // Update status to PROCESSING
  await this.prisma.scan.update({
    where: { id: scanId },
    data: { status: 'PROCESSING' }
  });

  // Call Flask inference service
  try {
    const flaskResponse = await this.callFlaskAPI(scan.imageUrl);
    
    // Update with real results
    await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        result: flaskResponse.result,
        confidence: flaskResponse.confidence,
        modelVersion: flaskResponse.version,
        heatmapUrl: flaskResponse.heatmapUrl
      }
    });
  } catch (error) {
    // Handle Flask errors
    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'FAILED' }
    });
  }
}

private async callFlaskAPI(imageUrl: string) {
  const response = await fetch('http://flask-service:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  return response.json();
}
```

### Migration Path
1. ✅ Current: Mock results work
2. Next: Add async job queue (Bull/RabbitMQ)
3. Then: Connect Flask service
4. Finally: Real-time processing with WebSockets

---

## 🧪 Testing Examples

### 1. Create Patient First
```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE"
  }'
# Copy the returned patient ID
```

### 2. Upload Scan
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/xray.jpg" \
  -F "patientId=<copied-patient-id>"
# Copy the returned scan ID
```

### 3. Get Scan History
```bash
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer <token>"
```

### 4. Process Scan
```bash
curl -X POST http://localhost:3000/scans/<scan-id>/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"heatmapUrl": null}'
```

### 5. View Results
```bash
curl -X GET http://localhost:3000/scans/<scan-id> \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Validation & Error Handling

### File Upload Validation
- ❌ `.pdf` → 400 Bad Request
- ❌ `.exe` → 400 Bad Request
- ❌ 20MB file → 400 Bad Request
- ✅ `.jpg` → Accepted
- ✅ `.png` → Accepted

### Business Logic Validation
- ❌ Invalid patientId → 404 Not Found
- ❌ Scan already exists → Can create duplicate (intentional)
- ❌ Non-owner tries to process → 403 Forbidden
- ✅ Valid request → 201/200 Created/OK

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Only JPG, JPEG, and PNG files are allowed",
  "error": "Bad Request"
}
```

---

## 🎯 Key Design Decisions

### Why Local File Storage?
- ✅ Development/testing friendly
- ✅ No external service dependency
- ✅ Faster for prototyping
- ⚠️ Not production-ready (should use S3/Cloudinary)

### Why Mock AI?
- ✅ Test full workflow without Flask
- ✅ Understand data flow
- ✅ Build frontend without backend
- ⚠️ Results not medically accurate

### Why Immutable Scan ID?
- Ensures referential integrity
- Supports audit trails
- Medical record standards

### Why Store Doctor ID?
- Track who ordered scan
- Privacy compliance (HIPAA)
- Separate from patient data

---

## 📈 Performance Considerations

### Current State
- Single request upload-process
- Synchronous operations
- In-memory processing

### Production Improvements
1. **Async Processing:** Use job queue (Bull/RabbitMQ)
2. **Caching:** Redis for scan history
3. **Compression:** Optimize image storage
4. **CDN:** Serve images from CDN
5. **Database:** Index on patientId, doctorId, status

---

## ✅ Build Verification

```bash
npm run build
# Output: Successfully compiled TypeScript
# No errors: ✓
# Ready for: npm run start:dev
```

---

## 🎊 Summary

You now have a **complete Scans module** that:

✨ Uploads X-ray images locally
✨ Creates scan records tied to patients & doctors
✨ Processes scans with mock AI results
✨ Controls access (ownership checks)
✨ Protects with JWT authentication
✨ Ready to integrate real Flask service
✨ Follows NestJS best practices

**Next Steps:**
1. Test endpoints with provided curl examples
2. Integrate real Flask service when ready
3. Add async job queue for production
4. Move to cloud storage (S3/Cloudinary)
5. Add notifications when results ready
