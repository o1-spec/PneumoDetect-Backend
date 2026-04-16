# 🧪 Analytics Module - Testing Guide

## Quick Start Test

### Step 1: Get JWT Token

```bash
# Register a clinician
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!",
    "name": "Dr. Sarah Smith"
  }'

# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!"
  }'

# Save token
export DOCTOR_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Step 2: Create Some Scans

```bash
# First, create a patient
PATIENT=$(curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-001",
    "name": "John Doe",
    "age": 45,
    "gender": "MALE"
  }' | jq -r '.id')

export PATIENT_ID=$PATIENT

# Create 5 scans
for i in {1..5}; do
  SCAN=$(curl -X POST http://localhost:3000/scans/upload \
    -H "Authorization: Bearer $DOCTOR_TOKEN" \
    -F "image=@/tmp/test_xray.jpg" \
    -F "patientId=$PATIENT_ID" | jq -r '.scan.id')
  
  # Process each scan (generates mock results)
  curl -X POST http://localhost:3000/scans/$SCAN/process \
    -H "Authorization: Bearer $DOCTOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' > /dev/null
  
  sleep 1
done
```

### Step 3: Get Analytics Stats

```bash
# Request stats
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq .

# Expected Response:
# {
#   "totalScans": 5,
#   "completedScans": 5,
#   "processingScans": 0,
#   "failedScans": 0,
#   "pneumoniaCases": 2,        (approximately)
#   "normalCases": 3,           (approximately)
#   "averageConfidence": 0.91,
#   "recentScans": [
#     {
#       "id": "scan-1",
#       "result": "PNEUMONIA",
#       "status": "COMPLETED",
#       "confidence": 0.95,
#       "createdAt": "...",
#       "patient": {
#         "id": "patient-id",
#         "name": "John Doe",
#         "idNumber": "PAT-001"
#       }
#     },
#     ...
#   ]
# }
```

---

## Test Cases

### Test 1: Basic Stats Response

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq .

# Verify response has all fields:
# ✓ totalScans (number)
# ✓ completedScans (number)
# ✓ processingScans (number)
# ✓ failedScans (number)
# ✓ pneumoniaCases (number)
# ✓ normalCases (number)
# ✓ averageConfidence (number or null)
# ✓ recentScans (array)
```

### Test 2: Recent Scans Structure

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.recentScans[0]'

# Each recent scan should have:
# ✓ id (string UUID)
# ✓ result (string: PNEUMONIA or NORMAL, or null)
# ✓ status (string: COMPLETED, PROCESSING, etc)
# ✓ confidence (number 0-1, or null)
# ✓ createdAt (ISO timestamp)
# ✓ patient.id (string UUID)
# ✓ patient.name (string)
# ✓ patient.idNumber (string)
```

### Test 3: Recent Scans Limited to 5

```bash
# Create 10 scans
for i in {1..10}; do
  # ... upload and process scan ...
done

# Get stats
RECENT_COUNT=$(curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.recentScans | length')

# Expected: 5 (not 10)
echo "Recent scans count: $RECENT_COUNT"
```

### Test 4: Recent Scans Ordered Newest First

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.recentScans[].createdAt'

# Should show timestamps in descending order
# Latest timestamp first
# Oldest timestamp last
```

### Test 5: Clinician Role Filtering

```bash
# Doctor 1 creates 3 scans
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "image=@/tmp/xray.jpg" \
  -F "patientId=$PATIENT_ID"

# Get stats as Doctor 1
DOCTOR1_TOTAL=$(curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.totalScans')

# Doctor 2 creates 5 scans
DOCTOR2_TOKEN="..."
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $DOCTOR2_TOKEN" \
  -F "image=@/tmp/xray.jpg" \
  -F "patientId=$PATIENT_ID"

# Get stats as Doctor 1 again
DOCTOR1_TOTAL_AGAIN=$(curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.totalScans')

# Expected: Both should be same (Doctor 1 only sees own scans)
# $DOCTOR1_TOTAL === $DOCTOR1_TOTAL_AGAIN
```

### Test 6: Admin Role Filtering

```bash
# Register admin user and set role in database
# (Or use /admin endpoint if available)

ADMIN_TOKEN="..."

# Admin gets stats for ALL scans (including all doctors)
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.totalScans'

# Expected: Much higher than any individual doctor
```

### Test 7: No JWT Token

```bash
curl -X GET http://localhost:3000/analytics/stats

# Expected: 401 Unauthorized
# {
#   "statusCode": 401,
#   "message": "Unauthorized",
#   "error": "Unauthorized"
# }
```

### Test 8: Invalid JWT Token

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer invalid-token-12345"

# Expected: 401 Unauthorized
```

### Test 9: Empty Stats (No Scans)

```bash
# Create new user with no scans
NEW_TOKEN="..."

curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $NEW_TOKEN" | jq .

# Expected response:
# {
#   "totalScans": 0,
#   "completedScans": 0,
#   "processingScans": 0,
#   "failedScans": 0,
#   "pneumoniaCases": 0,
#   "normalCases": 0,
#   "averageConfidence": null,
#   "recentScans": []
# }
```

### Test 10: Average Confidence Calculation

```bash
# Create 3 scans with known confidences
# (This requires more manual setup or mocking)

curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.averageConfidence'

# Example: If scans have confidence [0.90, 0.92, 0.94]
# Expected: (0.90 + 0.92 + 0.94) / 3 = 0.9200
```

---

## Performance Testing

### Test Load Time

```bash
# Time the stats endpoint
time curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null

# Expected: < 200ms for typical dataset (hundreds of scans)
```

### Test with Large Dataset

```bash
# Create 100 scans
for i in {1..100}; do
  # Create and process scan
done

# Time stats retrieval
time curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null

# Should still be fast (< 500ms)
```

---

## Debugging Tips

### View Full Response

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq . | cat
```

### Extract Specific Field

```bash
# Get just total scans
curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.totalScans'

# Get just pneumonia cases
curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.pneumoniaCases'

# Get just average confidence
curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.averageConfidence'

# Get just recent scans count
curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq '.recentScans | length'
```

### Save Response to File

```bash
curl -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > analytics_response.json

cat analytics_response.json | jq .
```

### Pretty Print Response

```bash
curl -s -X GET http://localhost:3000/analytics/stats \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq . --tab
```

---

## Validation Checklist

Before considering module complete:

- [ ] GET /analytics/stats returns 200 OK
- [ ] Response includes all 8 fields
- [ ] recentScans array has max 5 items
- [ ] averageConfidence is number between 0-1 or null
- [ ] Clinician sees only their scans
- [ ] Admin sees all scans
- [ ] No JWT token returns 401
- [ ] Invalid token returns 401
- [ ] Empty stats work correctly
- [ ] Recent scans ordered newest first
- [ ] Patient info included in scans
- [ ] Response time < 200ms

---

## Example Full Response

```json
{
  "totalScans": 12,
  "completedScans": 10,
  "processingScans": 1,
  "failedScans": 1,
  "pneumoniaCases": 4,
  "normalCases": 6,
  "averageConfidence": 0.9145,
  "recentScans": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "result": "PNEUMONIA",
      "status": "COMPLETED",
      "confidence": 0.95,
      "createdAt": "2026-04-16T15:30:00.000Z",
      "patient": {
        "id": "p1a2t3i4-e5n6t7-8910-abcd-ef1234567890",
        "name": "John Doe",
        "idNumber": "PAT-001"
      }
    },
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
      "result": "NORMAL",
      "status": "COMPLETED",
      "confidence": 0.88,
      "createdAt": "2026-04-16T14:15:00.000Z",
      "patient": {
        "id": "p2a3t4i5-e6n7t8-9012-cdef-g12345678901",
        "name": "Jane Smith",
        "idNumber": "PAT-002"
      }
    },
    {
      "id": "c3d4e5f6-g7h8-9012-cdef-g12345678012",
      "result": "PNEUMONIA",
      "status": "COMPLETED",
      "confidence": 0.93,
      "createdAt": "2026-04-16T13:45:00.000Z",
      "patient": {
        "id": "p1a2t3i4-e5n6t7-8910-abcd-ef1234567890",
        "name": "John Doe",
        "idNumber": "PAT-001"
      }
    },
    {
      "id": "d4e5f6g7-h8i9-0123-defg-h12345678123",
      "result": "NORMAL",
      "status": "COMPLETED",
      "confidence": 0.91,
      "createdAt": "2026-04-16T12:30:00.000Z",
      "patient": {
        "id": "p3a4t5i6-e7n8t9-0123-defg-h12345678123",
        "name": "Michael Johnson",
        "idNumber": "PAT-003"
      }
    },
    {
      "id": "e5f6g7h8-i9j0-1234-efgh-i12345678234",
      "result": null,
      "status": "PROCESSING",
      "confidence": null,
      "createdAt": "2026-04-16T11:20:00.000Z",
      "patient": {
        "id": "p4a5t6i7-e8n9t0-1234-efgh-i12345678234",
        "name": "Sarah Williams",
        "idNumber": "PAT-004"
      }
    }
  ]
}
```

---

## Integration with Mobile App

### React Native Example

```typescript
import { useEffect, useState } from 'react';

export function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const token = await getToken(); // Your auth method
      
      const response = await fetch(
        'http://localhost:3000/analytics/stats',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Text>Loading...</Text>;
  if (!stats) return <Text>No data</Text>;

  return (
    <ScrollView>
      {/* Summary Cards */}
      <Card>
        <Text>Total Scans: {stats.totalScans}</Text>
        <Text>Completed: {stats.completedScans}</Text>
        <Text>Processing: {stats.processingScans}</Text>
      </Card>

      {/* Results */}
      <Card>
        <Text>Pneumonia Cases: {stats.pneumoniaCases}</Text>
        <Text>Normal Cases: {stats.normalCases}</Text>
        <Text>Avg Confidence: {(stats.averageConfidence * 100).toFixed(1)}%</Text>
      </Card>

      {/* Recent Scans */}
      <SectionList
        sections={[{ title: 'Recent Scans', data: stats.recentScans }]}
        renderItem={({ item }) => (
          <ScanItem
            patient={item.patient.name}
            result={item.result}
            confidence={item.confidence}
          />
        )}
      />
    </ScrollView>
  );
}
```

---

## Success Criteria

✅ All tests pass
✅ No errors in response
✅ Filtering works correctly
✅ Performance acceptable
✅ Ready for production

---

**Run all tests and you're ready to power your mobile dashboard!** 📱
