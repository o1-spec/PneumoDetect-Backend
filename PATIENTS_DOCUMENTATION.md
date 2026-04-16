# 🏥 Patients Module Documentation

## 📋 Overview

The Patients module manages medical records for patients in the PneumoDetect system. It provides CRUD operations for patient demographics and connects to the Scans module for diagnostic imaging.

---

## 🏗️ Architecture: Users vs Patients vs Scans

### **Conceptual Model**

```
USERS (Healthcare Professionals)
├── Purpose: Authentication & Authorization
├── Contains: Credentials, roles, contact info
├── Operations: Login, profile management, role control
└── Lifecycle: Account creation to deletion

       ↓ creates/manages

PATIENTS (Medical Records)
├── Purpose: Store patient demographics
├── Contains: ID number, name, age, gender
├── Operations: CRUD on patient records
└── Lifecycle: Patient enrollment to record deletion

       ↓ associated with

SCANS (Diagnostic Imaging)
├── Purpose: Store X-ray images and AI analysis
├── Contains: Image URL, heatmap, AI results, confidence
├── Operations: Upload, process, analyze, retrieve results
└── Lifecycle: Upload to archived
```

### **Why This Structure?**

1. **Data Independence**
   - Patient records exist independently of users
   - Multiple clinicians can work with same patient
   - Patient data persists across user changes

2. **Access Patterns**
   - Users: Write on login (auth check)
   - Patients: Read-heavy (frequent searches)
   - Scans: Append operations (new uploads)

3. **Privacy Compliance**
   - Users = PII (personally identifiable info)
   - Patients = PHI (protected health information)
   - Different retention policies apply

4. **Scalability**
   - Users: Small table, frequently accessed
   - Patients: Growing table, indexed for search
   - Scans: Largest, append-optimized

### **How Scans Will Connect**

```typescript
// Future Scan Model
model Scan {
  id             String
  imageUrl       String      // S3/storage link
  heatmapUrl     String?     // AI heatmap
  status         ScanStatus  // UPLOADED → PROCESSING → COMPLETED
  result         Result?     // PNEUMONIA | NORMAL
  confidence     Float?      // 0.0-1.0
  modelVersion   String?     // AI model version
  createdAt      DateTime
  updatedAt      DateTime

  patientId      String      // ← FK to Patient
  patient        Patient     // Many scans per patient
  
  doctorId       String      // ← FK to User
  doctor         User        // Many scans per doctor
}

// Workflow
1. Clinician authenticates (User)
2. Uploads X-ray for specific patient (Scan created)
3. AI service processes image
4. Results stored in Scan record
5. Clinician views results linked to patient
```

---

## 📡 API Endpoints

### **Create Patient**
```http
POST /patients
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "idNumber": "PAT-12345",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE"
}

Response: 201 Created
{
  "id": "uuid-123",
  "idNumber": "PAT-12345",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE",
  "createdAt": "2026-04-16T...",
  "updatedAt": "2026-04-16T..."
}
```

### **Get All Patients**
```http
GET /patients
Authorization: Bearer <jwt-token>

Response: 200 OK
[
  {
    "id": "uuid-123",
    "idNumber": "PAT-12345",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE",
    "createdAt": "2026-04-16T...",
    "updatedAt": "2026-04-16T..."
  },
  ...
]
```

### **Get Patient by ID**
```http
GET /patients/:id
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "id": "uuid-123",
  "idNumber": "PAT-12345",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE",
  "createdAt": "2026-04-16T...",
  "updatedAt": "2026-04-16T..."
}
```

### **Get Patient with Scans**
```http
GET /patients/:id?includeScans=true
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "id": "uuid-123",
  "idNumber": "PAT-12345",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE",
  "createdAt": "2026-04-16T...",
  "scans": [
    {
      "id": "scan-123",
      "status": "COMPLETED",
      "result": "PNEUMONIA",
      "confidence": 0.92,
      "createdAt": "2026-04-16T..."
    }
  ]
}
```

### **Update Patient**
```http
PATCH /patients/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Updated",
  "age": 46,
  "gender": "MALE"
}

Response: 200 OK
{
  "id": "uuid-123",
  "idNumber": "PAT-12345",
  "name": "John Updated",
  "age": 46,
  "gender": "MALE",
  "createdAt": "2026-04-16T...",
  "updatedAt": "2026-04-16T..."
}

Note: idNumber cannot be updated (immutable)
```

### **Delete Patient**
```http
DELETE /patients/:id
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "message": "Patient uuid-123 deleted successfully"
}

⚠️ WARNING: Cascades to delete all associated scans
```

---

## ✅ Validation Rules

### **idNumber**
- Required, must be string
- Must be unique in database
- Returns 409 Conflict if duplicate

### **name**
- Required, must be string
- Any length

### **age**
- Required, must be integer
- Range: 0-150
- Returns 400 Bad Request if outside range

### **gender**
- Required, must be enum: MALE | FEMALE
- Case-sensitive

---

## 🔐 Security

### **Authentication**
- All endpoints require JWT token
- `@UseGuards(JwtAuthGuard)` on controller
- Invalid/expired tokens return 401 Unauthorized

### **Authorization**
- Any authenticated user (ADMIN or CLINICIAN) can:
  - Create patients
  - View patients
  - Update patients
  - Delete patients
- Future: Can add role-based restrictions (e.g., only admins can delete)

### **Data Protection**
- No sensitive data exposed
- Responses only include non-sensitive fields
- Future: Add HIPAA audit logging

---

## 🔄 Error Handling

| Error | Status | Response |
|-------|--------|----------|
| Duplicate idNumber | 409 Conflict | `Patient with ID number X already exists` |
| Patient not found | 404 Not Found | `Patient with ID X not found` |
| Invalid age | 400 Bad Request | `Age must be between 0 and 150` |
| Missing JWT | 401 Unauthorized | `Unauthorized` |
| Invalid enum | 400 Bad Request | `Enum validation error` |

### **Example Error Response**
```json
{
  "statusCode": 409,
  "message": "Patient with ID number PAT-12345 already exists",
  "error": "Conflict"
}
```

---

## 💾 Database Schema

```prisma
model Patient {
  id             String    @id @default(uuid())
  idNumber       String    @unique              // Patient's medical ID
  name           String
  age            Int
  gender         Gender
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  scans          Scan[]                         // 1-to-many with Scans
}

enum Gender {
  MALE
  FEMALE
}
```

---

## 🔗 Integration with Other Modules

### **With Auth Module**
- Patients API requires JWT token
- Token generated via `/auth/login`
- Guard: `JwtAuthGuard`

### **With Users Module**
- Future: Track which clinician created patient
- Future: Add created_by field to Patient

### **With Scans Module (Future)**
- Scan records will have `patientId` foreign key
- Multiple scans per patient
- Cascade delete: Deleting patient deletes scans

### **With Admin Module**
- Admins can manage all patients
- Future: Role-based patient access control

---

## 📝 Service Methods

### **createPatient(createPatientDto)**
- Creates new patient
- Validates unique idNumber
- Returns: PatientResponseDto
- Throws: ConflictException, BadRequestException

### **getAllPatients()**
- Returns all patients
- Ordered by newest first
- Returns: PatientResponseDto[]

### **getPatientById(patientId, includeScans?)**
- Gets specific patient
- Optional: Include related scans
- Returns: PatientResponseDto
- Throws: NotFoundException

### **getPatientByIdNumber(idNumber)**
- Lookup by medical ID number
- Returns: PatientResponseDto
- Throws: NotFoundException

### **updatePatient(patientId, updateData)**
- Updates patient fields
- Prevents updating idNumber
- Returns: PatientResponseDto
- Throws: NotFoundException

### **deletePatient(patientId)**
- Deletes patient
- Cascades to scans
- Returns: { message: string }
- Throws: NotFoundException

### **patientExists(patientId)**
- Helper method for other services
- Returns: boolean
- Used in Scans module validation

---

## 🧪 Example Workflows

### **Workflow 1: Create and Retrieve Patient**
```bash
# 1. Register/Login user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@hospital.com", "password": "password"}'
# Get: { accessToken: "..." }

# 2. Create patient
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE"
  }'
# Get: { id: "uuid-123", ... }

# 3. Retrieve patient
curl -X GET http://localhost:3000/patients/uuid-123 \
  -H "Authorization: Bearer <token>"
# Get: { id, idNumber, name, age, gender, ... }
```

### **Workflow 2: Update Patient**
```bash
curl -X PATCH http://localhost:3000/patients/uuid-123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"age": 46}'
# Get: Updated patient object
```

### **Workflow 3: Get Patient with Scans (Future)**
```bash
curl -X GET "http://localhost:3000/patients/uuid-123?includeScans=true" \
  -H "Authorization: Bearer <token>"
# Get: Patient object with nested scans array
```

---

## 🚀 Future Enhancements

### **Short Term**
1. Add pagination to GET /patients
2. Add search/filter by name or idNumber
3. Add soft delete (keep data for audit)
4. Add created_by user tracking

### **Medium Term**
1. Role-based access control (clinicians see only their patients)
2. Patient history/timeline view
3. Bulk patient upload via CSV
4. Advanced search with multiple filters

### **Long Term**
1. HIPAA compliance logging
2. Patient API for self-service portal
3. Integration with external EMR systems
4. Patient preferences and contact info
5. Medical history tracking

---

## 📚 Related Documentation

- **Auth Module**: `USERS_ADMIN_DOCUMENTATION.md`
- **Scans Module**: (Coming soon)
- **API Reference**: See endpoint specifications above

---

## ✨ Key Features

✅ Full CRUD operations
✅ Unique patient ID enforcement
✅ Input validation with class-validator
✅ JWT authentication required
✅ Proper error handling
✅ Ready for Scans integration
✅ Type-safe TypeScript
✅ Clean code architecture

