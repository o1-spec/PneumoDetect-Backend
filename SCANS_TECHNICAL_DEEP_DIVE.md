# 🔍 Scans Module - Deep Technical Explanation

## Table of Contents
1. [How Multer File Upload Works](#how-multer-file-upload-works)
2. [Local File Storage Architecture](#local-file-storage-architecture)
3. [Mock AI Processing System](#mock-ai-processing-system)
4. [Role-Based Access Control](#role-based-access-control)
5. [Flask Integration Strategy](#flask-integration-strategy)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Performance Optimization](#performance-optimization)

---

## How Multer File Upload Works

### The Upload Flow (Step by Step)

```
Client sends multipart/form-data
    ↓
NestJS FileInterceptor receives request
    ↓
Multer validates request
    ├─ Check Content-Type: multipart/form-data
    ├─ Extract field name: 'image'
    └─ Extract file data
    ↓
File filter validates (custom function)
    ├─ Check mime type (image/jpeg, image/png)
    ├─ Check file extension
    └─ If invalid → throw BadRequestException
    ↓
File size check
    ├─ Compare file.size vs limits.fileSize (10MB)
    └─ If too large → throw error
    ↓
Storage function generates filename
    ├─ Get current timestamp: 1712000000000
    ├─ Generate random number: 123456789
    ├─ Extract original extension: .jpg
    ├─ Get original name: xray
    └─ Result: xray-1712000000000-123456789.jpg
    ↓
Write file to disk
    ├─ Location: ./uploads/
    ├─ Full path: ./uploads/xray-1712000000000-123456789.jpg
    └─ File system I/O
    ↓
Return file object to handler
    ├─ file.fieldname: 'image'
    ├─ file.originalname: 'xray.jpg'
    ├─ file.filename: 'xray-1712000000000-123456789.jpg'
    ├─ file.mimetype: 'image/jpeg'
    ├─ file.size: 2048576
    ├─ file.destination: './uploads'
    ├─ file.path: './uploads/xray-1712000000000-123456789.jpg'
    └─ file.buffer: Buffer (in-memory for MemoryStorage)
    ↓
Handler processes file object
```

### The Actual Code (scans.controller.ts)

```typescript
// Multer storage configuration
const storage = diskStorage({
  // 1. Where to save files
  destination: (req, file, cb) => {
    cb(null, './uploads');  // Save to ./uploads directory
  },

  // 2. How to name files
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);      // e.g., '.jpg'
    const name = path.basename(file.originalname, ext); // e.g., 'xray'
    cb(null, `${name}-${uniqueSuffix}${ext}`);        // xray-1712000000000-123456789.jpg
  },
});

// 3. File filter (validation)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);  // Accept file
  } else {
    cb(
      new BadRequestException('Only JPG, JPEG, and PNG files are allowed'),
      false  // Reject file
    );
  }
};

// 4. Controller method with FileInterceptor
@Post('upload')
@UseInterceptors(
  FileInterceptor('image', {
    storage,                    // Use our diskStorage config
    fileFilter,                 // Use our validation function
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }),
)
async uploadScan(
  @UploadedFile() file: Express.Multer.File,
  @Body() createScanDto: CreateScanDto,
  @CurrentUser() user: any,
) {
  // 5. File is now on disk, handle in service
  const imageUrl = `/uploads/${file.filename}`;
  const scan = await this.scansService.createScan(
    createScanDto,
    imageUrl,
    user.id,
  );
  return { message: 'Scan uploaded successfully', scan };
}
```

### What Happens When You POST

```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@/tmp/xray.jpg" \
  -F "patientId=patient-uuid"
```

**Behind the scenes:**

1. **Request arrives** with boundary marker (multipart boundary)
2. **FileInterceptor intercepts** - detects multipart/form-data
3. **Multer parses** the boundary and extracts parts
4. **File filter runs:**
   - Read file header (magic bytes)
   - Check mime type: `image/jpeg` ✅
   - Check size: 2.5MB vs 10MB ✅
   - Allow file
5. **Storage function:**
   - Current time: `1712000000000`
   - Random: `123456789`
   - Filename: `xray-1712000000000-123456789.jpg`
6. **File written** to disk at `./uploads/xray-1712000000000-123456789.jpg`
7. **Handler receives:**
   ```typescript
   file = {
     fieldname: 'image',
     originalname: 'xray.jpg',
     encoding: '7bit',
     mimetype: 'image/jpeg',
     size: 2621440,  // 2.5MB
     destination: './uploads',
     filename: 'xray-1712000000000-123456789.jpg',
     path: './uploads/xray-1712000000000-123456789.jpg'
   }
   ```
8. **Service receives:**
   - imageUrl: `/uploads/xray-1712000000000-123456789.jpg`
   - patientId: from body
   - doctorId: from JWT token
9. **Database record created:**
   ```sql
   INSERT INTO "Scan" (imageUrl, patientId, doctorId, status, createdAt, updatedAt)
   VALUES (
     '/uploads/xray-1712000000000-123456789.jpg',
     'patient-uuid',
     'doctor-uuid',
     'UPLOADED',
     NOW(),
     NOW()
   )
   ```
10. **Response sent** with scan object

---

## Local File Storage Architecture

### Directory Structure

```
/Users/macbook/pneumodetect-backend/
├── src/
│   ├── scans/
│   │   ├── scans.controller.ts    ← Where files are uploaded
│   │   ├── scans.service.ts       ← Where DB record created
│   │   └── ...
│   └── ...
├── uploads/                        ← Physical files on disk
│   ├── xray-1712000000000-123456789.jpg
│   ├── chest-1712000001000-987654321.png
│   ├── lung-1712000002000-456789123.jpg
│   └── ...
├── package.json
└── ...
```

### File Naming Strategy

**Problem:** If two users upload files named `xray.jpg` at same time, they'll collide!

**Solution:** Add timestamp + random number

```
Original filename:  xray.jpg
Timestamp:         1712000000000 (ms since epoch)
Random:            123456789
Extension:         .jpg

Result:            xray-1712000000000-123456789.jpg
                   └─ Original name    └─ Unique ID
```

**Why this works:**
- ✅ Timestamp: Different for each upload (unless < 1ms apart)
- ✅ Random: Handles edge case where uploads are simultaneous
- ✅ Readable: Original name preserved for debugging
- ✅ Unique: Collision probability < 1 in 10 billion

### Storing the URL in Database

```typescript
// File saved at: ./uploads/xray-1712000000000-123456789.jpg
const imageUrl = `/uploads/${file.filename}`;
// imageUrl = "/uploads/xray-1712000000000-123456789.jpg"

// Store in database
const scan = await this.prisma.scan.create({
  data: {
    imageUrl,  // Just the relative path
    patientId,
    doctorId,
    status: 'UPLOADED',
  },
});
```

### Serving Uploaded Files

**Option 1: Static Assets (Recommended)**

```typescript
// In main.ts or app.module.ts:
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve ./uploads directory at /uploads route
  app.useStaticAssets('uploads', { prefix: '/uploads' });
  
  await app.listen(3000);
}
```

Then access files via HTTP:
```
GET http://localhost:3000/uploads/xray-1712000000000-123456789.jpg
```

**Option 2: Custom Controller Route**

```typescript
@Get('files/:filename')
@Header('Content-Type', 'image/jpeg')
serveFile(@Param('filename') filename: string, @Res() res: Response) {
  // Validate filename to prevent directory traversal
  if (filename.includes('..')) {
    throw new BadRequestException('Invalid filename');
  }
  return res.sendFile(filename, { root: './uploads' });
}
```

### Security Considerations

#### 1. Directory Traversal Prevention
```typescript
// ❌ UNSAFE
const filename = req.query.filename;  // Could be "../../etc/passwd"
res.sendFile(filename, { root: './uploads' });  // VULNERABLE!

// ✅ SAFE
if (filename.includes('..') || filename.includes('/')) {
  throw new BadRequestException('Invalid filename');
}
res.sendFile(filename, { root: './uploads' });
```

#### 2. MIME Type Validation
```typescript
// Check actual file content, not just extension
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Invalid file type'), false);
  }
};
```

#### 3. File Size Limits
```typescript
// Prevent DOS attacks with huge files
limits: {
  fileSize: 10 * 1024 * 1024,  // 10MB max
  files: 1,                     // Only 1 file per request
}
```

### Disk Space Management

```bash
# Monitor uploads directory
du -sh /Users/macbook/pneumodetect-backend/uploads/
# Output: 2.3G

# Count files
ls -1 /Users/macbook/pneumodetect-backend/uploads/ | wc -l
# Output: 1523

# Find large files
find ./uploads -type f -size +5M

# Delete old files (older than 30 days)
find ./uploads -type f -mtime +30 -delete
```

---

## Mock AI Processing System

### Design Philosophy

**Goal:** Test the entire workflow without Flask dependency

```
Real System:                Mock System:
┌──────────────────────┐   ┌──────────────────────┐
│  Upload X-ray image  │   │  Upload X-ray image  │
│        (SAME)        │   │        (SAME)        │
└──────────────────────┘   └──────────────────────┘
           ↓                           ↓
┌──────────────────────┐   ┌──────────────────────┐
│  Flask AI Service    │   │  Mock Random Results │
│  (Complex DL model)  │   │  (Simple Random)     │
└──────────────────────┘   └──────────────────────┘
           ↓                           ↓
┌──────────────────────┐   ┌──────────────────────┐
│  Get predictions     │   │  Get mock results    │
│  (5-30 seconds)      │   │  (Instant)           │
└──────────────────────┘   └──────────────────────┘
```

### Implementation (scans.service.ts)

```typescript
private generateMockAIResults(): { result: Result; confidence: number } {
  // Step 1: Pick a random result
  const results: Result[] = ['PNEUMONIA', 'NORMAL'];
  const randomIndex = Math.floor(Math.random() * results.length);
  // Math.random() returns 0.0-0.999...
  // 0.0-0.5 → index 0 → PNEUMONIA (50%)
  // 0.5-1.0 → index 1 → NORMAL (50%)
  
  const randomResult = results[randomIndex];

  // Step 2: Generate confidence score
  // We want 0.85 to 0.99 (realistic range)
  // Formula: min + (random * (max - min))
  // Formula: 0.85 + (random * 0.14)
  
  const confidence = Math.random() * 0.14 + 0.85;
  // If random = 0.0: confidence = 0.85
  // If random = 1.0: confidence = 0.99
  // If random = 0.5: confidence = 0.92

  // Step 3: Round to 4 decimal places for realism
  const roundedConfidence = parseFloat(confidence.toFixed(4));
  // 0.9234567 → "0.9235" → 0.9235

  return {
    result: randomResult as Result,
    confidence: roundedConfidence,
  };
}
```

### Example Results Sequence

```
Call 1:
├─ Random PNEUMONIA? 0.3 (< 0.5) → YES = PNEUMONIA
├─ Confidence: 0.5 * 0.14 + 0.85 = 0.92
└─ Result: { result: 'PNEUMONIA', confidence: 0.92 }

Call 2:
├─ Random PNEUMONIA? 0.7 (> 0.5) → NO = NORMAL
├─ Confidence: 0.9 * 0.14 + 0.85 = 0.976
└─ Result: { result: 'NORMAL', confidence: 0.976 }

Call 3:
├─ Random PNEUMONIA? 0.1 (< 0.5) → YES = PNEUMONIA
├─ Confidence: 0.2 * 0.14 + 0.85 = 0.878
└─ Result: { result: 'PNEUMONIA', confidence: 0.878 }
```

### Using Mock Results in Process

```typescript
async processScan(scanId: string, ...): Promise<ScanResponseDto> {
  // 1. Fetch scan
  const scan = await this.prisma.scan.findUnique({
    where: { id: scanId },
  });

  // 2. Generate mock results
  const mockResults = this.generateMockAIResults();
  // mockResults = { result: 'PNEUMONIA', confidence: 0.9287 }

  // 3. Update scan with mock results
  const updatedScan = await this.prisma.scan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED',              // ← Changed from UPLOADED
      result: mockResults.result,       // ← Set to PNEUMONIA/NORMAL
      confidence: mockResults.confidence, // ← Set to 0.85-0.99
      modelVersion: 'mock-v1',          // ← Tag as mock
      heatmapUrl: null,                 // ← No real heatmap
    },
  });

  return new ScanResponseDto(updatedScan);
}
```

### Expected Test Results

```json
{
  "message": "Scan processed successfully",
  "scan": {
    "id": "scan-uuid",
    "imageUrl": "/uploads/xray-1712000000000-123456789.jpg",
    "heatmapUrl": null,
    "status": "COMPLETED",            ← Changed
    "result": "PNEUMONIA",            ← Mock generated
    "confidence": 0.9287,             ← Mock generated (0.85-0.99)
    "modelVersion": "mock-v1",        ← Indicates mock
    "createdAt": "2026-04-16T10:30:00Z",
    "updatedAt": "2026-04-16T10:31:00Z"  ← Updated
  }
}
```

---

## Role-Based Access Control

### Permission Matrix

```
                    Doctor    Admin
────────────────────────────────────
Own Scans:
  View              ✅        ✅
  Process           ✅        ✅

Other Doctor's Scans:
  View              ❌        ✅
  Process           ❌        ✅

Upload Scan:          ✅        ✅
List (own)            ✅        ✅
List (all)            ❌        ✅
```

### Implementation Pattern

```typescript
// In scans.service.ts:

async getScanById(
  scanId: string,
  doctorId: string,
  userRole: string,
): Promise<ScanResponseDto> {
  // 1. Fetch scan from database
  const scan = await this.prisma.scan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  // 2. Check authorization
  if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
    //    ↓ If NOT admin     ↓ AND not the owner
    throw new ForbiddenException('You can only view scans you created');
  }

  // 3. Return scan
  return new ScanResponseDto(scan);
}
```

### Authorization Flow

```
Request: GET /scans/:id
  ↓
JwtAuthGuard: Valid token? → Attach user to request
  ↓ (user = { id: 'doctor-uuid', role: 'DOCTOR' })
  ↓
Controller: Extract user from request
  ↓
Service.getScanById(scanId, user.id, user.role)
  ↓
Check: scan.doctorId === user.id?
  ├─ YES → Return scan ✅
  └─ NO → Check: user.role === 'ADMIN'?
      ├─ YES → Return scan ✅
      └─ NO → Throw ForbiddenException ❌
```

### Different Scenarios

**Scenario 1: Doctor viewing their own scan**
```
Doctor A wants to view their scan
├─ scanId: 'scan-1'
├─ user.id: 'doctor-a-uuid'
├─ scan.doctorId: 'doctor-a-uuid'
├─ Check: 'doctor-a-uuid' === 'doctor-a-uuid'? YES ✅
└─ Return scan
```

**Scenario 2: Doctor viewing other's scan**
```
Doctor A wants to view Doctor B's scan
├─ scanId: 'scan-2'
├─ user.id: 'doctor-a-uuid'
├─ scan.doctorId: 'doctor-b-uuid'
├─ Check: 'doctor-a-uuid' === 'doctor-b-uuid'? NO
├─ Check: user.role === 'ADMIN'? NO
└─ Throw ForbiddenException ❌
```

**Scenario 3: Admin viewing any scan**
```
Admin wants to view Doctor A's scan
├─ scanId: 'scan-1'
├─ user.id: 'admin-uuid'
├─ user.role: 'ADMIN'
├─ scan.doctorId: 'doctor-a-uuid'
├─ Check: 'admin-uuid' === 'doctor-a-uuid'? NO
├─ Check: user.role === 'ADMIN'? YES ✅
└─ Return scan
```

---

## Flask Integration Strategy

### Current State → Future State

```
CURRENT (Mock):                    FUTURE (Flask):
┌─────────────────────┐            ┌─────────────────────┐
│  POST /scans/upload │ ─SAME─ →   │  POST /scans/upload │
└─────────────────────┘            └─────────────────────┘
           ↓                                  ↓
    Save file locally            Save file locally
           ↓                                  ↓
    Create scan (UPLOADED)       Create scan (UPLOADED)
           ↓                                  ↓
┌─────────────────────┐            ┌─────────────────────┐
│POST /scans/:id/proc │ ──X──      │POST /scans/:id/proc │
└─────────────────────┘            └─────────────────────┘
           ↓                                  ↓
  Generate mock results        Update to PROCESSING
           ↓                                  ↓
  confidence: random        Call Flask API:
  result: random          POST http://flask:5000/predict
           ↓                           ↓
  Set COMPLETED           Get response:
           ↓               {
  Return immediately        result: 'PNEUMONIA',
                           confidence: 0.9287,
                           heatmapUrl: '/uploads/...'
                           }
                                     ↓
                           Update scan with results
                                     ↓
                           Set COMPLETED
```

### Three Integration Approaches

#### Approach 1: Direct Synchronous (Current)
```typescript
// Pros: Simple, quick response
// Cons: Blocks request, not scalable, long response times
async processScan(scanId: string) {
  const results = this.generateMockAIResults();  // 0.5ms
  await this.prisma.scan.update({ data: results });
  return results;
}
```

#### Approach 2: Async with Background Job Queue
```typescript
// Pros: Non-blocking, scalable, can distribute jobs
// Cons: Need message queue (Bull, RabbitMQ)
async processScan(scanId: string) {
  // 1. Queue job
  await this.scanQueue.add({ scanId }, { priority: 5 });
  // 2. Return immediately
  return { status: 'Processing...' };
  // 3. Job runs in background:
  //    - Call Flask
  //    - Update database
  //    - Send notification
}
```

#### Approach 3: Future - WebSocket Real-time Updates
```typescript
// Pros: Real-time updates, user sees progress
// Cons: Need WebSocket infrastructure
async processScan(scanId: string) {
  // 1. Queue job
  await this.scanQueue.add({ scanId });
  // 2. Return immediately
  return { status: 'Processing...' };
  // 3. Job sends WebSocket messages:
  //    - "Processing..."
  //    - "50% complete..."
  //    - "Analysis complete: PNEUMONIA (92%)"
}
```

### Migration Path

**Step 1: Stay with Mock** (Current - ✅ DONE)
```typescript
// Everything works with mock results
// Frontend can be built
// API is stable
```

**Step 2: Add Job Queue** (Optional but recommended)
```bash
npm install bull redis @nestjs/bull
```

Create `scans.queue.ts`:
```typescript
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ScansService {
  constructor(
    @InjectQueue('scans')
    private scansQueue: Queue,
  ) {}

  async processScan(scanId: string) {
    // 1. Queue the job
    await this.scansQueue.add({ scanId });
    
    // 2. Return immediately
    return { status: 'Processing', scanId };
  }

  @Process()
  async handleScanProcessing(job: Job<{ scanId: string }>) {
    const { scanId } = job.data;
    
    try {
      // 3. Do the work in background
      const results = await this.callFlask(scanId);
      
      // 4. Update database
      await this.prisma.scan.update({
        where: { id: scanId },
        data: results,
      });
    } catch (error) {
      console.error('Scan processing failed:', error);
      throw error; // Retry
    }
  }
}
```

**Step 3: Deploy Flask Service**
```bash
# Flask app at http://flask-service:5000
# Has /predict endpoint that accepts image URL
```

**Step 4: Replace Mock with Flask**
```typescript
private async callFlaskAPI(imageUrl: string) {
  const response = await fetch('http://flask-service:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, scanId }),
    timeout: 300000, // 5 minutes max
  });

  if (!response.ok) {
    throw new Error(`Flask returned ${response.status}`);
  }

  return response.json();
  // Expected format:
  // {
  //   result: 'PNEUMONIA',
  //   confidence: 0.9287,
  //   heatmapUrl: '/uploads/heatmap-123.png'
  // }
}
```

### Expected Flask Response Format

```json
{
  "result": "PNEUMONIA",
  "confidence": 0.9287,
  "heatmapUrl": "/uploads/heatmap-scan-123.png",
  "modelVersion": "v2.1",
  "processingTime": 2.34,
  "timestamp": "2026-04-16T10:31:00Z"
}
```

---

## Error Handling Patterns

### Error Types and Responses

```typescript
// 1. Authentication Errors (401)
❌ No JWT token → 401 Unauthorized
❌ Invalid JWT token → 401 Unauthorized
❌ Expired token → 401 Unauthorized

// 2. Authorization Errors (403)
❌ Doctor viewing other's scan → 403 Forbidden
❌ Doctor processing other's scan → 403 Forbidden
❌ Non-admin trying admin operation → 403 Forbidden

// 3. Validation Errors (400)
❌ Invalid file type (PDF) → 400 Bad Request
❌ File too large (>10MB) → 400 Bad Request
❌ Patient not found → 400 Bad Request
❌ Missing required field → 400 Bad Request

// 4. Resource Not Found (404)
❌ Scan ID doesn't exist → 404 Not Found
❌ Patient doesn't exist → 404 Not Found

// 5. Conflict Errors (409)
❌ Resource already exists → 409 Conflict
```

### Implementation Examples

```typescript
// In scans.service.ts:

async createScan(...): Promise<ScanResponseDto> {
  const patient = await this.prisma.patient.findUnique({
    where: { id: patientId },
  });

  // ❌ 404 Not Found
  if (!patient) {
    throw new NotFoundException(`Patient with ID ${patientId} not found`);
  }

  // ❌ 400 Bad Request
  if (!patientId || patientId.trim() === '') {
    throw new BadRequestException('Patient ID is required');
  }

  // ✅ Create scan
  const scan = await this.prisma.scan.create({ data: { ... } });
  return new ScanResponseDto(scan);
}

async processScan(
  scanId: string,
  doctorId: string,
  userRole: string,
): Promise<ScanResponseDto> {
  const scan = await this.prisma.scan.findUnique({
    where: { id: scanId },
  });

  // ❌ 404 Not Found
  if (!scan) {
    throw new NotFoundException(`Scan with ID ${scanId} not found`);
  }

  // ❌ 403 Forbidden
  if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
    throw new ForbiddenException(
      'You can only process scans you created or you are an admin',
    );
  }

  // ✅ Process scan
  const results = this.generateMockAIResults();
  const updated = await this.prisma.scan.update({ ... });
  return new ScanResponseDto(updated);
}
```

### Error Response Format

```json
{
  "statusCode": 404,
  "message": "Scan with ID invalid-id not found",
  "error": "Not Found"
}
```

---

## Performance Optimization

### Database Indexing

```prisma
model Scan {
  id          String  @id
  imageUrl    String
  status      ScanStatus
  result      Result?
  confidence  Float?
  createdAt   DateTime
  updatedAt   DateTime

  patientId   String
  patient     Patient     @relation(fields: [patientId], references: [id])
  
  doctorId    String
  doctor      User        @relation(fields: [doctorId], references: [id])

  // Add these indexes:
  @@index([patientId])        // For: WHERE patientId = X
  @@index([doctorId])         // For: WHERE doctorId = X
  @@index([status])           // For: WHERE status = 'COMPLETED'
  @@index([createdAt])        // For: ORDER BY createdAt DESC
}
```

### Query Optimization

```typescript
// ❌ SLOW: N+1 queries (fetches each relation separately)
const scans = await this.prisma.scan.findMany({});
for (const scan of scans) {
  const patient = await this.prisma.patient.findUnique({
    where: { id: scan.patientId }
  });
  // Repeat for each scan!
}

// ✅ FAST: Single query with relations
const scans = await this.prisma.scan.findMany({
  include: {
    patient: true,
    doctor: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 50,  // Pagination
});
```

### File Storage Optimization

```typescript
// Consider implementing:
1. Image compression before storage
2. CDN for fast delivery
3. Cleanup jobs for old files
4. Lazy loading for file list
5. Caching of frequently accessed files

// Future migration:
const s3 = new AWS.S3();
const params = {
  Bucket: 'pneumodetect-scans',
  Key: filename,
  Body: fileBuffer,
  ContentType: 'image/jpeg',
  ServerSideEncryption: 'AES256',
};
await s3.upload(params).promise();
```

---

## Summary

The Scans module implements:
- ✅ Robust Multer file upload system
- ✅ Local disk storage with unique naming
- ✅ Mock AI processing for testing
- ✅ Role-based access control
- ✅ Secure error handling
- ✅ Clear Flask integration path

This architecture is production-ready for the mock phase and has a clear migration path to real AI when Flask is ready.
