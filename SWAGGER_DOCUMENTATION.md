# 📚 Swagger API Documentation Setup

## Overview

Swagger (OpenAPI 3.0) is now integrated into your PneumoDetect backend! This provides an interactive, web-based UI to explore and test your API endpoints.

---

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run start:dev
```

### 2. Open Swagger UI

Navigate to:
```
http://localhost:3000/api
```

You'll see the interactive API documentation with:
- ✅ All 7 modules and their endpoints
- ✅ Request/response schemas
- ✅ Example values for DTOs
- ✅ JWT authentication integration
- ✅ Try-it-out functionality

---

## 🔧 Features Enabled

### 1. Bearer Token Authentication
- Click **"Authorize"** button at top-right
- Paste your JWT token (without "Bearer " prefix)
- All subsequent requests include the token

### 2. Interactive Testing
- Expand any endpoint
- Click **"Try it out"**
- Edit request body/parameters
- Click **"Execute"**
- View response, headers, and curl command

### 3. Schema Documentation
- Click any response type
- See full TypeScript interface
- View field descriptions and types

---

## 📋 Available Endpoints in Swagger

### Auth Module
```
POST   /auth/register          Register new user
POST   /auth/login             Login and get JWT
GET    /auth/me                Get current user (requires JWT)
```

### Notifications Module
```
GET    /notifications          Get all notifications
GET    /notifications/:id      Get single notification
PATCH  /notifications/:id/read Mark as read/unread
POST   /notifications          Create notification
DELETE /notifications/:id      Delete notification
POST   /notifications/mark-all-read  Mark all as read
```

### Users Module
```
GET    /users/profile          Get your profile
PATCH  /users/profile          Update profile
GET    /users                  List users (admin)
GET    /users/:id              Get user by ID
```

### Admin Module
```
PATCH  /admin/users/:id/role   Change user role
GET    /admin/stats            System statistics
DELETE /admin/users/:id        Delete user
```

### Patients Module
```
POST   /patients               Create patient
GET    /patients               List patients
GET    /patients/:id           Get patient by ID
PATCH  /patients/:id           Update patient
```

### Scans Module
```
POST   /scans/upload           Upload X-ray
GET    /scans                  List scans
GET    /scans/:id              Get scan by ID
POST   /scans/:id/process      Process with AI
```

### Analytics Module
```
GET    /analytics/stats        Dashboard statistics
```

---

## 🔐 Using JWT Authentication in Swagger

### Step 1: Get a JWT Token

1. Open the **Auth** section
2. Click **POST /auth/login**
3. Click **"Try it out"**
4. Enter credentials:
   ```json
   {
     "email": "doctor@hospital.com",
     "password": "Pass123!"
   }
   ```
5. Click **"Execute"**
6. Copy the `access_token` from response

### Step 2: Authorize Requests

1. Click the green **"Authorize"** button at the top
2. Select **"Bearer"** type
3. Paste your token (paste only the token, not "Bearer TOKEN")
4. Click **"Authorize"**
5. Click **"Close"**

### Step 3: Make Authenticated Requests

All subsequent requests will include the Authorization header automatically!

---

## 💡 Example Workflow

### Workflow 1: Register and Get Notifications

```
1. POST /auth/register
   - Register new user with email/password

2. POST /auth/login
   - Login to get JWT token
   - Copy the access_token

3. Click "Authorize" button
   - Paste your token
   - Click "Authorize"

4. GET /notifications
   - Get all your notifications

5. GET /notifications/:id
   - Get specific notification by ID

6. PATCH /notifications/:id/read
   - Mark notification as read
   - Send: { "read": true }
```

### Workflow 2: Testing Scan Processing

```
1. Authorize with your JWT token (see above)

2. GET /patients
   - Copy a patient ID

3. POST /scans/upload
   - Select a scan image file
   - Paste patient ID

4. GET /scans
   - View all your scans
   - Copy a scan ID

5. POST /scans/:id/process
   - Process the scan with AI
   - Wait for response

6. GET /notifications
   - New notification created automatically!
```

---

## 📊 Viewing Response Schemas

1. Look for **"Response 200"** or other status codes
2. Click on the blue **schema** link
3. See the full TypeScript interface
4. Includes:
   - Field names
   - Field types
   - Required vs optional fields
   - Example values

---

## 🛠️ Adding Swagger Decorators to New Endpoints

When you create new endpoints, add Swagger decorators:

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Your Module')
@Controller('your-route')
export class YourController {
  @Get()
  @ApiOperation({ summary: 'Brief description of what endpoint does' })
  @ApiResponse({
    status: 200,
    description: 'Success response description',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not found error description',
  })
  async getYourData(): Promise<ResponseDto> {
    // implementation
  }
}
```

---

## 🔗 Key Decorators Reference

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@ApiTags` | Group endpoints by module | `@ApiTags('Notifications')` |
| `@ApiOperation` | Endpoint title/summary | `@ApiOperation({ summary: 'Get all items' })` |
| `@ApiResponse` | Document response | `@ApiResponse({ status: 200, type: MyDto })` |
| `@ApiBearerAuth` | Mark endpoint as protected | `@ApiBearerAuth('access_token')` |
| `@ApiParam` | Document URL parameters | `@ApiParam({ name: 'id', type: 'string' })` |
| `@ApiBody` | Document request body | `@ApiBody({ type: CreateDto })` |

---

## 📱 Mobile Development with Swagger

### JavaScript/TypeScript Client

```typescript
// Generate TypeScript client from Swagger
npm install -g @openapitools/openapi-generator-cli

openapi-generator-cli generate -i http://localhost:3000/api-json \
  -g typescript-fetch -o ./generated-client
```

### React Native

```typescript
// Fetch from Swagger JSON
const response = await fetch('http://localhost:3000/api-json');
const swaggerSpec = await response.json();

// Use to generate TypeScript types
// See: https://github.com/OpenAPITools/openapi-generator
```

---

## 🚀 Deployment Considerations

### Production Swagger URL
```
https://your-api-domain.com/api
```

### Disable in Production (Optional)
```typescript
// In main.ts
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api', app, document);
}
```

### Download OpenAPI JSON
- Navigate to: `http://localhost:3000/api-json`
- Save the JSON file
- Use for client generation

---

## 📖 Resources

### Official Documentation
- [NestJS Swagger Integration](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

### API Code Generation Tools
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)
- [NSwag](https://github.com/RicoSuter/NSwag)

---

## ✅ Verification Checklist

- ✅ Started server with `npm run start:dev`
- ✅ Swagger UI accessible at `http://localhost:3000/api`
- ✅ Can see all 7 modules and endpoints
- ✅ Can authenticate with JWT token
- ✅ Can execute test requests
- ✅ Response schemas visible
- ✅ Notifications endpoints documented

---

## 🎉 Next Steps

1. **Test Your API**
   - Use Swagger UI to test all endpoints
   - Verify authentication works
   - Test error cases

2. **Integrate with Mobile**
   - Use Swagger JSON endpoint
   - Generate TypeScript client
   - Integrate into React Native app

3. **Document Further**
   - Add more detailed descriptions
   - Add examples for complex DTOs
   - Add common error codes

4. **Share with Team**
   - Share Swagger URL with frontend team
   - Frontend can develop in parallel
   - No backend changes needed

---

**Status:** ✅ Swagger Integration Complete!

Access it at: **http://localhost:3000/api**

