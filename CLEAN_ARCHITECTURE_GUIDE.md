# Clean Architecture Quick Reference Guide

## How to Use the Refactored Components

### 1. Authentication Helpers

#### PasswordHelper
```typescript
// In your service constructor
constructor(private passwordHelper: PasswordHelper) {}

// Hashing password
const hashedPassword = await this.passwordHelper.hash(userPassword);

// Comparing password
const isValid = await this.passwordHelper.compare(inputPassword, storedHash);
```

#### OtpHelper
```typescript
constructor(private otpHelper: OtpHelper) {}

// Generate OTP
const otp = this.otpHelper.generateOtp(); // Returns 6-digit string

// Get expiry time (10 minutes from now)
const expiryTime = this.otpHelper.getOtpExpiry(10);

// Check if expired
const isExpired = this.otpHelper.isOtpExpired(expiryTime);
```

#### AuthValidator
```typescript
constructor(private authValidator: AuthValidator) {}

// Validate patient fields
this.authValidator.validatePatientFields(Role.PATIENT, registerDto);

// Validate clinician fields
this.authValidator.validateClinicianFields(Role.CLINICIAN, registerDto);
```

#### TokenBuilder
```typescript
constructor(private tokenBuilder: TokenBuilder) {}

// Generate JWT token
const token = this.tokenBuilder.generateToken(userId, email, role);

// Build auth response
const response = this.tokenBuilder.buildAuthResponse(user, token);
```

### 2. Query Builders

#### ScanQueryBuilder
```typescript
constructor(private scanQueryBuilder: ScanQueryBuilder) {}

// Get where clause for user (ADMIN sees all, CLINICIAN sees own)
const where = this.scanQueryBuilder.buildUserWhereClause(userId, userRole);
const scans = await this.prisma.scan.findMany({ where });

// Get completed scans filter
const where = {
  ...otherFilters,
  ...this.scanQueryBuilder.buildCompletedScansFilter()
};
```

### 3. Result Builders

#### ScanResultsBuilder
```typescript
constructor(private resultsBuilder: ScanResultsBuilder) {}

// Calculate result breakdown (pneumonia, normal, concerns %)
const breakdown = this.resultsBuilder.calculateResultBreakdown(scans);

// Get confidence distribution
const distribution = this.resultsBuilder.calculateConfidenceDistribution(scans);

// Get average confidence
const avgConfidence = this.resultsBuilder.calculateAverageConfidence(scans);

// Build 7-day timeline
const timeline = this.resultsBuilder.buildTimelineData(scans);
```

### 4. Common Module Utilities

#### ResponseBuilder
```typescript
constructor(private responseBuilder: ResponseBuilder) {}

// Success response
return this.responseBuilder.buildSuccess(data, 'Operation completed');

// Paginated response
return this.responseBuilder.buildPaginatedResponse(items, total, page, pageSize);

// Error response
return this.responseBuilder.buildError('Invalid input', 'VALIDATION_ERROR');
```

#### DateHelper
```typescript
constructor(private dateHelper: DateHelper) {}

// Get today at 00:00:00
const todayStart = this.dateHelper.getToday();

// Get today at 23:59:59
const todayEnd = this.dateHelper.getTodayEnd();

// Get 7 days ago
const weekAgo = this.dateHelper.getLastNDays(7);

// Format date
const formatted = this.dateHelper.formatDate(date, 'YYYY-MM-DD');

// Days between dates
const days = this.dateHelper.getDaysBetween(startDate, endDate);
```

#### StringHelper
```typescript
constructor(private stringHelper: StringHelper) {}

// Truncate string
const short = this.stringHelper.truncate(longString, 50); // "..."

// Capitalize
const capital = this.stringHelper.capitalize('hello'); // "Hello"

// Slugify
const slug = this.stringHelper.slugify('Hello World!'); // "hello-world"

// Random string
const random = this.stringHelper.generateRandomString(20);

// Email validation
if (this.stringHelper.isEmail(email)) { ... }

// Phone validation
if (this.stringHelper.isPhoneNumber(phone)) { ... }
```

#### DataValidator
```typescript
constructor(private dataValidator: DataValidator) {}

// Validate email format
this.dataValidator.validateEmail(email);

// Validate password requirements
this.dataValidator.validatePassword(password);

// Validate phone
this.dataValidator.validatePhoneNumber(phone);

// Validate pagination
this.dataValidator.validatePaginationParams(page, pageSize);

// Validate ID
this.dataValidator.validateId(id);
```

#### Mappers
```typescript
constructor(
  private scanMapper: ScanMapper,
  private userMapper: UserMapper
) {}

// Map scan response
const response = this.scanMapper.toScanResponseDto(scanEntity);

// Map scan with patient
const response = this.scanMapper.toScanWithPatientDto(scanEntity);

// Map scans array
const responses = this.scanMapper.toScansArray(scansArray);

// Map user response (excludes sensitive fields)
const response = this.userMapper.toUserResponseDto(userEntity);

// Public user profile
const profile = this.userMapper.toPublicUserDto(userEntity);

// User with profile
const full = this.userMapper.toUserWithProfileDto(userEntity, profileData);
```

## Injecting Helpers Into Your Service

### Step 1: Add CommonModule to your module imports
```typescript
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

### Step 2: Inject in your service
```typescript
import { DateHelper } from '../common/helpers/date.helper';
import { ResponseBuilder } from '../common/builders/response.builder';

@Injectable()
export class YourService {
  constructor(
    private dateHelper: DateHelper,
    private responseBuilder: ResponseBuilder,
  ) {}

  async someMethod() {
    const today = this.dateHelper.getToday();
    return this.responseBuilder.buildSuccess(data);
  }
}
```

## Creating New Helpers

### Template
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class YourNewHelper {
  // Methods go here
  methodName() {
    // Implementation
  }
}
```

### Steps
1. Create file in appropriate folder (helpers, builders, validators, mappers)
2. Use `@Injectable()` decorator
3. Implement methods
4. Add to CommonModule exports
5. Inject where needed

## Best Practices

✅ **Keep helpers focused**: One helper = one responsibility
✅ **No database queries**: Helpers shouldn't access PrismaService directly
✅ **Reuse helpers**: Use across multiple services
✅ **Error handling**: Helpers should throw descriptive errors
✅ **Type safety**: Always use TypeScript types, no `any`
✅ **Documentation**: Add JSDoc comments for public methods
✅ **Unit testable**: Helpers should be independently testable

## Common Patterns

### Pattern: Validation + Transformation
```typescript
// In your controller/service
this.dataValidator.validateEmail(email);
const slug = this.stringHelper.slugify(username);
```

### Pattern: Build complex response
```typescript
const breakdown = this.resultsBuilder.calculateResultBreakdown(scans);
const distribution = this.resultsBuilder.calculateConfidenceDistribution(scans);
const timeline = this.resultsBuilder.buildTimelineData(scans);

return this.responseBuilder.buildSuccess({
  breakdown,
  distribution,
  timeline,
});
```

### Pattern: Date-based queries
```typescript
const today = this.dateHelper.getToday();
const weekAgo = this.dateHelper.getLastNDays(7);

const scans = await this.prisma.scan.findMany({
  where: {
    createdAt: { gte: weekAgo, lt: today },
  },
});
```

---

For more details, see `REFACTORING_SUMMARY.md`
