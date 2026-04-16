# PneumoDetect Backend - Users & Admin Module Documentation

## 📁 Directory Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── auth-response.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── roles.decorator.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── user-response.dto.ts
│       └── update-profile.dto.ts
│
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── dto/
│       └── update-user-status.dto.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── app.module.ts
```

## 🔐 Authentication Flow

### Request Flow with JWT + RolesGuard

```
1. Client sends request with Authorization: Bearer <token>
   ↓
2. JwtAuthGuard extracts token from Authorization header
   ↓
3. JwtStrategy validates token signature and fetches user from DB
   ↓
4. User object attached to request.user (without password)
   ↓
5. RolesGuard checks @Roles() decorator on the route handler
   ↓
6. If user.role matches required roles → Allow access
   If not → Throw ForbiddenException (403)
   ↓
7. Handler executes with @CurrentUser() decorator injecting user
```

### Example: Admin-Only Endpoint

```typescript
@Delete('users/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async deleteUser(@Param('id') userId: string): Promise<{ message: string }> {
  return this.adminService.deleteUser(userId);
}
```

**What happens:**
1. `@UseGuards(JwtAuthGuard, RolesGuard)` - First validates JWT, then checks role
2. `@Roles(Role.ADMIN)` - Sets metadata that only ADMIN role is allowed
3. RolesGuard reads this metadata and compares with `request.user.role`
4. If user is ADMIN → proceed to handler
5. If user is CLINICIAN → throw 403 Forbidden

## 🛡️ How RolesGuard Works (Step by Step)

```typescript
// 1. Guard receives execution context
canActivate(context: ExecutionContext): boolean {
  
  // 2. Extract metadata from @Roles() decorator
  const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
  
  // 3. If no @Roles() decorator → allow access (public route)
  if (!requiredRoles) {
    return true;
  }
  
  // 4. Get request object
  const request = context.switchToHttp().getRequest();
  const user = request.user; // Attached by JwtAuthGuard
  
  // 5. Verify user exists
  if (!user) {
    throw new ForbiddenException('User not found');
  }
  
  // 6. Check if user's role is in allowed roles
  if (!requiredRoles.includes(user.role)) {
    throw new ForbiddenException('User does not have the required role');
  }
  
  // 7. Allow access
  return true;
}
```

## 👤 How User Info Gets Attached to Request

```typescript
// In JwtStrategy.validate()
async validate(payload: JwtPayload) {
  // Payload contains: { sub: userId, email, role }
  
  // Fetch fresh user from database
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });
  
  // Return user object (password NOT included)
  return {
    id: user.id,
    email: user.email,
    role: user.role,      // Used by RolesGuard
    name: user.name,
    // password is NEVER returned
  };
}

// NestJS Passport automatically attaches this to request.user
// Now accessible via @CurrentUser() decorator
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  // user = { id: '...', email: '...', role: 'CLINICIAN', name: '...' }
}
```

## 🔒 Safe User Responses - Best Practices

### ❌ UNSAFE: Returning raw user object
```typescript
const user = await this.prisma.user.findUnique({ where: { id: userId } });
return user; // ❌ Includes password!
```

### ✅ SAFE: Using .select() to exclude password
```typescript
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    password: false, // Explicitly exclude
    // ... other fields
  },
});
return user; // ✅ No password
```

### ✅ SAFE: Using DTOs for response transformation
```typescript
// UserResponseDto explicitly defines allowed fields
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  
  @Exclude()
  password?: string; // Never serialized
  
  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

// Usage
return new UserResponseDto(user); // Excludes password
```

**Key Pattern:** Always use `.select()` or DTOs when fetching user data to prevent accidental password leaks.

## 📡 API Endpoints

### Authentication (No role required)
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user (returns JWT)
```

### User Profile (JWT Required)
```
GET    /users/me               - Get current user profile
PATCH  /users/profile          - Update own profile (name, phone, specialization, avatarUrl)
```

### Admin Only (JWT + ADMIN role required)
```
GET    /admin/users            - List all users
GET    /admin/users/:id        - Get user by ID
PATCH  /admin/users/:id/status - Toggle user active status
DELETE /admin/users/:id        - Delete a user
```

## 🧪 Example API Calls

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@pneumodetect.com",
    "password": "SecurePass123!",
    "name": "Dr. John Smith",
    "specialization": "Radiology"
  }'

# Response:
{
  "id": "uuid",
  "email": "doctor@pneumodetect.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "isActive": true,
  "createdAt": "2026-04-16T...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@pneumodetect.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User Profile
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/users/profile \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Updated",
    "phone": "+1234567890"
  }'
```

### Admin: Get All Users
```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### Admin: Deactivate User
```bash
curl -X PATCH http://localhost:3000/admin/users/<user-id>/status \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Admin: Delete User
```bash
curl -X DELETE http://localhost:3000/admin/users/<user-id> \
  -H "Authorization: Bearer <admin-jwt-token>"
```

## ✅ Key Features Implemented

1. **JWT Authentication** - Stateless token-based auth
2. **Password Hashing** - bcrypt with 10 salt rounds
3. **Role-Based Access Control (RBAC)** - @Roles() decorator + RolesGuard
4. **User Profile Management** - Self-service profile updates
5. **Admin Dashboard** - Full user management capabilities
6. **Safe Data Responses** - Password never exposed via API
7. **Input Validation** - DTOs with class-validator
8. **Modular Architecture** - Separate auth, users, admin modules

## 🔧 Configuration

Ensure `.env` has:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/pneumodetect"
JWT_SECRET="8Uy93rbxdevP27CakLb4Ar1FrJryKjBxPkbYp83iEz8"
PORT=3000
```

## 🚀 Next Steps

1. Create Patients module for patient management
2. Create Scans module for X-ray upload and processing
3. Integrate with Flask AI service for inference
4. Add file upload for X-ray images
5. Implement notification system
6. Add comprehensive error handling and logging

