# RolesGuard & User Injection - Complete Visual Guide

## 🔀 Complete Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                                   │
│        PATCH /admin/users/:id/status                                │
│        Authorization: Bearer eyJhbGc...                             │
│        Body: { "isActive": false }                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ NestJS Router    │
                    │ Detects guards   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────────────────────────┐
                    │ @UseGuards(JwtAuthGuard, RolesGuard) │
                    └────────┬──────────────────────────────┘
                             │
        ┌────────────────────┴──────────────────────┐
        │                                           │
        ▼                                           ▼
   ┌─────────────┐                         ┌──────────────┐
   │JwtAuthGuard │                         │ RolesGuard   │
   └─────────────┘                         └──────────────┘
        │                                        │
        ├─> Extract token from                  │
        │   Authorization header                │
        │   "Bearer <token>"                    │
        │                                        │
        ├─> Send token to JwtStrategy.validate()│
        │                                        │
        ├─> JwtStrategy:                        │
        │   • Verify token signature            │
        │   • Decode JWT payload                │
        │   • Extract: sub, email, role         │
        │   • Query DB: SELECT * FROM users...  │
        │   • Return user object                │
        │     (WITHOUT password)                │
        │                                        │
        ├─> Attach user to request.user         │
        │   {                                    │
        │     id: 'user-123',                   │
        │     email: 'admin@...',               │
        │     role: 'ADMIN',                    │
        │     name: 'Admin User'                │
        │   }                                    │
        │                                        │
        └──────────────────┬─────────────────────┘
                           │
                           ▼ [JwtAuthGuard passes]
                           │
    ┌──────────────────────▼──────────────────────┐
    │ RolesGuard.canActivate(context)              │
    │                                              │
    │ 1. Use Reflector to get @Roles() metadata   │
    │    const requiredRoles =                    │
    │      this.reflector.get('roles',            │
    │      context.getHandler());                 │
    │    Result: [Role.ADMIN]                     │
    │                                              │
    │ 2. Get request object                       │
    │    const user = request.user                │
    │    // user = { id: '...', role: 'ADMIN' }   │
    │                                              │
    │ 3. Verify user exists                       │
    │    if (!user) throw ForbiddenException      │
    │                                              │
    │ 4. Check role                               │
    │    if (!requiredRoles.includes(user.role))  │
    │      throw ForbiddenException               │
    │    // Check: 'ADMIN' in [Role.ADMIN]? YES   │
    │                                              │
    │ 5. Return true (allow access)               │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Route Handler Executes        │
        │ @Param('id') userId          │
        │ @Body() updateUserStatusDto  │
        │ @CurrentUser() user: any     │
        │                              │
        │ Calls: adminService.update   │
        │ Database update executed     │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Response Sent to Client
        │ {
        │   "id": "user-456",
        │   "email": "user@...",
        │   "isActive": false,
        │   ...
        │   (NO password field)
        │ }
        └──────────────────────┘
```

## 🎯 Guard Execution Order

```
Request → Guard 1 (JwtAuthGuard)
          ├─> Authenticate JWT
          ├─> Validate signature
          ├─> Attach user to request
          └─> Continue if OK
              │
              ▼
          Guard 2 (RolesGuard)
          ├─> Read @Roles() metadata
          ├─> Get user from request.user
          ├─> Check if user.role matches
          └─> Continue if OK
              │
              ▼
          Handler executes
          ├─> User available via @CurrentUser()
          └─> Returns response
```

## 🔑 Key Code Snippets

### 1. Guard Declaration in Controller
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)  // Order matters!
export class AdminController {
  
  @Patch('users/:id/status')
  @Roles(Role.ADMIN)  // Metadata for RolesGuard
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() user: any,  // Injected by @CurrentUser()
  ): Promise<UserResponseDto> {
    console.log('Admin user:', user);  // { id, email, role, name }
    return this.adminService.updateUserStatus(userId, updateUserStatusDto);
  }
}
```

### 2. JwtStrategy Validation
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // This is called automatically by Passport
    // Return value is attached to request.user
    
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;  // JWT invalid if user inactive
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,      // Critical for RolesGuard!
      name: user.name,
      // password intentionally omitted
    };
  }
}
```

### 3. RolesGuard Implementation
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 1: Get @Roles() metadata
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    
    // Step 2: No @Roles() means public access
    if (!requiredRoles) {
      return true;
    }

    // Step 3: Get user from request (attached by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Step 4: Verify user exists
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Step 5: Check role
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('User does not have required role');
    }

    return true;
  }
}
```

### 4. @Roles() Decorator
```typescript
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Usage:
@Roles(Role.ADMIN)                    // Only ADMIN
@Roles(Role.ADMIN, Role.CLINICIAN)    // ADMIN or CLINICIAN
@Roles()                              // Error: requires roles
// No @Roles() decorator              // Public access
```

### 5. @CurrentUser() Decorator
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // Injected by JwtAuthGuard
  },
);

// Usage:
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  // user = { id, email, role, name }
  // user is available because JwtAuthGuard validated JWT
  // and attached user to request
}
```

## 🛡️ Security Best Practices Implemented

### ✅ Password Never Exposed
```typescript
// ❌ UNSAFE
await this.prisma.user.findUnique({ where: { id } });
// Returns: { id, email, password, name, ... } ❌

// ✅ SAFE
await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    password: false,  // Explicitly exclude
  },
});
// Returns: { id, email, name } ✅
```

### ✅ Role-Based Access Control
```typescript
@Roles(Role.ADMIN)  // Only ADMIN can access
async deleteUser(@Param('id') userId: string) {
  // Non-admin users get 403 Forbidden
}
```

### ✅ Fresh User Check in JWT Strategy
```typescript
// Verify user still exists and is active
const user = await this.prisma.user.findUnique({
  where: { id: payload.sub },
});

if (!user || !user.isActive) {
  return null;  // Invalidate token
}
```

### ✅ Consistent Response DTOs
```typescript
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  
  @Exclude()  // Never serialized
  password?: string;
}

// Usage ensures password never leaks
return new UserResponseDto(user);
```

## 📊 Error Handling

```
Request → JwtAuthGuard
  │
  ├─> No token provided
  │   └─> 401 Unauthorized
  │
  ├─> Invalid token
  │   └─> 401 Unauthorized
  │
  ├─> Token expired
  │   └─> 401 Unauthorized
  │
  ├─> User not found
  │   └─> 401 Unauthorized
  │
  ├─> User inactive
  │   └─> 401 Unauthorized
  │
  └─> Token valid, user attached
      │
      └─> RolesGuard
          │
          ├─> No @Roles() decorator
          │   └─> Allow (public)
          │
          ├─> User role not in @Roles()
          │   └─> 403 Forbidden
          │
          └─> User role matches
              └─> Allow (proceed)
```

## 🧪 Testing the Flow

### Test 1: No Token
```bash
curl -X PATCH http://localhost:3000/admin/users/123/status \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Response: 401 Unauthorized
# "message": "Unauthorized"
```

### Test 2: Clinician Token on Admin Endpoint
```bash
curl -X PATCH http://localhost:3000/admin/users/123/status \
  -H "Authorization: Bearer <clinician-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Response: 403 Forbidden
# "message": "User does not have the required role"
```

### Test 3: Admin Token on Admin Endpoint
```bash
curl -X PATCH http://localhost:3000/admin/users/123/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Response: 200 OK
# { "id": "123", "email": "...", "isActive": false, ... }
```

