# 📬 Notifications Module - Complete Documentation

## Overview

The **Notifications Module** provides real-time notification management for the PneumoDetect backend. Users can receive, view, and manage notifications from various system events like scan completion.

---

## Architecture

### Data Model

```prisma
model Notification {
  id        String   @id @default(uuid())
  title     String              # Notification title
  message   String              # Detailed message
  type      NotificationType    # SCAN, SYSTEM, or USER
  read      Boolean  @default(false)  # Read status
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotificationType {
  SCAN      # Scan-related notifications
  SYSTEM    # System messages
  USER      # User-to-user messages
}
```

### Key Features

- ✅ User-specific notifications
- ✅ Read/unread status tracking
- ✅ Notification type classification (SCAN/SYSTEM/USER)
- ✅ Authorization checks (owner-only access)
- ✅ Batch operations (mark all as read)
- ✅ Automatic creation on events (scan completion)
- ✅ Newest-first ordering

---

## Module Structure

```
src/notifications/
├── dto/
│   ├── create-notification.dto.ts      # Input DTO for creating notifications
│   ├── update-notification.dto.ts      # Input DTO for updating read status
│   └── notification-response.dto.ts    # Output DTOs with metadata
├── notifications.service.ts             # Business logic layer
├── notifications.controller.ts          # API endpoints
└── notifications.module.ts              # Module definition
```

### File Descriptions

#### 1. DTOs (`/dto`)

**create-notification.dto.ts**
```typescript
class CreateNotificationDto {
  title: string           // 3-100 characters
  message: string         // 5-500 characters
  type: NotificationType  // SCAN, SYSTEM, or USER
  userId: string          // Target user ID
}
```

**update-notification.dto.ts**
```typescript
class UpdateNotificationDto {
  read: boolean          // Mark as read/unread
}
```

**notification-response.dto.ts**
```typescript
class NotificationResponseDto {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

class NotificationsListDto {
  data: NotificationResponseDto[]
  count: number           // Total notifications
  unreadCount: number     // Count of unread notifications
}
```

#### 2. Service (`notifications.service.ts`)

**Public Methods**

| Method | Purpose |
|--------|---------|
| `getNotifications(userId)` | Fetch all notifications for user |
| `getNotificationById(id, userId)` | Fetch single notification (auth check) |
| `markAsRead(id, userId, dto)` | Mark as read/unread (owner-only) |
| `createNotification(dto)` | Create notification (internal use) |
| `markAllAsRead(userId)` | Mark all as read (batch operation) |
| `deleteNotification(id, userId)` | Delete notification (owner-only) |

**Internal Methods** (called by other modules)

| Method | Purpose |
|--------|---------|
| `createScanCompletionNotification(doctorId, patientName, result)` | Auto-create when scan completes |
| `createSystemNotification(userId, title, message)` | Create system message |

**Key Implementation Details**

```typescript
// Role-based filtering (implicit - users only see their own)
const notifications = await this.prisma.notification.findMany({
  where: { userId },    // Always filtered by owner
  orderBy: { createdAt: 'desc' },
});

// Authorization check
if (notification.userId !== userId) {
  throw new ForbiddenException(...);
}

// Batch update
const result = await this.prisma.notification.updateMany({
  where: { userId, read: false },
  data: { read: true },
});
```

#### 3. Controller (`notifications.controller.ts`)

All endpoints protected with `@UseGuards(JwtAuthGuard)` and use `@CurrentUser()` decorator.

**Endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Get all notifications for current user |
| GET | `/notifications/:id` | Get single notification (owner-only) |
| PATCH | `/notifications/:id/read` | Mark as read/unread (owner-only) |
| POST | `/notifications` | Create notification (admin/system use) |
| POST | `/notifications/mark-all-read` | Mark all unread as read |
| DELETE | `/notifications/:id` | Delete notification (owner-only) |

#### 4. Module (`notifications.module.ts`)

```typescript
@Module({
  imports: [PrismaModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],  // For use by other modules
})
```

---

## API Endpoints

### 1. GET /notifications
**Fetch all notifications for current user**

```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "data": [
    {
      "id": "notif-uuid-1",
      "title": "Scan Completed",
      "message": "Scan result ready for John Doe: PNEUMONIA",
      "type": "SCAN",
      "read": false,
      "createdAt": "2026-04-16T10:30:00Z",
      "updatedAt": "2026-04-16T10:30:00Z",
      "userId": "doc-123"
    },
    {
      "id": "notif-uuid-2",
      "title": "System Update",
      "message": "The system was updated successfully",
      "type": "SYSTEM",
      "read": true,
      "createdAt": "2026-04-15T14:20:00Z",
      "updatedAt": "2026-04-15T14:20:00Z",
      "userId": "doc-123"
    }
  ],
  "count": 2,
  "unreadCount": 1
}
```

---

### 2. GET /notifications/:id
**Fetch single notification**

```bash
curl -X GET http://localhost:3000/notifications/notif-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "notif-uuid-1",
  "title": "Scan Completed",
  "message": "Scan result ready for John Doe: PNEUMONIA",
  "type": "SCAN",
  "read": false,
  "createdAt": "2026-04-16T10:30:00Z",
  "updatedAt": "2026-04-16T10:30:00Z",
  "userId": "doc-123"
}
```

**Error Cases:**
- `404 Not Found` - Notification doesn't exist
- `403 Forbidden` - Not the notification owner

---

### 3. PATCH /notifications/:id/read
**Mark notification as read or unread**

```bash
curl -X PATCH http://localhost:3000/notifications/notif-uuid-1/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

**Response:**
```json
{
  "id": "notif-uuid-1",
  "title": "Scan Completed",
  "message": "Scan result ready for John Doe: PNEUMONIA",
  "type": "SCAN",
  "read": true,  // Updated
  "createdAt": "2026-04-16T10:30:00Z",
  "updatedAt": "2026-04-16T10:30:02Z",  // Updated
  "userId": "doc-123"
}
```

---

### 4. POST /notifications/mark-all-read
**Mark all unread notifications as read**

```bash
curl -X POST http://localhost:3000/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "updatedCount": 3
}
```

---

### 5. POST /notifications
**Create notification (admin/system use)**

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "SYSTEM",
    "userId": "user-123"
  }'
```

**Response:**
```json
{
  "id": "notif-uuid-3",
  "title": "Test Notification",
  "message": "This is a test notification",
  "type": "SYSTEM",
  "read": false,
  "createdAt": "2026-04-16T10:35:00Z",
  "updatedAt": "2026-04-16T10:35:00Z",
  "userId": "user-123"
}
```

**Validation:**
- `title`: 3-100 characters required
- `message`: 5-500 characters required
- `type`: SCAN, SYSTEM, or USER
- `userId`: Must exist in database

---

### 6. DELETE /notifications/:id
**Delete notification permanently**

```bash
curl -X DELETE http://localhost:3000/notifications/notif-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Integration with Other Modules

### Scan Completion Notification

When a scan is successfully processed in `scans.service.ts`, a notification is automatically created:

```typescript
// In scans.service.ts - processScan method
const updatedScan = await this.prisma.scan.update({...});

// Create notification for the doctor
try {
  if (updatedScan.result) {
    await this.notificationsService.createScanCompletionNotification(
      scan.doctorId,                    // Doctor who created the scan
      updatedScan.patient.name,         // Patient name
      updatedScan.result,               // PNEUMONIA or NORMAL
    );
  }
} catch (error) {
  console.error('Failed to create notification:', error);
  // Don't throw - notification failure shouldn't fail scan processing
}
```

**Result:** Notification like "Scan Completed: Scan result ready for John Doe: PNEUMONIA"

---

## User Workflow

### Example: Doctor's Notification Flow

1. **Doctor uploads scan**
   ```bash
   POST /scans/upload → Scan created with UPLOADED status
   ```

2. **Doctor processes scan**
   ```bash
   POST /scans/{id}/process → Mock AI processes, creates NOTIFICATION
   ```

3. **Doctor receives notification**
   ```
   Mobile app polls GET /notifications
   Shows: "Scan Completed: John Doe - PNEUMONIA (0.95)"
   ```

4. **Doctor marks as read**
   ```bash
   PATCH /notifications/{id}/read {"read": true}
   ```

5. **Doctor views notification**
   ```bash
   GET /notifications/{id}
   Shows full notification details
   ```

---

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Input**
```json
{
  "message": "User with ID user-123 not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

**403 Forbidden - Unauthorized**
```json
{
  "message": "You do not have permission to access this notification",
  "error": "Forbidden",
  "statusCode": 403
}
```

**404 Not Found - Resource Missing**
```json
{
  "message": "Notification with ID notif-xyz not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Frontend Integration

### React Native Example

```typescript
// Fetch notifications on app load
useEffect(() => {
  const fetchNotifications = async () => {
    const response = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setNotifications(data.data);
    setUnreadCount(data.unreadCount);
  };
  
  fetchNotifications();
  // Poll every 10 seconds
  const interval = setInterval(fetchNotifications, 10000);
  return () => clearInterval(interval);
}, [token]);

// Mark as read when tapped
const handleNotificationTap = async (notificationId: string) => {
  await fetch(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ read: true })
  });
};

// Mark all as read
const handleMarkAllRead = async () => {
  await fetch('/notifications/mark-all-read', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

---

## Future Enhancements

### 1. Real-Time Notifications (WebSockets)
```typescript
// Socket.IO integration
@WebSocketGateway()
export class NotificationsGateway {
  @SubscribeMessage('notifications')
  handleNotification(client: Socket, @MessageBody() data: any) {
    client.emit('notification', data);
  }
}
```

### 2. Push Notifications (Firebase Cloud Messaging)
```typescript
// Send push to mobile app
await admin.messaging().send({
  token: fcmToken,
  notification: {
    title: 'Scan Completed',
    body: 'Your scan result is ready'
  }
});
```

### 3. Email Notifications
```typescript
// Send via email service
await emailService.send({
  to: user.email,
  subject: notification.title,
  body: notification.message
});
```

### 4. Notification Preferences
```prisma
model NotificationPreference {
  userId String
  emailNotifications Boolean @default(true)
  pushNotifications Boolean @default(true)
  smsNotifications Boolean @default(false)
}
```

### 5. Notification History & Archive
- Add `deletedAt` for soft deletes
- Add `archivedAt` for archiving
- Add `expiresAt` for auto-deletion

---

## Database Queries

### View User's Notifications (PostgreSQL)
```sql
SELECT * FROM "Notification"
WHERE "userId" = 'user-123'
ORDER BY "createdAt" DESC;
```

### Count Unread Notifications
```sql
SELECT COUNT(*) FROM "Notification"
WHERE "userId" = 'user-123' AND "read" = false;
```

### Get Notifications by Type
```sql
SELECT * FROM "Notification"
WHERE "userId" = 'user-123' AND "type" = 'SCAN'
ORDER BY "createdAt" DESC;
```

### Mark All as Read
```sql
UPDATE "Notification"
SET "read" = true, "updatedAt" = NOW()
WHERE "userId" = 'user-123' AND "read" = false;
```

---

## Performance Considerations

### Indexing
Recommended database indexes:
```sql
CREATE INDEX idx_notification_user_id ON "Notification"("userId");
CREATE INDEX idx_notification_created_at ON "Notification"("createdAt");
CREATE INDEX idx_notification_user_read ON "Notification"("userId", "read");
```

### Pagination (Future)
```typescript
async getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  const notifications = await this.prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });
  // Return with total count for pagination
}
```

---

## Testing Checklist

- [ ] GET /notifications returns all user's notifications
- [ ] GET /notifications/:id returns single notification (owner-only)
- [ ] PATCH /notifications/:id/read updates read status
- [ ] POST /notifications/mark-all-read marks all as read
- [ ] POST /notifications creates notification
- [ ] DELETE /notifications/:id deletes notification
- [ ] Unauthorized users get 403 error
- [ ] Non-existent notifications return 404
- [ ] Scan completion creates notification automatically
- [ ] Notifications ordered by newest first
- [ ] Unread count is accurate

---

## Summary

The **Notifications Module** provides:

✅ Complete notification lifecycle management
✅ Real-time notification creation on events
✅ User-specific, private notifications
✅ Read/unread status tracking
✅ Type-based organization (SCAN/SYSTEM/USER)
✅ Authorization checks (owner-only)
✅ Batch operations (mark all as read)
✅ Ready for real-time upgrades (WebSockets, push)
✅ Clean, maintainable code structure
✅ Production-ready error handling
