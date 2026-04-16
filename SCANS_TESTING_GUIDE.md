# 🧪 Scans Module - Testing Guide

## Prerequisites

1. Backend running: `npm run start:dev`
2. PostgreSQL running
3. Valid JWT token from login
4. At least one patient created
5. Test image file (JPG/PNG)

---

## 🚀 Quick Start Test

### Step 1: Get Authentication Token

```bash
# Register a doctor
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor1@hospital.com",
    "password": "SecurePass123!",
    "name": "Dr. Sarah Smith"
  }'

# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor1@hospital.com",
    "password": "SecurePass123!"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": { "id": "<doctor-uuid>", "email": "doctor1@hospital.com", "role": "DOCTOR" }
# }

# Save token
export DOCTOR_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Step 2: Create a Patient

```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-2026-001",
    "name": "Patient Test One",
    "age": 52,
    "gender": "MALE"
  }'

# Response:
# {
#   "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
#   "idNumber": "PAT-2026-001",
#   ...
# }

# Save patient ID
export PATIENT_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Step 3: Create Test Image

```bash
# Create a simple test image (100x100 white PNG)
cat > /tmp/test_xray.jpg << 'EOF'
# Or use an actual chest X-ray image
# For quick testing, use any JPG/PNG file
EOF

# Option: Download a sample image
# curl -o /tmp/test_xray.jpg https://example.com/sample-xray.jpg
```

### Step 4: Upload Scan

```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/test_xray.jpg" \
  -F "patientId=$PATIENT_ID"

# Response:
# {
#   "message": "Scan uploaded successfully",
#   "scan": {
#     "id": "scan-uuid-here",
#     "imageUrl": "/uploads/test_xray-1712000000000-123456789.jpg",
#     "status": "UPLOADED",
#     "result": null,
#     "confidence": null,
#     ...
#   }
# }

# Save scan ID
export SCAN_ID="scan-uuid-here"
```

### Step 5: Process Scan

```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heatmapUrl": null
  }'

# Response:
# {
#   "message": "Scan processed successfully",
#   "scan": {
#     "id": "scan-uuid-here",
#     "imageUrl": "/uploads/test_xray-1712000000000-123456789.jpg",
#     "status": "COMPLETED",
#     "result": "PNEUMONIA",
#     "confidence": 0.9287,
#     "modelVersion": "mock-v1",
#     ...
#   }
# }
```

### Step 6: Retrieve Scans

```bash
# Get all your scans
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Get specific scan
curl -X GET http://localhost:3000/scans/$SCAN_ID \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

---

## 📋 Comprehensive Test Cases

### Test 1: File Upload Validation

#### 1.1 Valid JPG Upload
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "patientId=$PATIENT_ID"

# Expected: 201 Created
```

#### 1.2 Valid PNG Upload
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/path/to/image.png" \
  -F "patientId=$PATIENT_ID"

# Expected: 201 Created
```

#### 1.3 Invalid File Type (PDF)
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/path/to/document.pdf" \
  -F "patientId=$PATIENT_ID"

# Expected: 400 Bad Request
# Message: "Only JPG, JPEG, and PNG files are allowed"
```

#### 1.4 Invalid File Type (TXT)
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/path/to/file.txt" \
  -F "patientId=$PATIENT_ID"

# Expected: 400 Bad Request
```

#### 1.5 No File Provided
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "patientId=$PATIENT_ID"

# Expected: 400 Bad Request
# Message: "No image file provided"
```

#### 1.6 File Too Large (>10MB)
```bash
# Create 11MB file
dd if=/dev/zero of=/tmp/large_file.jpg bs=1M count=11

curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/large_file.jpg" \
  -F "patientId=$PATIENT_ID"

# Expected: 400 Bad Request
# Message: "File too large"
```

---

### Test 2: Patient Validation

#### 2.1 Non-existent Patient
```bash
export FAKE_PATIENT_ID="00000000-0000-0000-0000-000000000000"

curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/test_xray.jpg" \
  -F "patientId=$FAKE_PATIENT_ID"

# Expected: 400 Bad Request
# Message: "Patient with ID ... not found"
```

#### 2.2 Multiple Scans Same Patient
```bash
# Upload scan 1
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/test_xray.jpg" \
  -F "patientId=$PATIENT_ID"

# Upload scan 2 (same patient)
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/test_xray.jpg" \
  -F "patientId=$PATIENT_ID"

# Expected: Both succeed with different scan IDs
```

---

### Test 3: Processing Logic

#### 3.1 Process Valid Scan
```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"heatmapUrl": null}'

# Expected: 200 OK
# Result: PNEUMONIA or NORMAL (randomly)
# Confidence: 0.85-0.99
```

#### 3.2 Process Multiple Times (Idempotent)
```bash
# First process
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Second process (same scan)
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: Both succeed (second overwrites first result)
```

#### 3.3 Process Non-existent Scan
```bash
curl -X POST http://localhost:3000/scans/00000000-0000-0000-0000-000000000000/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 404 Not Found
# Message: "Scan with ID ... not found"
```

#### 3.4 Process with Custom Heatmap
```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heatmapUrl": "/uploads/heatmap-123.png"
  }'

# Expected: 200 OK
# Verify: Response includes "heatmapUrl": "/uploads/heatmap-123.png"
```

---

### Test 4: Access Control

#### 4.1 Unauthorized Access (No Token)
```bash
curl -X GET http://localhost:3000/scans \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
```

#### 4.2 Invalid JWT Token
```bash
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer invalid-token-12345"

# Expected: 401 Unauthorized
```

#### 4.3 Doctor Can Only See Own Scans

```bash
# Create second doctor
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor2@hospital.com",
    "password": "SecurePass123!",
    "name": "Dr. John Smith"
  }'

# Login as doctor 2
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor2@hospital.com",
    "password": "SecurePass123!"
  }'

export DOCTOR2_TOKEN="..."

# Doctor 2 tries to view Doctor 1's scan
curl -X GET http://localhost:3000/scans/$SCAN_ID \
  -H "Authorization: Bearer $DOCTOR2_TOKEN"

# Expected: 403 Forbidden
# Message: "You can only view scans you created"
```

#### 4.4 Doctor Cannot Process Other's Scan
```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 403 Forbidden
# Message: "You can only process scans you created or you are an admin"
```

#### 4.5 Admin Can View All Scans

```bash
# Create admin user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "AdminPass123!",
    "name": "Admin User"
  }'

# Manually set role to ADMIN in database (or via admin endpoint)
# Then login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "AdminPass123!"
  }'

export ADMIN_TOKEN="..."

# Admin views all scans
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 200 OK
# Result: All scans in system (not just their own)
```

#### 4.6 Admin Can Process Other's Scan
```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 200 OK (admin can process any scan)
```

---

### Test 5: List Operations

#### 5.1 Get Empty Scan List
```bash
# New doctor with no scans
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $NEW_DOCTOR_TOKEN"

# Expected: 200 OK
# Response: { "count": 0, "scans": [] }
```

#### 5.2 Get Multiple Scans (Ordered)
```bash
# Create 3 scans
for i in {1..3}; do
  curl -X POST http://localhost:3000/scans/upload \
    -H "Authorization: Bearer $DOCTOR_TOKEN" \
    -F "image=@/tmp/test_xray.jpg" \
    -F "patientId=$PATIENT_ID"
  sleep 1
done

# Get list
curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Expected: 200 OK
# Result: Count = 3, ordered by newest first (most recent first)
```

#### 5.3 Get Specific Scan
```bash
curl -X GET http://localhost:3000/scans/$SCAN_ID \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Expected: 200 OK
# Result: Single scan object with all details
```

#### 5.4 Get Non-existent Scan
```bash
curl -X GET http://localhost:3000/scans/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Expected: 404 Not Found
# Message: "Scan with ID ... not found"
```

---

## 🔍 Response Verification

### Successful Upload Response Structure
```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/test_xray.jpg" \
  -F "patientId=$PATIENT_ID" | jq .

# Verify:
# ✓ statusCode: 201
# ✓ scan.id exists (UUID format)
# ✓ scan.imageUrl exists (starts with /uploads/)
# ✓ scan.status === "UPLOADED"
# ✓ scan.result === null
# ✓ scan.confidence === null
# ✓ scan.patient object exists with correct data
# ✓ scan.doctor object exists with user info
```

### Successful Process Response Structure
```bash
curl -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Verify:
# ✓ statusCode: 200
# ✓ scan.status === "COMPLETED"
# ✓ scan.result === "PNEUMONIA" or "NORMAL"
# ✓ scan.confidence is number between 0.85-0.99
# ✓ scan.modelVersion === "mock-v1"
# ✓ scan.updatedAt is newer than createdAt
```

---

## 📊 Performance Testing

### Test File Upload Speed
```bash
# Create 5MB test file
dd if=/dev/zero of=/tmp/5mb_test.jpg bs=1M count=5

# Measure upload time
time curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/5mb_test.jpg" \
  -F "patientId=$PATIENT_ID"

# Expected: < 500ms for 5MB on local network
```

### Test Concurrent Uploads
```bash
# Upload 5 scans in parallel
for i in {1..5}; do
  curl -X POST http://localhost:3000/scans/upload \
    -H "Authorization: Bearer $DOCTOR_TOKEN" \
    -F "image=@/tmp/test_xray.jpg" \
    -F "patientId=$PATIENT_ID" &
done
wait

# Expected: All succeed
```

### Test List Performance
```bash
# Create 50 scans
for i in {1..50}; do
  curl -X POST http://localhost:3000/scans/upload \
    -H "Authorization: Bearer $DOCTOR_TOKEN" \
    -F "image=@/tmp/test_xray.jpg" \
    -F "patientId=$PATIENT_ID" > /dev/null
done

# Time list retrieval
time curl -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Expected: < 200ms with database indexing
```

---

## 🐛 Debugging Tips

### Enable Verbose Output
```bash
# See request/response details
curl -v -X GET http://localhost:3000/scans \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

### Check File System
```bash
# Verify uploads folder
ls -lah /Users/macbook/pneumodetect-backend/uploads/

# Check file size
du -h /Users/macbook/pneumodetect-backend/uploads/*

# Clean up test files
rm /Users/macbook/pneumodetect-backend/uploads/*
```

### Database Inspection
```bash
# Connect to PostgreSQL
psql -h localhost -p 5434 -U postgres -d pneumodetect

# View all scans
SELECT id, imageUrl, status, result, confidence FROM "Scan";

# View specific patient's scans
SELECT * FROM "Scan" WHERE "patientId" = '<patient-uuid>';

# Check disk space
SELECT COUNT(*) as total_scans FROM "Scan";
```

### Server Logs
```bash
# Terminal with npm run start:dev should show:
# - File upload logs
# - Query logs
# - Error messages
```

---

## ✅ Final Validation Checklist

- [ ] Upload JPG/PNG files successfully
- [ ] Reject non-image files
- [ ] Create scans with correct patient
- [ ] Process scans with mock results
- [ ] View scan history (newest first)
- [ ] View specific scan details
- [ ] Doctor cannot see other's scans
- [ ] Admin can see all scans
- [ ] Process without JWT returns 401
- [ ] Invalid patient returns 400
- [ ] Non-existent scan returns 404
- [ ] Files saved in /uploads directory
- [ ] Status transitions UPLOADED → COMPLETED
- [ ] Confidence values in 0.85-0.99 range
- [ ] Results alternate PNEUMONIA/NORMAL randomly

---

## 🚀 Ready for Production Testing?

Once all tests pass, you're ready to:
1. ✅ Integrate real Flask service
2. ✅ Add async job queue
3. ✅ Move to cloud storage
4. ✅ Set up proper error monitoring
5. ✅ Deploy to staging environment
