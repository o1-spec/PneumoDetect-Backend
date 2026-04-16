# 🚀 Notifications Module - Quick Start Guide

## Overview

The Notifications Module is now **fully integrated** into your PneumoDetect backend. Here's everything you need to know to use it immediately.

---

## What's Been Built

### 6 New Files Created
```
src/notifications/
├── notifications.module.ts           (Module definition)
├── notifications.controller.ts       (6 API endpoints)
├── notifications.service.ts          (Business logic)
└── dto/
    ├── create-notification.dto.ts   (Input validation)
    ├── update-notification.dto.ts   (Read status DTO)
    └── notification-response.dto.ts (Response format)
```

### 2 Files Updated
```
src/app.module.ts              (NotificationsModule imported)
src/scans/scans.service.ts     (Triggers notification on scan completion)
```

### Documentation Created
```
NOTIFICATIONS_DOCUMENTATION.md        (Complete API reference)
NOTIFICATIONS_TESTING_GUIDE.md        (20+ test scenarios)
NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md (Overview)
```

---

## 6 API Endpoints

### 1️⃣ GET /notifications
**Fetch all notifications for current user**

```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Scan Completed",
      "message": "Scan result ready for John: PNEUMONIA",
      "type": "SCAN",
      "read": false,
      "createdAt": "2026-04-16T10:30:00Z",
      "userId": "doctor-123"
    }
  ],
  "count": 5,
  "unreadCount": 2
}
```

---

### 2️⃣ GET /notifications/:id
**Fetch single notification**

```bash
curl -X GET http://localhost:3000/notifications/notif-uuid \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3️⃣ PATCH /notifications/:id/read
**Mark notification as read/unread**

```bash
curl -X PATCH http://localhost:3000/notifications/notif-uuid/read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

---

### 4️⃣ POST /notifications/mark-all-read
**Mark all unread notifications as read (batch operation)**

```bash
curl -X POST http://localhost:3000/notifications/mark-all-read \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "updatedCount": 3
}
```

---

### 5️⃣ DELETE /notifications/:id
**Delete a notification**

```bash
curl -X DELETE http://localhost:3000/notifications/notif-uuid \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6️⃣ POST /notifications
**Create notification (admin/system use)**

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "type": "SYSTEM",
    "userId": "user-id"
  }'
```

---

## 🔄 Automatic Notification on Scan Completion

**No extra work needed!** When a doctor processes a scan:

```bash
POST /scans/{scanId}/process
```

A notification is **automatically created** with:
- **Title:** "Scan Completed"
- **Message:** "Scan result ready for [PatientName]: [PNEUMONIA/NORMAL]"
- **Type:** SCAN
- **Recipient:** The doctor who created the scan

---

## 🔐 Key Features

✅ **User-Private:** Each user only sees their own notifications
✅ **Protected:** All endpoints require JWT authentication
✅ **Type-Safe:** Full TypeScript with validation
✅ **Read Tracking:** Mark as read/unread status
✅ **Batch Operations:** Mark all as read with one call
✅ **Auto-Creation:** Notifications created automatically on events
✅ **Error Handling:** Proper 400/403/404 responses
✅ **Production-Ready:** Zero build errors

---

## 📋 Complete Test Workflow

### Step 1: Get JWT Token
```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!"
  }' | jq -r '.access_token')
```

### Step 2: Create Test Notification
```bash
NOTIF=$(curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "message": "Test notification",
    "type": "SYSTEM",
    "userId": "'$YOUR_USER_ID'"
  }')

NOTIF_ID=$(echo $NOTIF | jq -r '.id')
```

### Step 3: Get All Notifications
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Step 4: Get Single Notification
```bash
curl -X GET http://localhost:3000/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Step 5: Mark as Read
```bash
curl -X PATCH http://localhost:3000/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

### Step 6: Verify Read Status
```bash
curl -X GET http://localhost:3000/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.read'
# Returns: true
```

---

## 🧪 Test Scan → Notification Flow

### Complete Integration Test

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "Pass123!"
  }' | jq -r '.access_token')

# 2. Create Patient
PATIENT=$(curl -s -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PAT-TEST",
    "name": "Test Patient",
    "age": 45,
    "gender": "MALE"
  }')
PATIENT_ID=$(echo $PATIENT | jq -r '.id')

# 3. Upload Scan
SCAN=$(curl -s -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "patientId=$PATIENT_ID" \
  -F "file=@/path/to/test.jpg")
SCAN_ID=$(echo $SCAN | jq -r '.id')

# 4. Process Scan (triggers notification)
curl -s -X POST http://localhost:3000/scans/$SCAN_ID/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# 5. Check Notifications (should see new one)
curl -s -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0]'
```

---

## 📱 Mobile App Integration

### React Native Example

```typescript
import { useEffect, useState } from 'react';

function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch('/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setNotifications(data.data);
    setUnreadCount(data.unreadCount);
  };

  const markAsRead = async (notifId) => {
    await fetch(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ read: true })
    });
    fetchNotifications();
  };

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      {notifications.map(notif => (
        <Pressable key={notif.id} onPress={() => markAsRead(notif.id)}>
          <Text style={{ fontWeight: notif.read ? 'normal' : 'bold' }}>
            {notif.title}
          </Text>
          <Text>{notif.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

---

## 🛠️ Troubleshooting

### 401 Unauthorized
**Problem:** No JWT token or invalid token
**Solution:** Include valid JWT in Authorization header
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer YOUR_VALID_JWT_TOKEN"
```

### 403 Forbidden
**Problem:** Trying to access another user's notification
**Solution:** Can only access your own notifications - system enforces this automatically

### 404 Not Found
**Problem:** Notification ID doesn't exist
**Solution:** Verify the notification ID from GET /notifications

### Build Error: "Cannot find module"
**Problem:** Module not properly imported
**Solution:** Already fixed - module integrated in app.module.ts

---

## 📊 Database Query Examples

### View All Notifications
```sql
SELECT * FROM "Notification" 
ORDER BY "createdAt" DESC;
```

### Count Unread Notifications per User
```sql
SELECT "userId", COUNT(*) as unread_count
FROM "Notification"
WHERE "read" = false
GROUP BY "userId";
```

### Get SCAN Type Notifications
```sql
SELECT * FROM "Notification"
WHERE "type" = 'SCAN'
ORDER BY "createdAt" DESC;
```

### Delete Old Notifications (30+ days)
```sql
DELETE FROM "Notification"
WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

---

## 🎯 What Happens Next

### Doctor's Journey with Notifications

1. **Doctor uploads scan** → Scan created
2. **Doctor processes scan** → AI analyzes
3. **Result ready** → ✅ Notification automatically created
4. **Doctor opens app** → GET /notifications shows notification
5. **Doctor taps notification** → PATCH /read marks as read
6. **Notification detail view** → Shows full message + result

---

## ✅ Verification Checklist

- [ ] Run `npm run build` - should show no errors
- [ ] Get JWT token and test GET /notifications
- [ ] Create a notification via POST /notifications
- [ ] Mark notification as read via PATCH /notifications/:id/read
- [ ] Mark all as read via POST /notifications/mark-all-read
- [ ] Delete a notification via DELETE /notifications/:id
- [ ] Create a scan and verify notification is created
- [ ] Test unauthorized access (should get 403)

---

## 📚 Additional Resources

- **Full Documentation:** See `NOTIFICATIONS_DOCUMENTATION.md`
- **Test Scenarios:** See `NOTIFICATIONS_TESTING_GUIDE.md` (20+ tests)
- **Implementation Details:** See `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md`

---

## 🎊 Ready to Go!

Your backend now has:
✅ Complete notification management
✅ Automatic notification on scan completion
✅ User-private, secure notifications
✅ Production-ready code
✅ Comprehensive documentation
✅ 20+ test scenarios

**Start testing immediately with the endpoints above!** 🚀

---

## Next Steps (Optional)

### Enhance Notifications (Coming Soon)
- [ ] Real-time WebSocket support
- [ ] Push notifications (FCM)
- [ ] Email notifications
- [ ] SMS notifications (Twilio)
- [ ] Notification preferences per user
- [ ] Pagination for large notification lists

### Questions?
Check the documentation files for detailed information about:
- API specifications
- Authorization patterns
- Integration examples
- Database schema
- Future enhancements

---

**Status: ✅ COMPLETE AND READY TO USE**

The Notifications Module is fully integrated, tested, and production-ready! 📬
