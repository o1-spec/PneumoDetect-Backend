# 🏗️ Notifications Module - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Notification Screen:                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Unread: 2                                            │  │
│  │ • Scan Completed (PNEUMONIA)              [Mark Read]│  │
│  │ • Welcome to PneumoDetect                  [Delete]  │  │
│  │ • System Update (read)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  Polling: GET /notifications every 10s                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             ↕
        HTTP (REST API with JWT Authentication)
                             ↕
┌─────────────────────────────────────────────────────────────┐
│              NestJS Backend (PneumoDetect)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NotificationsController                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ GET /notifications                              │  │  │
│  │  │ GET /notifications/:id                          │  │  │
│  │  │ PATCH /notifications/:id/read                   │  │  │
│  │  │ POST /notifications                             │  │  │
│  │  │ POST /notifications/mark-all-read               │  │  │
│  │  │ DELETE /notifications/:id                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │              (with @UseGuards(JwtAuthGuard))         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NotificationsService                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ getNotifications(userId)                        │  │  │
│  │  │ getNotificationById(id, userId)                 │  │  │
│  │  │ markAsRead(id, userId, dto)                     │  │  │
│  │  │ createNotification(dto)                         │  │  │
│  │  │ createScanCompletionNotification(...)  ← Scans  │  │  │
│  │  │ markAllAsRead(userId)                           │  │  │
│  │  │ deleteNotification(id, userId)                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            PrismaService                             │  │
│  │  (Database ORM & Query Builder)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│          PostgreSQL Database                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Notification Table                                 │  │
│  │  ┌────────────┬──────────────┬─────────────────────┐│  │
│  │  │ id (UUID)  │ title        │ message             ││  │
│  │  ├────────────┼──────────────┼─────────────────────┤│  │
│  │  │ notif-123  │ Scan Cmplted │ Scan result ready..││  │
│  │  │ notif-124  │ System Upd   │ Backend updated..  ││  │
│  │  │ notif-125  │ Welcome      │ Account created..  ││  │
│  │  └────────────┴──────────────┴─────────────────────┘│  │
│  │  ┌─────────┬──────────┬─────────┬──────────────┐    │  │
│  │  │ type    │ read     │ userId  │ createdAt    │    │  │
│  │  ├─────────┼──────────┼─────────┼──────────────┤    │  │
│  │  │ SCAN    │ false    │ doc-123 │ 2026-04-16   │    │  │
│  │  │ SYSTEM  │ true     │ doc-123 │ 2026-04-15   │    │  │
│  │  │ SYSTEM  │ false    │ doc-123 │ 2026-04-16   │    │  │
│  │  └─────────┴──────────┴─────────┴──────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Indexes:                                                  │
│  • idx_notification_user_id (userId)                      │
│  • idx_notification_created_at (createdAt DESC)           │
│  • idx_notification_user_read (userId, read)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Scan → Notification Flow

```
┌────────────────────────────────────────────────────────────┐
│  Mobile App - Doctor                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Doctor uploads scan                                      │
│  (Select patient, attach X-ray image)                     │
│                           │                               │
│                           ↓                               │
└────────────────────────────────────────────────────────────┘
                          HTTP
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  POST /scans/upload                                        │
│  (Backend receives file)                                  │
├────────────────────────────────────────────────────────────┤
│  ScansController                                          │
│  ScansService.createScan()                                │
│  ✓ Validate patient exists                                │
│  ✓ Save file to disk/cloud                                │
│  ✓ Create Scan record: status = UPLOADED                 │
│  ✓ Return scan ID to app                                  │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  Mobile App - Doctor                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Doctor taps "Process Scan"                               │
│                           │                               │
│                           ↓                               │
└────────────────────────────────────────────────────────────┘
                          HTTP
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  POST /scans/:id/process                                   │
│  (Backend analyzes X-ray)                                 │
├────────────────────────────────────────────────────────────┤
│  ScansController                                          │
│  ScansService.processScan()                               │
│  ✓ Load scan from database                                │
│  ✓ Check authorization                                    │
│  ✓ Run mock AI (generates result + confidence)            │
│  ✓ Update scan record:                                    │
│    - status = COMPLETED                                   │
│    - result = PNEUMONIA                                   │
│    - confidence = 0.95                                    │
│                                                            │
│  ✓✓✓ NEW: Create Notification ✓✓✓                        │
│    if (updatedScan.result) {                              │
│      await notificationsService                           │
│        .createScanCompletionNotification(                 │
│          doctorId,                                        │
│          patientName,                                     │
│          result                                           │
│        );                                                 │
│    }                                                       │
│                                                            │
│  ✓ Return updated scan to app                             │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  NotificationsService                                      │
│  createScanCompletionNotification()                        │
├────────────────────────────────────────────────────────────┤
│  ✓ Build notification:                                    │
│    {                                                      │
│      title: "Scan Completed",                             │
│      message: "Scan result ready for John: PNEUMONIA",    │
│      type: "SCAN",                                        │
│      userId: "doctor-uuid-123",                           │
│      read: false                                          │
│    }                                                      │
│                                                            │
│  ✓ Call createNotification(dto)                           │
│  ✓ Save to database                                       │
│  ✓ Return created notification                            │
│                                                            │
│  (If error, log it but DON'T fail the scan)               │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  PostgreSQL - Notification Saved                           │
│                                                            │
│  INSERT INTO "Notification" (...)                         │
│  VALUES (                                                 │
│    'notif-uuid-xxx',                                      │
│    'Scan Completed',                                      │
│    'Scan result ready for John: PNEUMONIA',               │
│    'SCAN',                                                │
│    false,  ← read=false (unread initially)                │
│    'doctor-uuid-123',                                     │
│    NOW()                                                  │
│  );                                                       │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  Mobile App - Later                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Doctor opens app (or pulls to refresh)                   │
│                           │                               │
│                           ↓                               │
└────────────────────────────────────────────────────────────┘
                          HTTP
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  GET /notifications                                        │
│  (Fetch all doctor's notifications)                       │
├────────────────────────────────────────────────────────────┤
│  NotificationsController                                  │
│  NotificationsService.getNotifications(userId)            │
│  ✓ Filter by userId (only doctor's notifications)         │
│  ✓ Order by createdAt DESC (newest first)                 │
│  ✓ Count total + unread                                   │
│  ✓ Return response                                        │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  HTTP Response                                             │
├────────────────────────────────────────────────────────────┤
│  {                                                         │
│    "data": [                                              │
│      {                                                    │
│        "id": "notif-uuid-xxx",                            │
│        "title": "Scan Completed",                         │
│        "message": "Scan result ready for John: PNEUMONIA",│
│        "type": "SCAN",                                    │
│        "read": false,                                     │
│        "createdAt": "2026-04-16T10:30:00Z",               │
│        "userId": "doctor-uuid-123"                        │
│      }                                                    │
│    ],                                                     │
│    "count": 1,                                            │
│    "unreadCount": 1                                       │
│  }                                                        │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  Mobile App - Notification Screen                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Shows notification:                                   │
│  ┌──────────────────────────────────────┐                │
│  │ Scan Completed                       │                │
│  │ Scan result ready for John: PNEUMONIA│                │
│  │                                      │                │
│  │ [Mark as Read]  [Delete]  [Share]    │                │
│  └──────────────────────────────────────┘                │
│                                                            │
│  Doctor taps "Mark as Read"                               │
│                           │                               │
│                           ↓                               │
└────────────────────────────────────────────────────────────┘
                          HTTP
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  PATCH /notifications/:id/read                             │
│  Body: { "read": true }                                   │
├────────────────────────────────────────────────────────────┤
│  NotificationsController                                  │
│  NotificationsService.markAsRead()                        │
│  ✓ Check notification exists                              │
│  ✓ Verify doctor owns notification                        │
│  ✓ Update read = true                                     │
│  ✓ Return updated notification                            │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  PostgreSQL - Notification Updated                        │
│                                                            │
│  UPDATE "Notification"                                    │
│  SET "read" = true, "updatedAt" = NOW()                   │
│  WHERE "id" = 'notif-uuid-xxx';                           │
└────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────┐
│  Mobile App - Notification Marked as Read                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Notification appears as read (grayed out)             │
│  Badge count: 0 (no unread)                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Authorization & Security Flow

```
┌─────────────────────────────────────┐
│  Mobile App - Doctor                │
│  (with JWT token)                   │
└─────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  HTTP Request:                      │
│  GET /notifications/:id             │
│  Header: Authorization: Bearer XXX  │
└─────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend - NotificationsController  │                      │
│  @UseGuards(JwtAuthGuard)          │                      │
└─────────────────────────────────────────────────────────────┘
              │
              ↓ ✓ JWT valid?
         NO ─┼─ YES
        /    │
       ↓     ↓
   401    Decode JWT
  Unauth   Extract userId
           │
           ↓
  ┌──────────────────────────────────────┐
  │ @CurrentUser() decorator             │
  │ user = { id: "doctor-123", ... }    │
  └──────────────────────────────────────┘
           │
           ↓
  ┌──────────────────────────────────────┐
  │ Service.getNotificationById(id, uid) │
  │                                      │
  │ 1. Find notification by id           │
  │    ↓ NOT FOUND?                      │
  │    ↓ YES → 404 Not Found             │
  │    ↓ NO → Continue                   │
  │                                      │
  │ 2. Check notification.userId === uid │
  │    ↓ NOT OWNER?                      │
  │    ↓ YES → 403 Forbidden             │
  │    ↓ NO → Continue                   │
  │                                      │
  │ 3. Return notification               │
  │    ✓ 200 OK                          │
  └──────────────────────────────────────┘
```

---

## Database Relationships

```
┌──────────────────┐
│   User           │
├──────────────────┤
│ id (PK)          │
│ email            │
│ name             │
│ role             │
└────────┬─────────┘
         │
         │ 1:N
         │ (user can have many notifications)
         │
         ↓
┌────────────────────────────┐
│   Notification             │
├────────────────────────────┤
│ id (PK)                    │
│ title                      │
│ message                    │
│ type                       │
│ read                       │
│ createdAt                  │
│ updatedAt                  │
│ userId (FK) ───────────────┼───→ User.id
└────────────────────────────┘

Foreign Key: Notification.userId → User.id
Cascade: ON DELETE CASCADE
  (If user deleted, all notifications deleted)
```

---

## Response Status Codes

```
┌────────────────────────────────────────────────────────────┐
│  SUCCESS RESPONSES                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  200 OK                                                    │
│  ├─ GET /notifications                                    │
│  ├─ GET /notifications/:id                                │
│  ├─ PATCH /notifications/:id/read                         │
│  ├─ POST /notifications/mark-all-read                     │
│  └─ DELETE /notifications/:id                             │
│                                                            │
│  201 CREATED                                               │
│  └─ POST /notifications                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ERROR RESPONSES                                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  400 BAD REQUEST                                           │
│  ├─ Invalid input (title too short, etc)                  │
│  └─ User not found                                         │
│                                                            │
│  401 UNAUTHORIZED                                          │
│  └─ No JWT token or invalid token                         │
│                                                            │
│  403 FORBIDDEN                                             │
│  ├─ Not owner of notification (GET)                       │
│  ├─ Not owner of notification (PATCH)                     │
│  └─ Not owner of notification (DELETE)                    │
│                                                            │
│  404 NOT FOUND                                             │
│  ├─ Notification doesn't exist                            │
│  ├─ Notification not found (PATCH)                        │
│  └─ Notification not found (DELETE)                       │
│                                                            │
│  500 INTERNAL SERVER ERROR                                 │
│  └─ Unexpected error (rare)                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Request/Response Lifecycle

```
┌───────────────────────────────────────────────────────────┐
│  REQUEST: GET /notifications                              │
│  Header: Authorization: Bearer JWT_TOKEN                  │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  Middleware Chain:                                        │
│  1. Global exception filter                              │
│  2. JWT validation middleware                            │
│  3. Token parsing                                        │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  NotificationsController                                  │
│  getNotifications(@CurrentUser() user)                    │
│  • Receive userId from @CurrentUser()                    │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  NotificationsService                                     │
│  getNotifications(userId)                                │
│                                                          │
│  const notifications = await this.prisma                 │
│    .notification.findMany({                              │
│      where: { userId },        ← Filter by user         │
│      orderBy: { createdAt: 'desc' }  ← Newest first     │
│    });                                                   │
│                                                          │
│  return new NotificationsListDto(notifications);         │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  PrismaService                                            │
│  Database Query:                                         │
│  SELECT * FROM "Notification"                            │
│  WHERE "userId" = $1                                     │
│  ORDER BY "createdAt" DESC                               │
│                                                          │
│  (Uses index: idx_notification_user_id)                  │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  PostgreSQL Returns:                                      │
│  [                                                       │
│    { id: notif-1, title: "...", read: false, ... },     │
│    { id: notif-2, title: "...", read: true, ... },      │
│    ...                                                   │
│  ]                                                       │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  NotificationsService                                     │
│  DTO Transformation:                                     │
│  return new NotificationsListDto(notifications)          │
│  • Map each notification → NotificationResponseDto      │
│  • Count total notifications                             │
│  • Count unread notifications                            │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  RESPONSE JSON:                                           │
│  {                                                       │
│    "data": [                                             │
│      {                                                   │
│        "id": "notif-1",                                  │
│        "title": "Scan Completed",                        │
│        "message": "...",                                 │
│        "type": "SCAN",                                   │
│        "read": false,                                    │
│        "createdAt": "2026-04-16T10:30:00Z",             │
│        "userId": "doctor-123"                            │
│      },                                                  │
│      ...                                                 │
│    ],                                                    │
│    "count": 5,                                           │
│    "unreadCount": 2                                      │
│  }                                                       │
│  Status: 200 OK                                          │
│  Headers: Content-Type: application/json                 │
└───────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────┐
│  Mobile App Receives Response                             │
│  └→ Update Notification UI                              │
│  └→ Show 2 unread notifications                          │
│  └→ Display notification list                            │
└───────────────────────────────────────────────────────────┘
```

---

## Dependency Injection

```
┌────────────────────────────┐
│  NotificationsModule       │
├────────────────────────────┤
│ imports: [PrismaModule]    │
│ providers: [              │
│   NotificationsService    │
│ ]                         │
│ controllers: [            │
│   NotificationsController │
│ ]                         │
│ exports: [                │
│   NotificationsService    │
│ ]                         │
└────────────────────────────┘
         │
         ├─→ PrismaModule provides PrismaService
         │
         ├─→ NotificationsService injects PrismaService
         │   @Injectable()
         │   constructor(private prisma: PrismaService) {}
         │
         └─→ NotificationsController injects NotificationsService
             @Controller('notifications')
             constructor(
               private notificationsService: NotificationsService
             ) {}

┌────────────────────────────────────────────────┐
│  ScansModule (Circular Dependency)             │
├────────────────────────────────────────────────┤
│ imports: [PrismaModule, forwardRef(() =>       │
│   NotificationsModule)]                        │
│                                                │
│ ScansService injects NotificationsService:     │
│ @Injectable()                                  │
│ constructor(                                  │
│   private prisma: PrismaService,              │
│   @Inject(forwardRef(() =>                    │
│     NotificationsService))                    │
│   private notificationsService:               │
│     NotificationsService                      │
│ ) {}                                           │
└────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────┐
│  Request to: GET /notifications │
│             /:id                │
└─────────────────────────────────┘
          ↓
    ┌─────────────┐
    │ JWT Valid?  │
    └──┬────┬─────┘
      NO  YES
      │    │
      ↓    ↓
    401  Continue
          │
          ↓
    ┌───────────────────┐
    │ Notification      │
    │ exists?           │
    └──┬────┬───────────┘
      NO  YES
      │    │
      ↓    ↓
    404  Continue
          │
          ↓
    ┌───────────────────┐
    │ User owns         │
    │ notification?     │
    └──┬────┬───────────┘
      NO  YES
      │    │
      ↓    ↓
    403  Return 200
         Notification
         Data

Status Codes:
├─ 200 OK - Success
├─ 400 Bad Request - Invalid input
├─ 401 Unauthorized - No/invalid JWT
├─ 403 Forbidden - Not owner
├─ 404 Not Found - Notification not found
└─ 500 Error - Server error
```

---

## Summary

This architecture provides:

✅ Clean separation of concerns (Controller → Service → Database)
✅ Type safety with TypeScript and DTOs
✅ JWT authentication on all endpoints
✅ Authorization checks (owner-only access)
✅ Automatic notification creation on events
✅ Efficient database queries with indexes
✅ Error handling with appropriate HTTP status codes
✅ Real-time capable (ready for WebSocket upgrade)
✅ Production-ready code quality
