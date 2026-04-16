# 🚀 Quick Start Guide - PneumoDetect Backend

## ⚡ Getting Started (3 Steps)

### 1. Start the Database
```bash
docker-compose up -d
```

### 2. Start the Server
```bash
npm run start:dev
```

Server runs on: **http://localhost:3000**

### 3. Test the API
See examples below ↓

---

## 🔐 Authentication Flow

### Step 1: Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@pneumodetect.com",
    "password": "Secure123!",
    "name": "Dr. John Smith",
    "specialization": "Radiology"
  }'
```

**Response:**
```json
{
  "id": "uuid-123",
  "email": "doctor@pneumodetect.com",
  "name": "Dr. John Smith",
  "role": "CLINICIAN",
  "specialization": "Radiology",
  "isActive": true,
  "createdAt": "2026-04-16T...",
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Step 2: Login (Get Token)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@pneumodetect.com",
    "password": "Secure123!"
  }'
```

**Response:** Same as register + `accessToken`

**Save this token!** ⬇️
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Step 3: Use Token for Protected Routes

Replace `<your-token>` with the `accessToken` from login/register

---

## 👤 User Endpoints

### Get Your Profile
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer <your-token>"
```

### Update Your Profile
```bash
curl -X PATCH http://localhost:3000/users/profile \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Updated",
    "phone": "+1234567890",
    "avatarUrl": "https://..."
  }'
```

---

## 👑 Admin Endpoints (ADMIN Role Required)

**Note:** You need to create an ADMIN user in the database or update an existing user's role.

### Create Admin User (Database)
```bash
# Connect to database
docker exec -it pneumodetect_postgres psql -U postgres -d pneumodetect

# Update user role to ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@pneumodetect.com';
```

Then login with that user to get admin token.

### List All Users
```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer <admin-token>"
```

### Get Specific User
```bash
curl -X GET http://localhost:3000/admin/users/<user-id> \
  -H "Authorization: Bearer <admin-token>"
```

### Deactivate User
```bash
curl -X PATCH http://localhost:3000/admin/users/<user-id>/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Activate User
```bash
curl -X PATCH http://localhost:3000/admin/users/<user-id>/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/admin/users/<user-id> \
  -H "Authorization: Bearer <admin-token>"
```

---

## 🗂️ File Structure

```
src/
├── auth/                      # Authentication
├── users/                     # User profile management
├── admin/                     # Admin dashboard
├── prisma/                    # Database
└── app.module.ts             # Main module
```

---

## 🔧 Configuration

### .env File
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/pneumodetect"
JWT_SECRET="8Uy93rbxdevP27CakLb4Ar1FrJryKjBxPkbYp83iEz8"
PORT=3000
```

### Database
- **Host:** localhost:5434
- **User:** postgres
- **Password:** postgres
- **Database:** pneumodetect

---

## 📊 API Summary

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /auth/register | ❌ | - | Register new user |
| POST | /auth/login | ❌ | - | Login user |
| GET | /users/me | ✅ | - | Get profile |
| PATCH | /users/profile | ✅ | - | Update profile |
| GET | /admin/users | ✅ | ADMIN | List all users |
| GET | /admin/users/:id | ✅ | ADMIN | Get user by ID |
| PATCH | /admin/users/:id/status | ✅ | ADMIN | Toggle status |
| DELETE | /admin/users/:id | ✅ | ADMIN | Delete user |

---

## 🛠️ Useful Commands

```bash
# Build
npm run build

# Start development
npm run start:dev

# Run tests
npm run test

# Format code
npm run format

# Lint
npm run lint

# Access database
docker exec -it pneumodetect_postgres psql -U postgres -d pneumodetect
```

---

## ⚠️ Common Errors

### "Unauthorized"
- Missing/invalid JWT token
- Token expired
- User deactivated

**Solution:** Get new token via login

### "User does not have the required role"
- User is not ADMIN
- Trying to access admin endpoint as CLINICIAN

**Solution:** Use admin account or don't use admin endpoints

### "Connection refused"
- Docker container not running
- Database not started

**Solution:** 
```bash
docker-compose up -d
```

### "Invalid email or password"
- Wrong credentials
- User doesn't exist

**Solution:** Check email and password, register if needed

---

## 📚 Documentation

For detailed information:
- **API Reference:** `USERS_ADMIN_DOCUMENTATION.md`
- **Architecture:** `ARCHITECTURE_VISUAL_GUIDE.md`
- **Security:** `ROLES_GUARD_COMPLETE_GUIDE.md`
- **Implementation:** `COMPLETE_IMPLEMENTATION.md`

---

## 🎯 Workflow Example

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register ...
# Get: token and user ID

# 2. Login
curl -X POST http://localhost:3000/auth/login ...
# Get: new token

# 3. Get profile
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer <token>"

# 4. Update profile
curl -X PATCH http://localhost:3000/users/profile \
  -H "Authorization: Bearer <token>" \
  -d '{"phone": "..."}'

# 5. Admin operations (if ADMIN)
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer <admin-token>"
```

---

## ✅ Verification

After starting, verify everything works:

```bash
# 1. Check server is running
curl http://localhost:3000

# 2. Register test user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test12345","name":"Test"}'

# 3. Should return user object with accessToken

# All working? ✅ You're ready to go!
```

---

## 🚀 Next Steps

1. **Create Patients Module** - Patient management
2. **Create Scans Module** - X-ray upload/processing
3. **Create Notifications** - Alert system
4. **Connect AI Service** - Flask inference integration

---

## 💡 Tips

- Use Postman or Insomnia for easier API testing
- Save common requests as collections
- Keep your JWT token saved during development
- Use different tokens for user vs admin testing
- Check database with: `docker exec -it pneumodetect_postgres psql -U postgres -d pneumodetect`

---

**Happy coding!** 🎉

