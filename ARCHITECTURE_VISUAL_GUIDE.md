# PneumoDetect Backend Architecture - Visual Reference

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Mobile App)                           │
│  - Register                                                              │
│  - Login                                                                 │
│  - View Profile                                                          │
│  - Manage Account                                                        │
│  - (Admin Dashboard)                                                     │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          │ HTTP Requests
                          │
        ┌─────────────────▼─────────────────┐
        │   NestJS Application               │
        │   Port 3000                        │
        └─────────────────┬───────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────────────┐
        │               Express Router                           │
        │  Matches paths: /auth, /users, /admin                │
        └─────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────────────────────────────┐
        │           🔐 GUARD LAYER (Authentication)                  │
        │  • JwtAuthGuard: Validates JWT from Authorization header   │
        │  • RolesGuard: Checks @Roles() metadata                    │
        │  • Attaches user object to request                         │
        └─────────────────┬──────────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────────────────────────────┐
        │          CONTROLLER LAYER (Routes)                         │
        │                                                            │
        │  AuthController          UsersController  AdminController │
        │  ├─ POST /register       ├─ GET /me      ├─ GET /users   │
        │  ├─ POST /login          └─ PATCH /...   ├─ GET /:id     │
        │  └─ GET /me                              ├─ PATCH /:...  │
        │                                          └─ DELETE /:id  │
        └─────────────────┬──────────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────────────────────────────┐
        │         SERVICE LAYER (Business Logic)                    │
        │                                                            │
        │  AuthService             UsersService   AdminService      │
        │  ├─ register()           ├─ getProfile() ├─ getAllUsers()│
        │  ├─ login()              └─ updateProfile() ├─ update...()
        │  ├─ getProfile()                         └─ deleteUser() │
        │  ├─ hashPassword()                                        │
        │  ├─ verifyPassword()                                      │
        │  └─ generateToken()                                       │
        └─────────────────┬──────────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────────────────────────────┐
        │      PERSISTENCE LAYER (Database)                         │
        │                                                            │
        │         PrismaService (PrismaClient)                      │
        │         • Connects to PostgreSQL                          │
        │         • Manages transactions                            │
        │         • Type-safe queries                               │
        └─────────────────┬──────────────────────────────────────────┘
                          │
                          │ TCP Connection
                          │
        ┌─────────────────▼──────────────────────────────────────────┐
        │          PostgreSQL Database                              │
        │          Port 5434 (Docker Container)                     │
        │                                                            │
        │  Tables:                                                   │
        │  - users (id, email, password, name, role, ...)           │
        │  - patients (id, idNumber, name, age, gender, ...)        │
        │  - scans (id, imageUrl, status, result, doctorId, ...)    │
        │  - notifications (id, title, message, type, userId, ...) │
        └────────────────────────────────────────────────────────────┘
```

## 🔐 Request Lifecycle for Admin Endpoint

```
CLIENT: PATCH /admin/users/123/status
        Headers: { Authorization: Bearer <jwt> }
        Body: { isActive: false }
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│ 1. NestJS Router matches route                            │
│    Pattern: /admin/users/:id/status                       │
│    Method: PATCH                                          │
│    Metadata: @UseGuards(...), @Roles(ADMIN)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────▼────────┐
            │ JwtAuthGuard     │
            │ (Guard 1)        │
            └─────────┬────────┘
                      │
    ┌─────────────────▼────────────────────┐
    │ 1. Extract from Authorization        │
    │    "Authorization: Bearer xyz"       │
    │    → Extract "xyz"                   │
    │                                      │
    │ 2. Send to JwtStrategy               │
    │    • Verify signature: HMAC-SHA256   │
    │    • Decode payload                  │
    │    • payload = {                     │
    │        sub: "user-123",              │
    │        email: "admin@...",           │
    │        role: "ADMIN"                 │
    │      }                               │
    │                                      │
    │ 3. Query database                    │
    │    SELECT * FROM users               │
    │    WHERE id = "user-123"             │
    │    → Found user, isActive = true     │
    │                                      │
    │ 4. Build request.user                │
    │    {                                 │
    │      id: "user-123",                 │
    │      email: "admin@...",             │
    │      role: "ADMIN",                  │
    │      name: "Admin User"              │
    │    }                                 │
    │    Note: password NOT included       │
    │                                      │
    │ 5. Return user (allow next guard)    │
    └─────────────────┬────────────────────┘
                      │
            ┌─────────▼────────────┐
            │ RolesGuard           │
            │ (Guard 2)            │
            └─────────┬────────────┘
                      │
    ┌─────────────────▼──────────────────────┐
    │ 1. Get metadata from @Roles()          │
    │    requiredRoles = [Role.ADMIN]        │
    │                                        │
    │ 2. Check if @Roles() exists            │
    │    Yes → continue                      │
    │    No → allow (public route)           │
    │                                        │
    │ 3. Get user from request.user          │
    │    user = {                            │
    │      id: "user-123",                   │
    │      role: "ADMIN"                     │
    │    }                                   │
    │                                        │
    │ 4. Verify user exists                  │
    │    user != null → true                 │
    │                                        │
    │ 5. Check role                          │
    │    user.role = "ADMIN"                 │
    │    requiredRoles = [ADMIN]             │
    │    "ADMIN" in [ADMIN]? YES             │
    │                                        │
    │ 6. Return true (allow)                 │
    └─────────────────┬──────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │ AdminController.            │
        │ updateUserStatus()          │
        └─────────────┬────────────────┘
                      │
    ┌─────────────────▼──────────────────────┐
    │ Handler receives parameters:           │
    │ • @Param('id') userId = "123"          │
    │ • @Body() dto = { isActive: false }    │
    │ • request.user injected via            │
    │   @CurrentUser() decorator             │
    │                                        │
    │ Call: this.adminService.               │
    │       updateUserStatus(userId, dto)    │
    └─────────────────┬──────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │ AdminService               │
        └─────────────┬────────────────┘
                      │
    ┌─────────────────▼──────────────────────┐
    │ 1. Verify user exists                  │
    │    SELECT * FROM users WHERE id = 123  │
    │    → Found                             │
    │                                        │
    │ 2. Update user status                  │
    │    UPDATE users                        │
    │    SET isActive = false                │
    │    WHERE id = 123                      │
    │                                        │
    │ 3. Fetch updated user (safe fields)    │
    │    SELECT id, email, name, role,       │
    │           isActive, ...                │
    │    FROM users WHERE id = 123           │
    │    (Note: password NOT selected)       │
    │                                        │
    │ 4. Transform to DTO                    │
    │    new UserResponseDto(user)           │
    │    (password excluded by @Exclude())   │
    │                                        │
    │ 5. Return response                     │
    └─────────────────┬──────────────────────┘
                      │
            ┌─────────▼─────────┐
            │ Response Sent     │
            │                   │
            │ HTTP 200 OK       │
            │ {                 │
            │   "id": "123",    │
            │   "email": "...", │
            │   "name": "...",  │
            │   "isActive":     │
            │     false,        │
            │   ...             │
            │ }                 │
            │                   │
            │ ✅ No password!   │
            └──────────────────┘
```

## 📊 Data Flow Summary

```
REQUEST FLOW
│
├─ Guards (2)
│  ├─ JwtAuthGuard
│  │  └─ Validates + Attaches user to request
│  └─ RolesGuard
│     └─ Checks if user.role allowed
│
├─ Controller (Route Handler)
│  └─ Parses params, body, queries
│     Injects decorated parameters
│     Calls service method
│
├─ Service (Business Logic)
│  └─ Validates data
│     Executes business rules
│     Calls Prisma
│
├─ Prisma (Database Access)
│  └─ Builds SQL query
│     Executes on PostgreSQL
│     Returns typed results
│
└─ Response
   └─ Format DTO (exclude password)
      Send JSON to client
```

## 🔄 User Object Journey

```
JWT Token Creation (Login)
│
├─ User enters email + password
├─ Service validates credentials
├─ Service generates JWT
│  └─ JwtService.sign({ sub, email, role })
│     Payload encoded + signed with JWT_SECRET
│     Result: eyJhbGc.eyJzdWI.SflKxw...
│
└─ Returns to client

Subsequent Requests
│
├─ Client sends: Authorization: Bearer eyJhbGc...
├─ JwtAuthGuard extracts token
├─ JwtStrategy validates signature
├─ JwtStrategy decodes payload
│  └─ { sub: "user-id", email, role }
├─ JwtStrategy queries database
│  └─ SELECT ... FROM users WHERE id = "user-id"
│  └─ Verify: user exists AND isActive = true
├─ Build user object
│  └─ { id, email, role, name } ← NO PASSWORD
├─ Attach to request.user
│  └─ request.user = { id, email, role, name }
│
└─ Available in controller via @CurrentUser()
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────┐
│           LAYER 1: Authentication                   │
│  • JWT token validation                             │
│  • Token signature verification                     │
│  • Token expiration check                           │
│  • User active status check                         │
│  → Result: User object attached to request          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│           LAYER 2: Authorization (RBAC)             │
│  • @Roles() decorator metadata check                │
│  • user.role compared with required roles           │
│  • 403 Forbidden if no match                        │
│  → Result: Only authorized users proceed            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│         LAYER 3: Input Validation                   │
│  • DTOs with class-validator decorators             │
│  • Type checking                                    │
│  • Length, format, pattern validation               │
│  → Result: Only valid data processed                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│        LAYER 4: Data Protection                     │
│  • Password hashed with bcrypt                      │
│  • Prisma .select() excludes sensitive fields       │
│  • DTOs @Exclude() prevents serialization           │
│  • No password in any API response                  │
│  → Result: Sensitive data never exposed             │
└─────────────────────────────────────────────────────┘
```

## 🎯 Route Guard Application

```
Public Routes (No Guards)
├─ POST /auth/register
└─ POST /auth/login

Protected Routes (JwtAuthGuard only)
├─ GET  /users/me
└─ PATCH /users/profile

Admin Routes (JwtAuthGuard + RolesGuard + @Roles(ADMIN))
├─ GET    /admin/users
├─ GET    /admin/users/:id
├─ PATCH  /admin/users/:id/status
└─ DELETE /admin/users/:id
```

## 📋 Dependency Injection Flow

```
AppModule
│
├─> Imports PrismaModule
│   └─> PrismaService provided
│       (Singleton - one instance for entire app)
│
├─> Imports AuthModule
│   ├─> Provides AuthService (uses PrismaService)
│   ├─> Provides JwtStrategy (uses PrismaService)
│   └─> Provides AuthController
│
├─> Imports UsersModule
│   ├─> Imports PrismaModule (gets PrismaService)
│   ├─> Provides UsersService (uses PrismaService)
│   └─> Provides UsersController
│
└─> Imports AdminModule
    ├─> Imports PrismaModule (gets PrismaService)
    ├─> Provides AdminService (uses PrismaService)
    └─> Provides AdminController
```

## 🧪 Request Examples Flow

```
Example 1: Login
│
├─ POST /auth/login
│  ├─ Body: { email, password }
│  ├─ No guards
│  ├─ AuthService.login()
│  │  ├─ Find user by email
│  │  ├─ Verify password (bcrypt.compare)
│  │  ├─ Check isActive = true
│  │  └─ Generate JWT token
│  └─ Response: { user, accessToken }
│
├─ Client receives JWT
└─ Client stores in localStorage/secure storage

Example 2: Access Protected Route
│
├─ GET /users/me
│  ├─ Header: Authorization: Bearer <token>
│  ├─ JwtAuthGuard → validates token
│  │  └─ request.user attached
│  ├─ No RolesGuard (no @Roles() decorator)
│  └─ UsersController.getProfile()
│     └─ UsersService.getProfile(user.id)
│        └─ Query user (select without password)
│           └─ Response: { user details, no password }
│
└─ Client receives profile

Example 3: Admin-Only Endpoint
│
├─ DELETE /admin/users/123
│  ├─ Header: Authorization: Bearer <admin-token>
│  ├─ JwtAuthGuard → validates token
│  │  └─ request.user = { id, email, role: "ADMIN" }
│  ├─ RolesGuard → checks @Roles(ADMIN)
│  │  └─ ADMIN in [ADMIN]? YES → continue
│  └─ AdminController.deleteUser(123)
│     └─ AdminService.deleteUser(123)
│        └─ Delete from database
│           └─ Response: { message: "User deleted" }
│
└─ User deleted successfully

Example 4: Clinician Tries Admin Route
│
├─ DELETE /admin/users/123
│  ├─ Header: Authorization: Bearer <clinician-token>
│  ├─ JwtAuthGuard → validates token
│  │  └─ request.user = { id, email, role: "CLINICIAN" }
│  ├─ RolesGuard → checks @Roles(ADMIN)
│  │  └─ CLINICIAN in [ADMIN]? NO
│  │  └─ Throw ForbiddenException
│  └─ Response: 403 Forbidden
│     "User does not have the required role"
│
└─ Access denied
```

This visual guide shows:
- ✅ Complete request flow
- ✅ How guards work sequentially
- ✅ User object journey
- ✅ Security layers
- ✅ Guard applications
- ✅ Dependency injection
- ✅ Practical examples

