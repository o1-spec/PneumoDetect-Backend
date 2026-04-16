# 🧪 Patients Module - Testing Guide

## ⚡ Quick Test Workflow

### Prerequisites
- Server running: `npm run start:dev`
- JWT token ready (get via login)

### 1. Get JWT Token
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "password"
  }' | jq -r '.accessToken')

echo "Token: $TOKEN"
```

### 2. Create Patient
```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE"
  }'
```

**Response:**
```json
{
  "id": "uuid-123",
  "idNumber": "PAT-001",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE",
  "createdAt": "2026-04-16T...",
  "updatedAt": "2026-04-16T..."
}
```

### 3. Get All Patients
```bash
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid-123",
    "idNumber": "PAT-001",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE",
    "createdAt": "2026-04-16T...",
    "updatedAt": "2026-04-16T..."
  }
]
```

### 4. Get Specific Patient
```bash
PATIENT_ID="uuid-123"

curl -X GET http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Patient
```bash
curl -X PATCH http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "age": 46
  }'
```

### 6. Delete Patient
```bash
curl -X DELETE http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "Patient uuid-123 deleted successfully"
}
```

---

## 🧪 Error Cases to Test

### Test 1: Missing JWT Token
```bash
curl -X GET http://localhost:3000/patients
# Expected: 401 Unauthorized
```

### Test 2: Duplicate ID Number
```bash
# Create patient first
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "John",
    "age": 45,
    "gender": "MALE"
  }'

# Try to create another with same idNumber
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "Jane",
    "age": 40,
    "gender": "FEMALE"
  }'
# Expected: 409 Conflict - "Patient with ID number PAT-001 already exists"
```

### Test 3: Invalid Age
```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-999",
    "name": "Invalid",
    "age": 200,
    "gender": "MALE"
  }'
# Expected: 400 Bad Request - "Age must be between 0 and 150"
```

### Test 4: Invalid Gender
```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-002",
    "name": "Test",
    "age": 40,
    "gender": "INVALID"
  }'
# Expected: 400 Bad Request - Enum validation error
```

### Test 5: Patient Not Found
```bash
curl -X GET http://localhost:3000/patients/nonexistent-id \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found - "Patient with ID nonexistent-id not found"
```

### Test 6: Update Nonexistent Patient
```bash
curl -X PATCH http://localhost:3000/patients/nonexistent-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated"}'
# Expected: 404 Not Found
```

---

## 🧬 Integration Test

### Full Workflow: Create → Retrieve → Update → Delete
```bash
#!/bin/bash

# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"password"}' \
  | jq -r '.accessToken')

echo "✅ Got token"

# 2. Create patient
PATIENT=$(curl -s -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "TEST-'$(date +%s)'",
    "name": "Test Patient",
    "age": 50,
    "gender": "MALE"
  }')

PATIENT_ID=$(echo $PATIENT | jq -r '.id')
echo "✅ Created patient: $PATIENT_ID"

# 3. Retrieve patient
curl -s -X GET http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Retrieved patient"

# 4. Update patient
curl -s -X PATCH http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"age": 51}' | jq .
echo "✅ Updated patient"

# 5. Delete patient
curl -s -X DELETE http://localhost:3000/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Deleted patient"

echo "✅ All tests passed!"
```

---

## 📊 Testing with Postman

### 1. Create Postman Collection
```
PneumoDetect API
├── Auth
│   └── Login
│
└── Patients
    ├── Create Patient
    ├── Get All Patients
    ├── Get Patient by ID
    ├── Update Patient
    └── Delete Patient
```

### 2. Environment Variables
```json
{
  "base_url": "http://localhost:3000",
  "token": "YOUR_JWT_TOKEN",
  "patient_id": "YOUR_PATIENT_ID"
}
```

### 3. Pre-request Script for Auto-Token
```javascript
// For Auth → Login request
if (pm.response.code === 200) {
  pm.environment.set("token", pm.response.json().accessToken);
}
```

---

## ✅ Test Checklist

### Authentication & Authorization
- [ ] Request without token returns 401
- [ ] Request with invalid token returns 401
- [ ] Request with valid token succeeds

### Create Patient
- [ ] Valid create succeeds with 201
- [ ] Duplicate idNumber returns 409
- [ ] Invalid age returns 400
- [ ] Invalid gender returns 400
- [ ] Missing required field returns 400
- [ ] Response has all correct fields

### Retrieve Patient
- [ ] Get all returns array
- [ ] Get by ID returns object
- [ ] Get nonexistent returns 404
- [ ] Pagination works (future)
- [ ] Search/filter works (future)

### Update Patient
- [ ] Update valid fields succeeds
- [ ] Cannot update idNumber
- [ ] Update nonexistent returns 404
- [ ] Invalid age returns 400

### Delete Patient
- [ ] Delete succeeds with 200
- [ ] Delete nonexistent returns 404
- [ ] Cascades delete scans (future)

### Data Validation
- [ ] idNumber is unique
- [ ] Age range 0-150
- [ ] Gender enum values
- [ ] Name is string
- [ ] Timestamps auto-generated

---

## 📈 Performance Testing

### Test Large Patient List
```bash
# Create 100 patients
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/patients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "idNumber": "PAT-'$i'",
      "name": "Patient '$i'",
      "age": '$((RANDOM % 80))',
      "gender": "'"$([ $((RANDOM % 2)) == 0 ] && echo "MALE" || echo "FEMALE")"'"
    }' > /dev/null
  echo "Created patient $i"
done

# Retrieve all patients (measure response time)
time curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'
```

---

## 🐛 Debugging Tips

### Enable Logging
```bash
# In patients.service.ts
console.log('Creating patient:', createPatientDto);
console.log('Query result:', patient);
```

### Check Database
```bash
# Connect to database
docker exec -it pneumodetect_postgres psql -U postgres -d pneumodetect

# Query patients
SELECT * FROM "Patient";
SELECT * FROM "Patient" WHERE "idNumber" = 'PAT-001';
```

### Check Prisma Queries
```bash
# Enable Prisma logging
export DEBUG="prisma:*"
npm run start:dev
```

---

## 📝 Sample Data

### Valid Patients
```json
{
  "idNumber": "PAT-001",
  "name": "John Doe",
  "age": 45,
  "gender": "MALE"
}

{
  "idNumber": "MED-12345",
  "name": "Jane Smith",
  "age": 32,
  "gender": "FEMALE"
}

{
  "idNumber": "ID-999",
  "name": "Robert Johnson",
  "age": 78,
  "gender": "MALE"
}
```

---

## 🎯 Expected Behavior Summary

| Operation | Input | Expected | HTTP Status |
|-----------|-------|----------|------------|
| Create unique | Valid data | Patient created | 201 |
| Create duplicate | Duplicate idNumber | Error | 409 |
| Get all | No params | Array of patients | 200 |
| Get one | Valid ID | Patient object | 200 |
| Get missing | Invalid ID | Error | 404 |
| Update | Valid data | Updated patient | 200 |
| Update missing | Invalid ID | Error | 404 |
| Delete | Valid ID | Success message | 200 |
| Delete missing | Invalid ID | Error | 404 |

